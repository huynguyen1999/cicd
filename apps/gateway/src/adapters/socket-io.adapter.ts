import { INestApplicationContext, UnauthorizedException } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { RabbitmqService } from '@app/rabbitmq';
import { RedisService } from '@app/redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { USER_DATA, USER_SESSIONS } from '@app/common';

export class SocketIoAdapter extends IoAdapter {
  constructor(
    private app: INestApplicationContext,
    private configService: ConfigService,
    private rmqService: RabbitmqService,
    private redisService: RedisService,
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
      if (!req.headers.session) {
        return allowFunction(`Unauthorized`, false);
      }
      const sessionId = req.headers.session;
      const userId = await this.redisService.get(USER_SESSIONS(sessionId));
      if (!userId) {
        return allowFunction(`Credentials are invalid`, false);
      }
      let user = await this.redisService.get(USER_DATA(userId));
      if (!user) {
        const validateResult = await this.rmqService.request(
          {
            data: { session_id: sessionId, user_id: userId },
          },
          'auth.validate',
        );
        if (!validateResult.success) {
          return allowFunction(`Credentials are invalid`, false);
        }
        user = validateResult.data;
      }
      req.headers.user = user;
      return allowFunction(null, true);
    };
    const server = super.createIOServer(port, options);
    server.adapter(this.redisAdapter);
    return server;
  }
}
