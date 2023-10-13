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

@Controller('auth')
export class AuthController {
  constructor(private readonly rabbitmqService: RabbitmqService) {}

  @Post('register')
  async register(@Body() body: RegisterDto, @Res() res: Response) {
    const result = await this.rabbitmqService.requestFromRPC(
      'exchange',
      'auth.register',
      body,
    );
    return res.status(200).send(result);
  }

  @Post('login')
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const result: any = await this.rabbitmqService.requestFromRPC(
      'exchange',
      'auth.login',
      body,
    );
    const { token, maxAge, httpOnly } = result;
    res.cookie(AUTH_COOKIE_NAME, token, { httpOnly, maxAge });

    return res.send(result);
  }

  @UseGuards(LocalGuard)
  @Post('logout')
  async logout(@Res() res: Response) {
    const result: any = await this.rabbitmqService.requestFromRPC(
      'exchange',
      'auth.logout',
    );
    const { token, maxAge, httpOnly } = result;
    res.cookie(AUTH_COOKIE_NAME, token, { httpOnly, maxAge });
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
      'exchange',
      'auth.changePassword',
      { user_id: user._id, data: body },
    );
    return res.send(result);
  }
}
