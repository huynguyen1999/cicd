import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RabbitmqService } from '@app/rabbitmq';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class RoomGuard implements CanActivate {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'ws') {
      return false;
    }
    const data = context.switchToWs().getData();
    const headers = context.switchToWs().getClient().handshake.headers;
    const roomId = data.room_id;
    if (!roomId) {
      return false;
    }
    const userId = headers.user._id;
    if (!userId) {
      return false;
    }
    const result = await this.rabbitmqService.requestFromRPC(
      'exchange',
      'room.checkUserInRoom',
      {
        user_id: userId,
        data: { room_id: roomId },
      },
    );
    if (!result) {
      throw new WsException('User is not in the room');
    }
    return !!result;
  }
}
