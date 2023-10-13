import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { RabbitmqService } from '@app/rabbitmq';
import { LocalGuard } from '../../guards';
import { CurrentUser } from '../../decorators';
import { User } from '@app/database';
import { Response } from 'express';
import { CreateRoomDto, HandleJoinRequestDto, JoinRoomDto } from '@app/common';

@Controller('room')
export class RoomController {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  @UseGuards(LocalGuard)
  @Post()
  async createRoom(
    @CurrentUser() user: User,
    @Body() data: CreateRoomDto,
    @Res() res: Response,
  ) {
    const result = await this.rabbitmqService.requestFromRPC(
      'exchange',
      'room.create',
      {
        user_id: user._id,
        data,
      },
    );
    console.log(result);
    return res.status(200).send(result);
  }

  @UseGuards(LocalGuard)
  @Get()
  async getRooms(@CurrentUser() user: User, @Res() res: Response) {
    const result = await this.rabbitmqService.requestFromRPC(
      'exchange',
      'room.getRooms',
      {
        user_id: user._id,
      },
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
      'exchange',
      'room.joinRoom',
      {
        user_id: user._id,
        data: body,
      },
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
      'exchange',
      'room.handleJoinRequest',
      {
        user_id: user._id,
        data: body,
      },
    );
    return res.status(200).send(result);
  }
}
