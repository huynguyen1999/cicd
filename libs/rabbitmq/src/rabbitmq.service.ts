import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RPC_TIMEOUT } from './rabbitmq.constant';

@Injectable()
export class RabbitmqService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  publishMessage(exchange: string, routingKey: string, data: any) {
    this.amqpConnection.publish(exchange, routingKey, data);
  }

  async requestFromRPC(
    exchange: string,
    routingKey: string,
    data: any = {},
  ): Promise<any> {
    const response = await this.amqpConnection.request({
      exchange,
      routingKey,
      payload: data,
      timeout: RPC_TIMEOUT,
    });

    return response;
  }
}
