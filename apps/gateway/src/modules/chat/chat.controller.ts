import {
  BadRequestException,
  OnModuleInit,
  UseFilters,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { LocalGuard, RoomGuard } from '../../guards';
import { CurrentUser } from '../../decorators';
import { User } from '@app/database';
import { JoinRoomDto } from '@app/common/dtos';

@WebSocketGateway()
export class ChatController
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket, args: any) {}

  handleDisconnect(client: Socket) {}

  @UseGuards(LocalGuard)
  @SubscribeMessage('message')
  onNewMessage(@MessageBody() body: any, @ConnectedSocket() client: Socket) {
    const { user } = client.handshake.headers;

    this.server.emit('onMessage', {
      msg: 'Hello from the server!',
    });
  }

  @UseGuards(LocalGuard, RoomGuard)
  @SubscribeMessage('join')
  onJoinRoom(
    @CurrentUser() user: User,
    @MessageBody() body: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(body.room_id);
    this.server.to(body.room_id).emit('onMessage', {
      msg: `User ${user.email} has joined the room`,
    });
  }
}
