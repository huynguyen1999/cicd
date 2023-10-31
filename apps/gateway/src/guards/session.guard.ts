import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisService } from '@app/redis';
import {
  USER_ACTIVITY_INTERVAL_MS,
  USER_DATA,
  USER_SESSIONS,
} from '@app/common';
import { RabbitmqService } from '@app/rabbitmq';
import { User } from '@app/database';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly redisService: RedisService,
    private readonly rmqService: RabbitmqService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const sessionId = this.getSessionId(context);
    const userId = await this.redisService.get(USER_SESSIONS(sessionId));
    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }
    let user: User = await this.redisService.get(USER_DATA(userId));
    // having session but user not found in redis
    if (!user) {
      const validateResult = await this.rmqService.request(
        {
          data: { session_id: sessionId, user_id: userId },
        },
        'auth.validate',
      );
      if (!validateResult.success) {
        throw new UnauthorizedException('Unauthorized');
      }
      user = validateResult.data;
      // set user data in redis
      const sessionDuration = await this.redisService.getDuration(
        USER_SESSIONS(sessionId),
      );
      await this.redisService.set(USER_DATA(userId), user, {
        NX: true,
        PX: sessionDuration,
      });
    }

    this.addUser(user, context);
    return true;
  }

  private getSessionId(context: ExecutionContext) {
    let sessionId: string;
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      sessionId = request.cookies?.session ?? request.headers?.session;
    } else if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      sessionId = client.handshake.headers.session;
    } else {
      const rpcData = context.switchToRpc().getData();
      sessionId = rpcData.session;
    }
    if (!sessionId) {
      throw new UnauthorizedException('No session found');
    }
    return sessionId;
  }

  private addUser(user: any, context: ExecutionContext) {
    if (context.getType() === 'http') {
      context.switchToHttp().getRequest().user = user;
    } else if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      client.handshake.headers.user = user;
    } else {
      context.switchToRpc().getData().user = user;
    }
  }
}
