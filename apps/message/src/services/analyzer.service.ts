import { Injectable } from '@nestjs/common';
import { MessagingDto } from '@app/common';
import { AxiosService } from '@app/axios';
import * as axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { MessageRepository } from '@app/database';

@Injectable()
export class MessageAnalyzerService {
  constructor(
    private readonly axiosService: AxiosService,
    private readonly configService: ConfigService,
    private readonly messageRepository: MessageRepository,
  ) {}

  async analyze(data: MessagingDto) {
    const url =
      'http://localhost:' + this.configService.get<string>('MODEL_PORT');
    const result = await this.axiosService.request(url, 'POST', {
      text: data.message,
    });
    if (!result?.data) return;

    let totalToxicity = 0;
    for (const key in result.data) {
      const floatValue = +result.data[key].toFixed(3);
      result.data[key] = floatValue;
      totalToxicity += floatValue;
    }
    
    await this.messageRepository.findOneAndUpdate(
      { _id: data.message_id },
      {
        toxicity: {
          ...result.data,
          total: totalToxicity,
        },
      },
    );
    return totalToxicity as number;
  }
}
