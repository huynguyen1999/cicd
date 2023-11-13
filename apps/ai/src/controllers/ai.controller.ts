import {
  RabbitPayload,
  RabbitRPC,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { Controller } from '@nestjs/common';
import {
  FaceRecognitionService,
  FaceSwapService,
  NSFWClassifierService,
  ToxicityService,
} from '../service';
import {
  AnalyzeFileWithAiDto,
  BuildFaceClassifierDto,
  FaceSwapDto,
  MessagingDto,
  RpcRequest,
} from '@app/common';

@Controller()
export class AiController {
  constructor(
    private readonly toxicityService: ToxicityService,
    private readonly nsfwClassifierService: NSFWClassifierService,
    private readonly faceRecognitionService: FaceRecognitionService,
    private readonly faceSwapService: FaceSwapService,
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
  async classifyNSFW(
    @RabbitPayload() payload: RpcRequest<AnalyzeFileWithAiDto>,
  ) {
    await this.nsfwClassifierService.checkNSFW(
      payload.data.file_name,
      payload.user,
    );
  }

  @RabbitRPC({
    routingKey: 'ai.extractFaceFeatures',
    exchange: 'exchange',
    queue: 'ai.extractFaceFeatures',
  })
  async extractFaceFeatures(
    @RabbitPayload() payload: RpcRequest<AnalyzeFileWithAiDto>,
  ) {
    const { data, user } = payload;
    const features = await this.faceRecognitionService.extractFaceFeatures(
      data.file_name,
      user,
    );
    return features;
  }

  @RabbitRPC({
    routingKey: 'ai.recognizeFaces',
    exchange: 'exchange',
    queue: 'ai.recognizeFaces',
  })
  async recognizeFaces(
    @RabbitPayload() payload: RpcRequest<AnalyzeFileWithAiDto>,
  ) {
    const { data, user } = payload;
    const result = await this.faceRecognitionService.recognizeFaces(
      data.file_name,
      user,
    );
    return result;
  }

  @RabbitRPC({
    routingKey: 'ai.buildFaceClassifier',
    exchange: 'exchange',
    queue: 'ai.buildFaceClassifier',
  })
  async buildFaceClassifier(@RabbitPayload() payload: RpcRequest<any>) {
    const { user } = payload;
    const result = await this.faceRecognitionService.buildFaceClassifier(user);
    return result;
  }

  @RabbitRPC({
    routingKey: 'ai.faceSwap',
    exchange: 'exchange',
    queue: 'ai.faceSwap',
  })
  async faceSwap(@RabbitPayload() payload: RpcRequest<FaceSwapDto>) {
    const result = this.faceSwapService.execute(payload.data);
    return result;
  }
}
