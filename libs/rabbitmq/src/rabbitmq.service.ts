import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { RPC_TIMEOUT_MS } from './rabbitmq.constant';
import * as FileSystem from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { generateSignature } from '../../common/src';

@Injectable()
export class RabbitmqService implements OnModuleInit {
  private key: string = '';
  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const fileName = join(__dirname, '', 'private-key.pem');
    if (!FileSystem.existsSync(fileName)) {
      console.log(
        `Private key for ${this.configService.get('SERVICE_NAME')} not found`,
      );
      return;
    }
    this.key = FileSystem.readFileSync(fileName, { encoding: 'utf8' });
  }

  publish(data: any, routingKey: string, exchange = 'exchange') {
    data.service = this.configService.get('SERVICE_NAME');
    data.timestamp = Date.now();
    const signature = generateSignature(this.key, data);
    this.amqpConnection.publish(exchange, routingKey, {
      ...data,
      signature,
    });
  }

  async request(
    data: any,
    routingKey: string,
    timeout = RPC_TIMEOUT_MS,
    exchange = 'exchange',
  ): Promise<any> {
    data.service = this.configService.get('SERVICE_NAME');
    data.timestamp = Date.now();
    const signature = generateSignature(this.key, data);
    const response = await this.amqpConnection.request({
      exchange,
      routingKey,
      payload: {
        ...data,
        signature,
      },
      timeout,
    });

    return response;
  }
}
