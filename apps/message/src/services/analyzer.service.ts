import { Injectable } from '@nestjs/common';
import { MessagingDto } from '@app/common';
import * as axios from 'axios';

@Injectable()
export class MessageAnalyzerService {
  constructor() {}

  async analyze(data: MessagingDto) {
    // TODO: Implement axios module to handle restful api call
    const result = await axios.default.post('http://localhost:8000', {
      text: data.message,
    });
    if (!result?.data) return;
    const toxicity = Object.values(result.data).reduce(
      (a: number, b: string) => +b + a,
      0,
    );
    return toxicity as number;
  }
}
