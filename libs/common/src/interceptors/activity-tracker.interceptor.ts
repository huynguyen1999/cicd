import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Response } from '.';
import { RedisService } from '@app/redis';
import { RabbitmqService } from '@app/rabbitmq';
import { Reflector } from '@nestjs/core';
import { USER_ACTIVITY_INTERVAL_MS, USER_DATA, UserStatus } from '@app/common';

@Injectable()
export class ActivityTrackerInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  constructor(
    private reflector: Reflector,
    private readonly redisService: RedisService,
  ) {}
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(tap(() => this.trackActivity(context)));
  }

  private async trackActivity(context: ExecutionContext) {
    const untrackUserActivity = !!this.reflector.get<boolean>(
      'untrackUserActivity',
      context.getHandler(),
    );
    if (untrackUserActivity) return;
    const user = this.getUser(context);
    if (!user?.last_activity_at) return;

    await this.redisService.set(
      USER_DATA(user._id),
      {
        ...user,
        last_activity_at: new Date(),
        status: UserStatus.Online,
      },
      { XX: true, KEEPTTL: true },
    );
  }

  private getUser(context: ExecutionContext) {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest().user;
    } else if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      return client.handshake.headers.user;
    }
    return context.switchToRpc().getData().user;
  }
}
