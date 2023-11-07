import { Controller } from '@nestjs/common';
import { MessageAnalyzerService, MessageTranslationService } from '../services';
import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { MessagingDto, RpcRequest } from '@app/common';

@Controller()
export class MessageAnalyzerController {
  constructor(
    private analyzerService: MessageAnalyzerService,
    private translateService: MessageTranslationService,
  ) {}

  @RabbitRPC({
    routingKey: 'message.analyzeToxicity',
    exchange: 'exchange',
    queue: 'message.analyzeToxicity',
  })
  async analyzeToxicity(@RabbitPayload() payload: RpcRequest<MessagingDto>) {
    const { data, user } = payload;
    const translatedMessage =
      await this.translateService.translateTextToEnglish(data.message);
    const toxicity = await this.analyzerService.analyze(
      {
        ...data,
        message: translatedMessage,
      },
      user,
    );
    return { is_toxic: toxicity > 2 };
  }
}
