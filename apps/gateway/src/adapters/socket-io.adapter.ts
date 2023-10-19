import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { RabbitmqService } from '@app/rabbitmq';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

export class SocketIoAdapter extends IoAdapter {
  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
    private rmqService: RabbitmqService,
  ) {
    super(app);
  }

  private redisAdapter: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({
      url: this.configService.get('REDIS_URI'),
    });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.redisAdapter = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions) {
    port = this.configService.get<number>('SOCKET_IO_PORT');
    options.allowRequest = async (req: any, allowFunction: Function) => {
      if (!req.headers.authentication) {
        return allowFunction(`Unauthorized`, false);
      }
      const authentication = req.headers.authentication.split(' ')[1];
      const user = await this.rmqService.requestFromRPC(
        {
          authentication,
        },
        'auth.validate',
      );
      if (!user._id) {
        return allowFunction(`Credentials are invalid`, false);
      }
      req.headers.user = user;
      return allowFunction(null, true);
    };
    const server = super.createIOServer(port, options);
    server.adapter(this.redisAdapter);
    return server;
  }
}
