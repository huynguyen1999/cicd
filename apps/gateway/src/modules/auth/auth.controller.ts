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
import { Response } from 'express';
import { LocalGuard } from '../../guards';
import { CurrentUser } from '../../decorators';
import { User } from '@app/database';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  AUTH_COOKIE_NAME,
} from '@app/common';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly rabbitmqService: RabbitmqService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Post('register')
  async register(@Body() body: RegisterDto, @Res() res: Response) {
    const result = await this.rabbitmqService.requestFromRPC(
      body,
      'auth.register',
    );
    return res.status(200).send(result);
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const result: any = await this.rabbitmqService.requestFromRPC(
      body,
      'auth.login',
    );
    const { token, maxAge, httpOnly } = result;
    res.cookie(AUTH_COOKIE_NAME, token, { httpOnly, maxAge });

    return res.send(result);
  }

  @UseGuards(LocalGuard)
  @Post('logout')
  async logout(@CurrentUser() user: User, @Res() res: Response) {
    const result: any = await this.rabbitmqService.requestFromRPC(
      { user_id: user._id },
      'auth.logout',
    );
    const { token, maxAge, httpOnly } = result;
    res.cookie(AUTH_COOKIE_NAME, token, { httpOnly, maxAge });
    this.chatGateway.adapter.emit('logout', { user_id: user._id });
    return res.send(result);
  }

  @UseGuards(LocalGuard)
  @Get('profile')
  getProfile(@CurrentUser() user: User, @Res() res: Response) {
    return res.send(user);
  }

  @UseGuards(LocalGuard)
  @Put('changePassword')
  async changePassword(
    @Body() body: ChangePasswordDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const result: any = await this.rabbitmqService.requestFromRPC(
      { user_id: user._id, data: body },
      'auth.changePassword',
    );
    return res.send(result);
  }
}
