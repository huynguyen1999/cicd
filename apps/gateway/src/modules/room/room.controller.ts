import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { RabbitmqService } from '@app/rabbitmq';
import { LocalGuard, RoomGuard } from '../../guards';
import { CurrentUser } from '../../decorators';
import { User } from '@app/database';
import { Response } from 'express';
import {
  CreateRoomDto,
  HandleJoinRequestDto,
  JoinRoomDto,
  KickUserFromRoomDto,
  InviteUserToRoomDto,
} from '@app/common';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('room')
export class RoomController {
  constructor(
    private readonly rabbitmqService: RabbitmqService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @UseGuards(LocalGuard)
  @Post()
  async createRoom(
    @CurrentUser() user: User,
    @Body() data: CreateRoomDto,
    @Res() res: Response,
  ) {
    const result = await this.rabbitmqService.requestFromRPC(
      {
        user_id: user._id,
        data,
      },
      'room.create',
    );
    return res.status(200).send(result);
  }

  @UseGuards(LocalGuard)
  @Get()
  async getRooms(@CurrentUser() user: User, @Res() res: Response) {
    const result = await this.rabbitmqService.requestFromRPC(
      {
        user_id: user._id,
      },
      'room.getRooms',
    );

    return res.status(200).send(result);
  }

  @UseGuards(LocalGuard)
  @Post('join')
  async joinRoom(
    @CurrentUser() user: User,
    @Body() body: JoinRoomDto,
    @Res() res: Response,
  ) {
    const result = await this.rabbitmqService.requestFromRPC(
      {
        user_id: user._id,
        data: body,
      },
      'room.joinRoom',
    );
    return res.status(200).send(result);
  }

  @UseGuards(LocalGuard)
  @Post('handle-join-request')
  async handleJoinRequest(
    @CurrentUser() user: User,
    @Body() body: HandleJoinRequestDto,
    @Res() res: Response,
  ) {
    const result = await this.rabbitmqService.requestFromRPC(
      {
        user_id: user._id,
        data: body,
      },
      'room.handleJoinRequest',
    );
    if (result.joined_user) {
      const message = await this.rabbitmqService.requestFromRPC(
        {
          room_id: body.room_id,
          message: `${result.joined_user.email} has joined the room`,
        },
        'chat.notice',
      );
      this.chatGateway.server
        .to(body.room_id)
        .emit('roomMessages', { messages: [message] });
    }
    return res.status(200).send(result);
  }

  @UseGuards(LocalGuard)
  @Post('kick-user')
  async kickUserFromRoom(
    @CurrentUser() user: User,
    @Body() body: KickUserFromRoomDto,
    @Res() res: Response,
  ) {
    const result = await this.rabbitmqService.requestFromRPC(
      {
        user_id: user._id,
        data: body,
      },
      'room.kickUser',
    );
    if (result.user) {
      this.chatGateway.adapter.emit('leaveRoom', {
        user_id: result.user._id,
        room_id: body.room_id,
      });
      const message = await this.rabbitmqService.requestFromRPC(
        {
          room_id: body.room_id,
          message: `${result.user.email} has been kicked`,
        },
        'chat.notice',
      );
      this.chatGateway.server
        .to(body.room_id)
        .emit('roomMessages', { messages: [message] });
    }
    return res.status(200).send(result);
  }

  @UseGuards(LocalGuard, RoomGuard)
  @Post('invite-user')
  async inviteUserToRoom(
    @CurrentUser() user: User,
    @Body() body: InviteUserToRoomDto,
    @Res() res: Response,
  ) {
    const result = await this.rabbitmqService.requestFromRPC(
      {
        user_id: user._id,
        data: body,
      },
      'room.inviteUser',
    );
    return res.status(200).send(result);
  }
}
