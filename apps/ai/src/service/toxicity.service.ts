import { Injectable } from '@nestjs/common';
import { AxiosService } from '@app/axios';
import { ConfigService } from '@nestjs/config';
import { MessageRepository } from '@app/database';
import { MessagingDto } from '@app/common';

@Injectable()
export class ToxicityService {
  constructor(
    private readonly axiosService: AxiosService,
    private readonly configService: ConfigService,
    private readonly messageRepository: MessageRepository,
  ) {}

  private sumToxicity(toxicityAnalysis: Record<string, any>) {
    let totalToxicity = 0;
    for (const key in toxicityAnalysis) {
      const floatValue = +toxicityAnalysis[key];
      toxicityAnalysis[key] = floatValue;
      totalToxicity += floatValue;
    }
    return totalToxicity;
  }

  async analyze(data: MessagingDto) {
    const url =
      'http://localhost:' + this.configService.get<string>('MODEL_PORT');
    const result = await this.axiosService.request(url, 'POST', {
      text: data.message,
    });
    const totalToxicity = this.sumToxicity(result.data);
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
    return result.data;
  }
}
