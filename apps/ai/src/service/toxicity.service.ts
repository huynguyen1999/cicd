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
  ) {}

  async analyze(data: MessagingDto) {
    const url =
      'http://127.0.0.1:' +
      this.configService.get<string>('MODEL_PORT') +
      '/toxicity';
    const result = await this.axiosService.request(url, 'POST', {
      text: data.message,
    });

    return result.data;
  }
}
