import { UseGuards, UseInterceptors } from '@nestjs/common';
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
import { RoomGuard, SessionGuard, WsThrottlerGuard } from '../../guards';
import { User } from '@app/database';
import { RedisService } from '@app/redis';
import { Adapter } from 'socket.io-adapter';
import {
  ConnectRoomDto,
  CurrentUser,
  DeleteMessagesDto,
  EditMessageDto,
  GetUsersStatusDto,
  MessagingDto,
  ReactMessageDto,
  SeenMessagesDto,
  USER_ACTIVITY_INTERVAL_MS,
  USER_CONNECTED_ROOMS,
  USER_CONNECTED_SOCKETS,
  USER_DATA,
  UntrackUserActivity,
  UserStatus,
} from '@app/common';
import { RabbitmqService } from '@app/rabbitmq';
import { ActivityTrackerInterceptor, LoggingInterceptor } from '@app/common';

@UseInterceptors(ActivityTrackerInterceptor, LoggingInterceptor)
@UseGuards(SessionGuard, RoomGuard, WsThrottlerGuard)
@WebSocketGateway()
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  public server: Server;
  public adapter: Adapter;
  constructor(
    private readonly redisService: RedisService,
    private readonly rmqService: RabbitmqService,
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

    this.redisService.deleteMultipleKeys(`${USER_CONNECTED_ROOMS('')}*`);
    this.redisService.deleteMultipleKeys(`${USER_CONNECTED_SOCKETS('')}*`);
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

  handleConnection(client: Socket, args: any) {
    const user: any = client.handshake.headers.user;
    if (!user) return;
    this.redisService.setHash(
      USER_CONNECTED_SOCKETS(user._id),
      client.id,
      Date.now().toString(),
    );
    this.rmqService.request(
      { data: { status: UserStatus.Online }, user },
      'user.updateUserStatus',
    );
  }

  handleDisconnect(client: Socket) {
    const user: any = client.handshake.headers.user;
    if (!user) return;
    this.redisService.deleteHash(USER_CONNECTED_ROOMS(user._id), client.id);
    this.redisService.deleteHash(USER_CONNECTED_SOCKETS(user._id), client.id);
    this.rmqService.request(
      { data: { status: UserStatus.Offline }, user },
      'user.updateUserStatus',
    );
  }

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
    const result = await this.rmqService.request(
      {
        data: { room_id: body.room_id, limit: 10, skip: 0 },
        user,
      },
      'chat.getMessages',
    );
    if (!result.success) return;
    client.emit('roomNewMessages', { messages: result.data });
  }

  @SubscribeMessage('typingMessage')
  async onTypingMessage(
    @CurrentUser() user: User,
    @MessageBody() body: ConnectRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    client.to(body.room_id).emit('roomTypingMessage', { user });
  }

  @SubscribeMessage('message')
  async onNewMessage(
    @CurrentUser() user: User,
    @MessageBody() body: MessagingDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.rmqService.request(
      { data: body, user },
      'chat.message',
    );
    if (!result.success) return;
    this.server.to(body.room_id).emit('roomNewMessages', {
      messages: [result.data],
    });
    const analyzeResult = await this.rmqService.request(
      { data: { ...body, message_id: result.data._id }, user },
      'message.analyzeToxicity',
    );
    if (analyzeResult.data.is_toxic) {
      this.server.to(body.room_id).emit('roomToxicMessages', {
        messages: [{ _id: result.data._id }],
      });
    }
  }

  @SubscribeMessage('seenMessages')
  async onSeenMessages(
    @CurrentUser() user: User,
    @MessageBody() body: SeenMessagesDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.rmqService.request(
      { data: body, user },
      'chat.seenMessages',
    );
    if (!result.success) return;
    this.server
      .to(body.room_id)
      .emit('roomSeenMessages', { messages: result.data });
  }

  @SubscribeMessage('reactMessage')
  async onReactMessage(
    @CurrentUser() user: User,
    @MessageBody() body: ReactMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.rmqService.request(
      { data: body, user },
      'chat.reactMessage',
    );
    if (!result.success) return;
    this.server
      .to(body.room_id)
      .emit('roomReactedMessages', { messages: [result.data] });
  }

  @SubscribeMessage('editMessage')
  async onEditMessage(
    @CurrentUser() user: User,
    @MessageBody() body: EditMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.rmqService.request(
      { data: body, user },
      'chat.editMessage',
    );
    if (!result.success) return;
    this.server
      .to(body.room_id)
      .emit('roomEditedMessages', { messages: [result.data] });
  }

  @SubscribeMessage('deleteMessages')
  async onDeleteMessage(
    @CurrentUser() user: User,
    @MessageBody() body: DeleteMessagesDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.rmqService.request(
      { data: body, user },
      'chat.deleteMessages',
    );
    if (!result.success) return;
    this.server
      .to(body.room_id)
      .emit('roomDeletedMessages', { messages: result.data });
  }

  // send heartbeat to the server every 5 seconds
  @UntrackUserActivity()
  @SubscribeMessage('heartbeat')
  async onHeartbeat(
    @CurrentUser() user: User,
    @ConnectedSocket() client: Socket,
  ) {
    const { last_activity_at } = user;
    const lastActivityTime = Date.parse(last_activity_at.toString());
    const currentTime = Date.now();

    if (currentTime - lastActivityTime > USER_ACTIVITY_INTERVAL_MS) {
      user.status = UserStatus.Away;
      this.redisService.set(USER_DATA(user._id.toString()), user);
    }

    client.broadcast.emit('usersStatus', { users: [user] });
  }

  // get users status every 5 seconds
  @UntrackUserActivity()
  @SubscribeMessage('usersStatus')
  async getUsersStatus(
    @CurrentUser() user: User,
    @MessageBody() body: GetUsersStatusDto,
    @ConnectedSocket() client: Socket,
  ) {
    const result = await this.rmqService.request(
      { data: { user_ids: body.user_ids }, user },
      'user.getUsersStatus',
    );
    client.emit('usersStatus', { users: result.data });
  }
}
