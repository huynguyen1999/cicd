import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { Controller, UseGuards } from '@nestjs/common';
import {
  CheckUserInRoomDto,
  CreateRoomDto,
  GetRoomsDto,
  HandleJoinRequestDto,
  InviteUserToRoomDto,
  JoinRoomDto,
  KickUserFromRoomDto,
  RpcRequest,
} from '@app/common';
import { RoomService } from '../services';
import { StsAuthGuard } from '@app/sts-auth';

@UseGuards(StsAuthGuard)
@Controller()
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @RabbitRPC({
    routingKey: 'room.create',
    exchange: 'exchange',
    queue: 'room.create',
  })
  async createRoom(@RabbitPayload() payload: RpcRequest<CreateRoomDto>) {
    const { user, data } = payload;
    const newRoom = await this.roomService.createRoom(data, user);
    return newRoom;
  }

  @RabbitRPC({
    routingKey: 'room.getRooms',
    exchange: 'exchange',
    queue: 'room.getRooms',
  })
  async getRooms(@RabbitPayload() payload: RpcRequest<GetRoomsDto>) {
    const { user, data } = payload;
    const rooms = await this.roomService.getRooms(data, user);
    return rooms;
  }

  @RabbitRPC({
    routingKey: 'room.joinRoom',
    exchange: 'exchange',
    queue: 'room.joinRoom',
  })
  async joinRoom(@RabbitPayload() payload: RpcRequest<JoinRoomDto>) {
    const { user, data } = payload;
    const rooms = await this.roomService.joinRoom(data, user);
    return rooms;
  }

  @RabbitRPC({
    routingKey: 'room.handleJoinRequest',
    exchange: 'exchange',
    queue: 'room.handleJoinRequest',
  })
  async handleJoinRequest(
    @RabbitPayload() payload: RpcRequest<HandleJoinRequestDto>,
  ) {
    const { user, data } = payload;
    const { request, joined_user } = await this.roomService.handleJoinRequest(
      data,
      user,
    );
    return { request, joined_user };
  }

  @RabbitRPC({
    routingKey: 'room.checkUserInRoom',
    exchange: 'exchange',
    queue: 'room.checkUserInRoom',
  })
  async checkUserInRoom(
    @RabbitPayload() payload: RpcRequest<CheckUserInRoomDto>,
  ) {
    const { user, data } = payload;
    const result = await this.roomService.checkUserInRoom(data, user);
    return result;
  }

  @RabbitRPC({
    routingKey: 'room.kickUser',
    exchange: 'exchange',
    queue: 'room.kickUser',
  })
  async kickUserFromRoom(
    @RabbitPayload() payload: RpcRequest<KickUserFromRoomDto>,
  ) {
    const { user, data } = payload;
    const result = await this.roomService.kickUserFromRoom(data, user);
    return result;
  }

  @RabbitRPC({
    routingKey: 'room.inviteUser',
    exchange: 'exchange',
    queue: 'room.inviteUser',
  })
  async inviteUserToRoom(
    @RabbitPayload() payload: RpcRequest<InviteUserToRoomDto>,
  ) {
    const { user, data } = payload;
    const result = await this.roomService.inviteUserToRoom(data, user);
    return result;
  }
}
