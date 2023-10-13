import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Controller } from '@nestjs/common';
import {
  CreateRoomDto,
  GetRoomsDto,
  HandleJoinRequestDto,
  JoinRoomDto,
  RpcRequest,
} from '@app/common';
import { RoomService } from '../services';

@Controller()
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @RabbitRPC({
    routingKey: 'room.create',
    exchange: 'exchange',
    queue: 'room.create',
  })
  async createRoom(payload: RpcRequest<CreateRoomDto>) {
    try {
      const { data, user_id } = payload;
      const newRoom = await this.roomService.createRoom(data, user_id);
      return newRoom;
    } catch (exception) {
      return exception;
    }
  }

  @RabbitRPC({
    routingKey: 'room.getRooms',
    exchange: 'exchange',
    queue: 'room.getRooms',
  })
  async getRooms(payload: RpcRequest<GetRoomsDto>) {
    try {
      const { user_id, data } = payload;
      const rooms = await this.roomService.getRooms(user_id, data);
      return rooms;
    } catch (exception) {
      return exception;
    }
  }

  @RabbitRPC({
    routingKey: 'room.joinRoom',
    exchange: 'exchange',
    queue: 'room.joinRoom',
  })
  async joinRoom(payload: RpcRequest<JoinRoomDto>) {
    try {
      const { user_id, data } = payload;
      const rooms = await this.roomService.joinRoom(user_id, data);
      return rooms;
    } catch (exception) {
      return exception;
    }
  }

  @RabbitRPC({
    routingKey: 'room.handleJoinRequest',
    exchange: 'exchange',
    queue: 'room.handleJoinRequest',
  })
  async handleJoinRequest(payload: RpcRequest<HandleJoinRequestDto>) {
    try {
      const { user_id, data } = payload;
      const rooms = await this.roomService.handleJoinRequest(user_id, data);
      return rooms;
    } catch (exception) {
      return exception;
    }
  }
}
