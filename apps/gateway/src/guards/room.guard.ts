import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RabbitmqService } from '@app/rabbitmq';

@Injectable()
export class RoomGuard implements CanActivate {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // TODO: Get room by `room_id` from message body
    // TODO: Check if user is already participant of this room
    return true;
  }
}
