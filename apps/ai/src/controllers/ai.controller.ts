import {
  RabbitPayload,
  RabbitRPC,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { Controller } from '@nestjs/common';
import { NSFWClassifierService, ToxicityService } from '../service';
import { MessagingDto, RpcRequest } from '@app/common';

@Controller()
export class AiController {
  constructor(
    private readonly toxicityService: ToxicityService,
    private readonly nsfwClassifierService: NSFWClassifierService,
  ) {}

  @RabbitRPC({
    routingKey: 'ai.toxicityAnalyzer',
    exchange: 'exchange',
    queue: 'ai.toxicityAnalyzer',
  })
  async analyzeToxicity(@RabbitPayload() payload: RpcRequest<MessagingDto>) {
    const toxicity = await this.toxicityService.analyze(payload.data);
    return toxicity;
  }

  @RabbitSubscribe({
    routingKey: 'ai.nsfwClassifier',
    exchange: 'exchange',
    queue: 'ai.nsfwClassifier',
  })
  async classifyNSFW(@RabbitPayload() payload: RpcRequest<{ path: string }>) {
    await this.nsfwClassifierService.checkNSFW(payload.data.path);
  }

  @RabbitRPC({
    routingKey: 'ai.faceRecognition',
    exchange: 'exchange',
    queue: 'ai.faceRecognition',
  })
  async recognizeFace() {}
}
