import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsThrottlerGuard extends ThrottlerGuard {
  async handleRequest(context: ExecutionContext, limit: number, ttl: number) {
    const client = context.switchToWs().getClient();
    const clientId = client.id;
    const key = this.generateKey(context, clientId);
    const { totalHits } = await this.storageService.increment(key, ttl);
    if (totalHits > limit) {
      throw new WsException('Too many messages');
    }
    return true;
  }
}
