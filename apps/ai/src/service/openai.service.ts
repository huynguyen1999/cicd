import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService implements OnModuleInit {
  private client: OpenAI;
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.client = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async chatCompletion(prompt: string) {
    const completion = await this.client.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-3.5-turbo',
    });
    if (!completion?.choices?.[0]?.message?.content) {
      throw new RpcException('No response from OpenAI');
    }
    return completion?.choices?.[0]?.message?.content;
  }
}
