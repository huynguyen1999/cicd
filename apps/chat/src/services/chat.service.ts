import { Injectable } from '@nestjs/common';
import { GetMessagesDto, MessagingDto, SeenMessagesDto } from '@app/common';
import { MessageRepository } from '@app/database';
import { Types } from 'mongoose';

@Injectable()
export class ChatService {
  constructor(private readonly messageRepository: MessageRepository) {}
  async handleNewMessage(userId: string, data: MessagingDto) {
    const { room_id, message } = data;
    return await this.messageRepository.create({
      room: new Types.ObjectId(room_id),
      sender: new Types.ObjectId(userId),
      content: message,
      seen_by: [
        {
          user: new Types.ObjectId(userId),
          seen_at: new Date(),
        },
      ],
    });
  }
  async handleNotice(data: MessagingDto) {
    const { room_id, message } = data;
    return await this.messageRepository.create({
      room: new Types.ObjectId(room_id),
      content: message,
    });
  }
  async handleSeenMessages(userId: string, data: SeenMessagesDto) {
    const { room_id, message_ids } = data;
    const seenReceipt = {
      user: new Types.ObjectId(userId),
      seen_at: new Date(),
    };
    // Update all messages that have not been seen by the user
    const filter = {
      _id: { $in: message_ids },
      room: room_id,
      'seen_by.user': { $ne: new Types.ObjectId(userId) },
      sender: { $ne: new Types.ObjectId(userId) },
    };

    const messages = await this.messageRepository.find(filter, {
      _id: 1,
      seen_by: 1,
    });
    for (const message of messages) {
      message.seen_by.push(seenReceipt);
    }

    await this.messageRepository.updateMany(filter, {
      $push: { seen_by: seenReceipt },
    });
    return messages;
  }

  async getMessages(userId: string, data: GetMessagesDto) {
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
}
