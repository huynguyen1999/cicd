import { Controller, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services';
import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import {
  ChangePasswordDto,
  LoginDto,
  LogoutDto,
  RegisterDto,
  RpcRequest,
  UserStatus,
  ValidateDto,
} from '@app/common';
import { StsAuthGuard } from '@app/sts-auth';

@UseGuards(StsAuthGuard)
@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @RabbitRPC({
    routingKey: 'auth.register',
    exchange: 'exchange',
    queue: 'auth.register',
  })
  async register(@RabbitPayload() payload: RpcRequest<RegisterDto>) {
    const user = await this.userService.createUser(payload.data);
    return user;
  }

  @RabbitRPC({
    routingKey: 'auth.login',
    exchange: 'exchange',
    queue: 'auth.login',
  })
  async login(@RabbitPayload() payload: RpcRequest<LoginDto>) {
    const { session, refresh_token, user } = await this.authService.login(
      payload.data,
    );
    return {
      session,
      refresh_token,
      http_only: true,
      duration: payload.data.duration,
    };
  }

  @RabbitRPC({
    routingKey: 'auth.logout',
    exchange: 'exchange',
    queue: 'auth.logout',
  })
  async logout(@RabbitPayload() payload: RpcRequest<LogoutDto>) {
    const { data, user } = payload;
    await this.authService.logout(data, user);
    return { success: true, token: '', httpOnly: true };
  }

  @RabbitRPC({
    routingKey: 'auth.validate',
    exchange: 'exchange',
    queue: 'auth.validate',
  })
  async getUserFromSession(
    @RabbitPayload()
    payload: RpcRequest<ValidateDto>,
  ) {
    const user = await this.authService.getUserFromSession(payload.data);
    return user;
  }

  @RabbitRPC({
    routingKey: 'auth.changePassword',
    exchange: 'exchange',
    queue: 'auth.changePassword',
  })
  async changePassword(
    @RabbitPayload() payload: RpcRequest<ChangePasswordDto>,
  ) {
    const { data, user } = payload;
    const updatedUser = await this.userService.changePassword(data, user);
    return updatedUser;
  }
}
