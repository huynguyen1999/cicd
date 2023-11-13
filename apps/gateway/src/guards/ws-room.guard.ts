import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@app/database';
import { RedisService } from '@app/redis';
import { USER_CONNECTED_ROOMS } from '../../../../libs/common/src';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsRoomGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'ws') {
      return true;
    }
    const { user, roomId, socketId } = this.getUserAndRoomId(context);
    if (!roomId) {
      throw new WsException('Room not found');
    }
    if (!user) {
      throw new WsException('User not found');
    }

    const connectedRoom = await this.redisService.getHash(
      USER_CONNECTED_ROOMS(user._id),
      socketId,
    );
    if (connectedRoom !== roomId)
      throw new WsException('User is not in the ws room');

    return true;
  }

  getUserAndRoomId(context: ExecutionContext) {
    const client = context.switchToWs().getClient();
    const data = context.switchToWs().getData();

    return {
      roomId: data.room_id,
      user: client.handshake.headers.user,
      socketId: client.id,
    };
  }
}
