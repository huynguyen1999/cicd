import { Body, Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { RabbitmqService } from '@app/rabbitmq';
import { RoomGuard, SessionGuard } from '../../guards';
import { CurrentUser, TranslateMessageDto } from '@app/common';
import { User } from '@app/database';
import { Response } from 'express';

@UseGuards(SessionGuard, RoomGuard)
@Controller('message')
export class MessageController {
  constructor(private readonly rmqService: RabbitmqService) {}

  @Post('translate')
  async translateMessage(
    @Body() body: TranslateMessageDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const result = await this.rmqService.request(
      { data: body, user },
      'message.translate',
    );
    return res.status(200).send(result);
  }
}
