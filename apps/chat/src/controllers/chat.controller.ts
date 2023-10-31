import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Controller, UseGuards } from '@nestjs/common';
import {
  MessagingDto,
  SeenMessagesDto,
  GetMessagesDto,
  ReactMessageDto,
  EditMessageDto,
  DeleteMessagesDto,
  CurrentUser,
  RpcRequest,
} from '@app/common';
import { ChatService } from '../services';
import { StsAuthGuard } from '@app/sts-auth';

@UseGuards(StsAuthGuard)
@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @RabbitRPC({
    routingKey: 'chat.message',
    exchange: 'exchange',
    queue: 'chat.message',
  })
  async handleNewMessage(@RabbitPayload() payload: RpcRequest<MessagingDto>) {
    const { data, user } = payload;
    return await this.chatService.handleNewMessage(data, user);
  }
  @RabbitRPC({
    routingKey: 'chat.notice',
    exchange: 'exchange',
    queue: 'chat.notice',
  })
  async handleNotice(@RabbitPayload() payload: MessagingDto) {
    return await this.chatService.handleNotice(payload);
  }

  @RabbitRPC({
    routingKey: 'chat.seenMessages',
    exchange: 'exchange',
    queue: 'chat.seenMessages',
  })
  async handleSeenMessages(
    @RabbitPayload() payload: RpcRequest<SeenMessagesDto>,
  ) {
    const { data, user } = payload;
    return await this.chatService.handleSeenMessages(data, user);
  }

  @RabbitRPC({
    routingKey: 'chat.getMessages',
    exchange: 'exchange',
    queue: 'chat.getMessages',
  })
  async getMessages(@RabbitPayload() payload: RpcRequest<GetMessagesDto>) {
    const { data, user } = payload;
    return await this.chatService.getMessages(data, user);
  }

  @RabbitRPC({
    routingKey: 'chat.reactMessage',
    exchange: 'exchange',
    queue: 'chat.reactMessage',
  })
  async reactMessage(@RabbitPayload() payload: RpcRequest<ReactMessageDto>) {
    const { data, user } = payload;
    return await this.chatService.reactMessage(data, user);
  }

  @RabbitRPC({
    routingKey: 'chat.editMessage',
    exchange: 'exchange',
    queue: 'chat.editMessage',
  })
  async editMessage(@RabbitPayload() payload: RpcRequest<EditMessageDto>) {
    const { data, user } = payload;
    return await this.chatService.editMessage(data, user);
  }

  @RabbitRPC({
    routingKey: 'chat.deleteMessages',
    exchange: 'exchange',
    queue: 'chat.deleteMessages',
  })
  async deleteMessages(
    @RabbitPayload() payload: RpcRequest<DeleteMessagesDto>,
  ) {
    const { data, user } = payload;
    return await this.chatService.deleteMessages(data, user);
  }
}
