import { Controller } from '@nestjs/common';
import { MessageAnalyzerService } from '../services';
import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { MessagingDto, RpcRequest } from '@app/common';

@Controller()
export class MessageAnalyzerController {
  constructor(private analyzerService: MessageAnalyzerService) {}

  @RabbitRPC({
    routingKey: 'message.analyzeToxicity',
    exchange: 'exchange',
    queue: 'message.analyzeToxicity',
  })
  async analyzeToxicity(@RabbitPayload() payload: RpcRequest<MessagingDto>) {
    const { data } = payload;
    // TODO: Translate to english first then analyze
    const toxicity = await this.analyzerService.analyze(data);
    return { is_toxic: toxicity > 2 };
  }
}
