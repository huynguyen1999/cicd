import { Injectable } from '@nestjs/common';
import {
  DeleteMessagesDto,
  EditMessageDto,
  GetMessagesDto,
  MessagingDto,
  ReactMessageDto,
  SeenMessagesDto,
  UploadType,
  UploadedFileStatus,
} from '@app/common';
import {
  Message,
  MessageDocument,
  MessageRepository,
  UploadedFileRepository,
  User,
} from '@app/database';
import { Types } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import * as DayJS from 'dayjs';
import * as FileSystem from 'fs';
@Injectable()
export class ChatService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly uploadedFileRepository: UploadedFileRepository,
  ) {}

  async handleNewMessage(data: MessagingDto, user: User) {
    const { room_id, message, file_name } = data;

    const messageData: any = {
      room: new Types.ObjectId(room_id),
      sender: new Types.ObjectId(user._id),
      content: message,
      seen_by: [
        {
          user: new Types.ObjectId(user._id),
          time: new Date(),
        },
      ],
    };

    if (file_name) {
      const file = await this.uploadedFileRepository.findOne({
        name: file_name,
        is_deleted: false,
        status: UploadedFileStatus.Active,
        upload_type: UploadType.MessageMedia,
      });
      if (!file || !FileSystem.existsSync(file.path)) {
        throw new RpcException(`File not found`);
      }
      messageData.attachment = file.path;
    }
    return await this.messageRepository.create(messageData as MessageDocument);
  }
  async handleNotice(data: MessagingDto) {
    const { room_id, message } = data;
    return await this.messageRepository.create({
      room: new Types.ObjectId(room_id),
      content: message,
    } as MessageDocument);
  }
  async handleSeenMessages(data: SeenMessagesDto, user: User) {
    const { room_id, message_ids } = data;
    const seenReceipt = {
      user: new Types.ObjectId(user._id),
      time: new Date(),
    };
    // Update all messages that have not been seen by the user
    const filter = {
      _id: { $in: message_ids },
      room: room_id,
      'seen_by.user': { $ne: new Types.ObjectId(user._id) },
      sender: { $ne: new Types.ObjectId(user._id) },
      is_deleted: false,
    };

    const messages = await this.messageRepository.find(filter, {
      _id: 1,
      seen_by: 1,
    });
    if (!messages?.length) {
      throw new RpcException(`No messages found`);
    }
    for (const message of messages) {
      message.seen_by.push(seenReceipt);
    }

    await this.messageRepository.updateMany(filter, {
      $push: { seen_by: seenReceipt },
    });
    return messages;
  }

  async getMessages(data: GetMessagesDto, user: User) {
    const messagePagination = await this.messageRepository.paginate(
      {
        room: new Types.ObjectId(data.room_id),
      },
      {
        offset: data.skip,
        limit: data.limit,
        sort: '-created_at',
      },
    );
    return messagePagination.docs;
  }

  async reactMessage(data: ReactMessageDto, user: User) {
    const message = await this.messageRepository.findOne({
      _id: data.message_id,
      room_id: data.room_id,
      is_deleted: false,
    });
    if (!message) {
      throw new RpcException(`Message not found`);
    }
    const messageReactions = message.reacted_by.filter(
      (reaction) => reaction.user.toString() !== user._id.toString(),
    );
    messageReactions.push({
      reaction: data.reaction,
      time: new Date(),
      user: new Types.ObjectId(user._id),
    });
    return await this.messageRepository.findOneAndUpdate(
      {
        _id: data.message_id,
        room_id: data.room_id,
      },
      {
        reacted_by: messageReactions,
      },
      {
        projection: { reacted_by: 1 },
      },
    );
  }

  async editMessage(data: EditMessageDto, user: User) {
    const filter = {
      _id: data.message_id,
      room: data.room_id,
      sender: user._id,
      is_deleted: false,
    };
    const message = await this.messageRepository.findOne(filter, {
      created_at: 1,
      content: 1,
    });
    if (!message) {
      throw new RpcException(`Message not found`);
    }
    const dateDiff = DayJS().diff(message.created_at, 'day');
    if (dateDiff > 1) {
      throw new RpcException(`Message cannot be edited after 24 hours`);
    }
    return await this.messageRepository.findOneAndUpdate(
      filter,
      {
        content: data.content,
        $push: {
          history: {
            content: message.content,
            time: new Date(),
          },
        },
      },
      {
        projection: { content: 1 },
      },
    );
  }
  async deleteMessages(data: DeleteMessagesDto, user: User) {
    const filter = {
      _id: { $in: data.message_ids },
      room: data.room_id,
      created_by: user._id,
      is_deleted: false,
    };
    const messages = await this.messageRepository.find(filter, { _id: 1 });
    if (!messages?.length) {
      throw new RpcException(`Messages not found`);
    }
    await this.messageRepository.updateMany(filter, {
      is_deleted: true,
      deleted_at: new Date(),
    });
    return messages;
  }
}
