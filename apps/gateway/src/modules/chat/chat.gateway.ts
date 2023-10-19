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
import { LocalGuard, RoomGuard, WsThrottlerGuard } from '../../guards';
import { CurrentUser } from '../../decorators';
import { User } from '@app/database';
import { RedisService } from '@app/redis';
import { Adapter } from 'socket.io-adapter';
import {
  ConnectRoomDto,
  MessagingDto,
  USER_CONNECTED_ROOMS,
  USER_CONNECTED_SOCKETS,
} from '@app/common';
import { RabbitmqService } from '@app/rabbitmq';

@WebSocketGateway()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;
  public adapter: Adapter;
  constructor(
    private readonly redisService: RedisService,
    private readonly rabbitmqService: RabbitmqService,
  ) {}

  async afterInit() {
    this.adapter = this.server.of('/').adapter;
    this.adapter.on(
      'connectRoom',
      (data: { user_id: string; socket_id: string; room_id: string }) =>
        this.handleConnectRoomEvent(data),
    );
    this.adapter.on(
      'leaveRoom',
      (data: { user_id: string; socket_id: string; room_id: string }) =>
        this.handleLeaveRoomEvent(data),
    );
    this.adapter.on('logout', (data: { user_id: string }) =>
      this.handleLogoutEvent(data),
    );
    await this.redisService.deleteMultipleKeys(`${USER_CONNECTED_ROOMS('')}*`);
    await this.redisService.deleteMultipleKeys(
      `${USER_CONNECTED_SOCKETS('')}*`,
    );
  }

  async handleConnectRoomEvent(data: {
    user_id: string;
    socket_id: string;
    room_id: string;
  }) {
    await this.redisService.setHash(
      USER_CONNECTED_ROOMS(data.user_id),
      data.socket_id,
      data.room_id,
    );
  }
  async handleLeaveRoomEvent(data: { user_id: string; room_id: string }) {
    // disconnect the user from the room
    const userConnectedRooms = await this.redisService.getHashAll(
      USER_CONNECTED_ROOMS(data.user_id),
    );
    const socketIds = [];
    for (const [socketId, roomId] of Object.entries(userConnectedRooms)) {
      if (roomId === data.room_id) {
        this.server.sockets.sockets.get(socketId).leave(data.room_id);
        socketIds.push(socketId);
      }
    }
    await this.redisService.deleteHash(
      USER_CONNECTED_ROOMS(data.user_id),
      socketIds,
    );
  }

  async handleLogoutEvent(data: { user_id: string }) {
    this.redisService.deleteKey(USER_CONNECTED_SOCKETS(data.user_id));
    this.redisService.deleteKey(USER_CONNECTED_ROOMS(data.user_id));
  }

  async handleConnection(client: Socket, args: any) {
    const user: any = client.handshake.headers.user;
    if (!user) return;
    await this.redisService.setHash(
      USER_CONNECTED_SOCKETS(user._id),
      client.id,
      Date.now().toString(),
    );
  }

  async handleDisconnect(client: Socket) {
    const user: any = client.handshake.headers.user;
    if (!user) return;
    await this.redisService.deleteHash(
      USER_CONNECTED_ROOMS(user._id),
      client.id,
    );
    await this.redisService.deleteHash(
      USER_CONNECTED_SOCKETS(user._id),
      client.id,
    );
  }

  @UseGuards(LocalGuard, RoomGuard, WsThrottlerGuard)
  @SubscribeMessage('message')
  async onNewMessage(
    @CurrentUser() user: User,
    @MessageBody() body: MessagingDto,
    @ConnectedSocket() client: Socket,
  ) {
    const newMessage = await this.rabbitmqService.requestFromRPC(
      { user_id: user._id, data: body },
      'chat.messaging',
    );
    this.server.to(body.room_id).emit('roomMessages', {
      messages: [newMessage],
    });
  }

  @UseGuards(LocalGuard, RoomGuard)
  @SubscribeMessage('seenMessages')
  async onSeenMessages(
    @CurrentUser() user: User,
    @MessageBody() body: { message_ids: string[]; room_id: string },
    @ConnectedSocket() client: Socket,
  ) {
    const seenMessages = await this.rabbitmqService.requestFromRPC(
      { user_id: user._id, data: body },
      'chat.seenMessages',
    );
    this.server
      .to(body.room_id)
      .emit('roomMessages', { messages: seenMessages });
  }

  @UseGuards(LocalGuard, RoomGuard)
  @SubscribeMessage('connectRoom')
  async onJoinRoom(
    @CurrentUser() user: User,
    @MessageBody() body: ConnectRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(body.room_id);
    this.adapter.emit('connectRoom', {
      user_id: user._id,
      socket_id: client.id,
      room_id: body.room_id,
    });

    const latestMessages = await this.rabbitmqService.requestFromRPC(
      {
        user_id: user._id,
        data: { room_id: body.room_id, limit: 10, skip: 0 },
      },
      'chat.getMessages',
    );
    client.emit('roomMessages', { messages: latestMessages });
  }

  @UseGuards(LocalGuard, RoomGuard)
  @SubscribeMessage('typingMessage')
  async onTypingMessage(
    @CurrentUser() user: User,
    @MessageBody() body: ConnectRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    client.to(body.room_id).emit('roomTypingMessage', { user });
  }
}
