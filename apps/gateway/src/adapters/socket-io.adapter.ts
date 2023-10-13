import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { RabbitmqService } from '@app/rabbitmq';

export class SocketIoAdapter extends IoAdapter {
  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
    private rmqService: RabbitmqService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    port = this.configService.get<number>('SOCKET_IO_PORT');
    options.allowRequest = async (req: any, allowFunction: Function) => {
      if (!req.headers.authentication) {
        return allowFunction(`Unauthorized`, false);
      }

      const authentication = req.headers.authentication.split(' ')[1];
      const user = await this.rmqService.requestFromRPC(
        'exchange',
        'auth.validate',
        {
          authentication,
        },
      );
      if (!user._id) {
        return allowFunction(`Credentials are invalid`, false);
      }
      return allowFunction(null, true);
    };
    const server = super.createIOServer(port, options);
    return server;
  }
}
