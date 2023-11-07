import { Injectable } from '@nestjs/common';
import { MessagingDto } from '@app/common';
import { MessageRepository, User } from '@app/database';
import { RabbitmqService } from '@app/rabbitmq';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class MessageAnalyzerService {
  constructor(
    private readonly rmqService: RabbitmqService,
    private readonly messageRepository: MessageRepository,
  ) {}

  async analyze(data: MessagingDto, user: User) {
    const result = await this.rmqService.request(
      { data, user },
      'ai.toxicityAnalyzer',
    );
    if (!result.success) {
      throw new RpcException('Error analyzing toxicity');
    }
    await this.messageRepository.findOneAndUpdate(
      { _id: data.message_id },
      {
        toxicity: {
          ...result.data,
          total: result.data,
        },
      },
    );
    return result.data as number;
  }
}
