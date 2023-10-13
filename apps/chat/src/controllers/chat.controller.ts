import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Controller } from '@nestjs/common';
import { RpcRequest } from '@app/common';

@Controller()
export class ChatController {
  constructor() {}

  @RabbitRPC({
    routingKey: 'chat.test',
    exchange: 'exchange',
    queue: 'chat.test',
  })
  async test(payload: RpcRequest<any>) {
    return 'ok';
  }
}
