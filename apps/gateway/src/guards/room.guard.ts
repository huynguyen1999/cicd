import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RabbitmqService } from '@app/rabbitmq';
import { User } from '@app/database';

@Injectable()
export class RoomGuard implements CanActivate {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user, roomId } = this.getUserAndRoomId(context);
    if (!roomId) {
      throw new UnauthorizedException('Room not found');
    }
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const result = await this.rabbitmqService.request(
      {
        data: { room_id: roomId },
        user: user,
      },
      'room.checkUserInRoom',
    );
    if (!result) {
      throw new UnauthorizedException('User is not in the room');
    }
    return !!result;
  }

  getUserAndRoomId(context: ExecutionContext) {
    let roomId: string, user: Partial<User>;
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      user = request.user;
      roomId = request.body?.room_id || request.query?.room_id;
    } else if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      const data = context.switchToWs().getData();
      roomId = data.room_id;
      user = client.handshake.headers.user;
    }
    return { roomId, user };
  }
}