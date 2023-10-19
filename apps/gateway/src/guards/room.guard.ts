import {
  BadRequestException,
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
    try {
      const { userId, roomId } = this.getUserAndRoomId(context);
      if (!roomId) {
        throw new Error('Room not found');
      }
      if (!userId) {
        throw new Error('User not found');
      }
      const result = await this.rabbitmqService.requestFromRPC(
        {
          user_id: userId,
          data: { room_id: roomId },
        },
        'room.checkUserInRoom',
      );
      if (!result) {
        throw new Error('User is not in the room');
      }
      return !!result;
    } catch (exception) {
      if (context.getType() === 'http') {
        throw new BadRequestException(exception.message || exception);
      } else if (context.getType() === 'ws') {
        throw new WsException(exception.message || exception);
      }
      throw exception;
    }
  }

  getUserAndRoomId(context: ExecutionContext) {
    let roomId: string, userId: string;
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      userId = request.user?._id;
      roomId = request.body?.room_id || request.query?.room_id;
    } else if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      const data = context.switchToWs().getData();
      roomId = data.room_id;
      userId = client.handshake.headers.user?._id;
    }
    return { roomId, userId };
  }
}
