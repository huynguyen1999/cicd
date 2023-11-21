import { Injectable } from '@nestjs/common';
import { AxiosService } from '@app/axios';
import { ConfigService } from '@nestjs/config';
import { UploadedFileRepository } from '@app/database';
import { SpeechToTextDto, UploadedFileStatus } from '@app/common';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class SpeechToTextService {
  constructor(
    private readonly axiosService: AxiosService,
    private readonly configService: ConfigService,
  ) {}

  private getRequestUrl(pathName: string) {
    const port = this.configService.get<string>('MODEL_PORT');
    return `http://127.0.0.1:${port}/${pathName}`;
  }
  async convert(data: SpeechToTextDto) {
    const url = this.getRequestUrl('transcribeAudio');
    const response = await this.axiosService.request(url, 'POST', {
      path: data.file_path,
    });
    if (!response.data) {
      throw new RpcException("Can't convert speech to text");
    }
    return response.data;
  }
}
