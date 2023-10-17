import { OnModuleInit, UseFilters, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocalGuard, RoomGuard } from '../../guards';
import { CurrentUser } from '../../decorators';
import { User } from '@app/database';
import { RedisService } from '@app/redis';
import { Adapter } from 'socket.io-adapter';
import { USER_JOINED_ROOMS } from '@app/common';

@WebSocketGateway()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;
  public adapter: Adapter;
  constructor(private readonly redisService: RedisService) {}

  afterInit() {
    this.adapter = this.server.of('/').adapter;
    this.adapter.on(
      'joinRoom',
      (data: { user_id: string; socket_id: string; room_id: string }) =>
        this.handleJoinRoomEvent(data),
    );
    this.adapter.on(
      'leaveRoom',
      (data: { user_id: string; socket_id: string; room_id: string }) =>
        this.handleLeaveRoomEvent(data),
    );
  }

  async handleJoinRoomEvent(data: {
    user_id: string;
    socket_id: string;
    room_id: string;
  }) {
    console.log(
      `User ${data.user_id} with socket id=${data.socket_id} joined room ${data.room_id}`,
    );
    await this.redisService.setHash(
      USER_JOINED_ROOMS(data.user_id),
      data.socket_id,
      data.room_id,
    );
  }
  async handleLeaveRoomEvent(data: {
    user_id: string;
    socket_id: string;
    room_id: string;
  }) {
    console.log(
      `User ${data.user_id} with socket id=${data.socket_id} left room ${data.room_id}`,
    );
    this.server.of('/').sockets.get(data.socket_id).leave(data.room_id);
    await this.redisService.deleteHash(
      USER_JOINED_ROOMS(data.user_id),
      data.socket_id,
    );
  }

  handleConnection(client: Socket, args: any) {}

  handleDisconnect(client: Socket) {
    const user: any = client.handshake.headers.user;
    if (!user) return;
    this.redisService.deleteKey(USER_JOINED_ROOMS(user._id));
  }

  @UseGuards(LocalGuard, RoomGuard)
  @SubscribeMessage('message')
  onNewMessage(
    @CurrentUser() user: User,
    @MessageBody() body: { message: string; room_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    this.server.to(body.room_id).emit('message', {
      msg: body.message,
    });
  }

  @UseGuards(LocalGuard, RoomGuard)
  @SubscribeMessage('joinRoom')
  async onJoinRoom(
    @CurrentUser() user: User,
    @MessageBody() body: { room_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(body.room_id);
    this.adapter.emit('joinRoom', {
      user_id: user._id.toString(),
      socket_id: client.id,
      room_id: body.room_id,
    });
    this.server.to(body.room_id).emit('message', {
      msg: `User ${user.email} has joined the room`,
    });
  }
}
