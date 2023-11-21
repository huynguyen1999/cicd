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
  OpenAIService,
  ToxicityService,
} from '../service';
import {
  AnalyzeFileWithAiDto,
  ChatCompletionDto,
  FaceSwapDto,
  MessagingDto,
  RpcRequest,
  SpeechToTextDto,
} from '@app/common';
import { SpeechToTextService } from '../service/speech-to-text.service';
import { RpcException } from '@nestjs/microservices';

@Controller()
export class AiController {
  constructor(
    private readonly toxicityService: ToxicityService,
    private readonly nsfwClassifierService: NSFWClassifierService,
    private readonly faceRecognitionService: FaceRecognitionService,
    private readonly faceSwapService: FaceSwapService,
    private readonly speechToTextService: SpeechToTextService,
    private readonly openAIService: OpenAIService,
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
    const result = await this.faceSwapService.execute(payload.data);
    return result;
  }

  @RabbitRPC({
    routingKey: 'ai.speechToText',
    exchange: 'exchange',
    queue: 'ai.speechToText',
  })
  async speechToText(@RabbitPayload() payload: RpcRequest<SpeechToTextDto>) {
    const { data, user } = payload;
    const result = await this.speechToTextService.convert(data);
    if (!result?.data?.text) {
      throw new RpcException("Can't convert speech to text");
    }
    return result.data.text;
  }

  @RabbitRPC({
    routingKey: 'ai.chatCompletion',
    exchange: 'exchange',
    queue: 'ai.chatCompletion',
  })
  async chatCompletion(
    @RabbitPayload() payload: RpcRequest<ChatCompletionDto>,
  ) {
    const { data } = payload;
    const result = await this.openAIService.chatCompletion(data.prompt);
    return result;
  }
}
