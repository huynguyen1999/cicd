import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Controller } from '@nestjs/common';
import {
  MessagingDto,
  SeenMessagesDto,
  RpcRequest,
  GetMessagesDto,
} from '@app/common';
import { ChatService } from '../services';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @RabbitRPC({
    routingKey: 'chat.messaging',
    exchange: 'exchange',
    queue: 'chat.messaging',
  })
  async handleNewMessage(@RabbitPayload() payload: RpcRequest<MessagingDto>) {
    try {
      const { user_id, data } = payload;
      return await this.chatService.handleNewMessage(user_id, data);
    } catch (exception) {
      console.log(exception);
      return {
        success: false,
        exception,
      };
    }
  }

  @RabbitRPC({
    routingKey: 'chat.notice',
    exchange: 'exchange',
    queue: 'chat.notice',
  })
  async handleNotice(@RabbitPayload() payload: MessagingDto) {
    try {
      return await this.chatService.handleNotice(payload);
    } catch (exception) {
      console.log(exception);
      return {
        success: false,
        exception,
      };
    }
  }

  @RabbitRPC({
    routingKey: 'chat.seenMessages',
    exchange: 'exchange',
    queue: 'chat.seenMessages',
  })
  async handleSeenMessages(
    @RabbitPayload() payload: RpcRequest<SeenMessagesDto>,
  ) {
    try {
      const { user_id, data } = payload;
      return await this.chatService.handleSeenMessages(user_id, data);
    } catch (exception) {
      console.log(exception);
      return {
        success: false,
        exception,
      };
    }
  }

  @RabbitRPC({
    routingKey: 'chat.getMessages',
    exchange: 'exchange',
    queue: 'chat.getMessages',
  })
  async getMessages(@RabbitPayload() payload: RpcRequest<GetMessagesDto>) {
    try {
      const { user_id, data } = payload;
      return await this.chatService.getMessages(user_id, data);
    } catch (exception) {
      console.log(exception);
      return {
        success: false,
        exception,
      };
    }
  }
}
