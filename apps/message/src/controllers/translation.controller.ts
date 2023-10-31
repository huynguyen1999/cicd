import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Controller, UseGuards } from '@nestjs/common';
import { RpcRequest, TranslateMessageDto } from '@app/common';
import { MessageTranslationService } from '../services';
import { SessionGuard } from "../../../gateway/src/guards"

@Controller()
export class MessageTranslationController {
  constructor(private translateService: MessageTranslationService) {}

  @RabbitRPC({
    routingKey: 'message.translate',
    exchange: 'exchange',
    queue: 'message.translate',
  })
  async translateMessage(
    @RabbitPayload() payload: RpcRequest<TranslateMessageDto>,
  ) {
    const { data } = payload;
    const result = await this.translateService.translateMessage(data);
    return result;
  }
}
