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
import { RabbitmqService } from '@app/rabbitmq';
import { Request, Response } from 'express';
import { CurrentUser } from '../../decorators';
import { User } from '@app/database';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  SESSION_COOKIE_NAME,
  UntrackUserActivity,
} from '@app/common';
import { ChatGateway } from '../chat/chat.gateway';
import { SessionGuard } from '../../guards';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly rabbitmqService: RabbitmqService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('register')
  async register(@Body() body: RegisterDto, @Res() res: Response) {
    const result = await this.rabbitmqService.request(
      { data: body },
      'auth.register',
    );
    return res.status(200).send(result);
  }

  @Post('login')
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result: any = await this.rabbitmqService.request(
      {
        data: {
          ...body,
          ip_address:
            req.headers['x-forwarded-for'] || req.socket.remoteAddress,
          user_agent: req.headers['user-agent'],
        },
      },
      'auth.login',
    );
    if (result.success && result.data) {
      const { session, duration, http_only } = result.data;
      res.cookie(SESSION_COOKIE_NAME, session, {
        httpOnly: http_only,
        maxAge: duration,
      });
    }
    return res.send(result);
  }

  @UntrackUserActivity()
  @UseGuards(SessionGuard)
  @Post('logout')
  async logout(
    @CurrentUser() user: User,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const result: any = await this.rabbitmqService.request(
      { data: { session_id: req.cookies.session }, user },
      'auth.logout',
    );
    res.cookie(SESSION_COOKIE_NAME, '', { httpOnly: true, maxAge: 0 });
    this.chatGateway.adapter.emit('logout', { user_id: user._id });
    return res.send(result);
  }

  @UseGuards(SessionGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: User, @Res() res: Response) {
    const profile: any = await this.rabbitmqService.request(
      { user },
      'user.getProfile',
    );
    return res.send(profile);
  }

  @UseGuards(SessionGuard)
  @Put('changePassword')
  async changePassword(
    @Body() body: ChangePasswordDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const result: any = await this.rabbitmqService.request(
      { data: body, user },
      'auth.changePassword',
    );
    return res.send(result);
  }
}
