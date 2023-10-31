import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from '../../guards';
import { RabbitmqService } from '@app/rabbitmq';
import { User } from '@app/database';
import { Response } from 'express';
import {
  CurrentUser,
  RefreshSessionDto,
  RevokeSessionDto,
  RevokeSessionsDto,
  SESSION_COOKIE_NAME,
  UpdateRefreshTokenDto,
} from '@app/common';

@UseGuards(SessionGuard)
@Controller('session')
export class SessionController {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  @Get('list')
  async getSessions(
    @CurrentUser() user: User,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const sessions = await this.rabbitmqService.request(
      { data: {}, user },
      'session.getSessions',
    );
    return res.status(200).send(sessions);
  }

  @Post('revoke')
  async revokeSession(
    @CurrentUser() user: User,
    @Body() body: RevokeSessionDto,
    @Res() res: Response,
  ) {
    const result = await this.rabbitmqService.request(
      { data: body, user },
      'session.revokeSession',
    );
    return res.status(200).send(result);
  }

  @Post('revoke-list')
  async revokeSessions(
    @CurrentUser() user: User,
    @Body() body: RevokeSessionsDto,
    @Res() res: Response,
  ) {
    const result = await this.rabbitmqService.request(
      { data: body, user },
      'session.revokeSessions',
    );
    return res.status(200).send(result);
  }

  @Post('refresh')
  async refreshSession(
    @CurrentUser() user: User,
    @Body() body: RefreshSessionDto,
    @Res() res: Response,
  ) {
    const result = await this.rabbitmqService.request(
      { data: body, user },
      'session.refreshSession',
    );
    if (result.success && result.data) {
      const { session } = result.data;
      res.cookie(SESSION_COOKIE_NAME, session, {
        httpOnly: true,
        maxAge: body.duration,
      });
    }
    return res.status(200).send(result);
  }

  @Put('update-refresh-token')
  async updateRefreshToken(
    @CurrentUser() user: User,
    @Body() body: UpdateRefreshTokenDto,
    @Res() res: Response,
  ) {
    const result = await this.rabbitmqService.request(
      { data: body, user },
      'session.revokeSession',
    );
    return res.status(200).send(result);
  }
}
