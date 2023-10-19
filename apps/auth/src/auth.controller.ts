import { Controller } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { UserService } from './services';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import {
  ChangePasswordDto,
  LoginDto,
  RegisterDto,
  RpcRequest,
} from '@app/common';
import { RpcException } from '@nestjs/microservices';

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
  async register(payload: RegisterDto) {
    try {
      const user = await this.userService.createUser(payload);
      return user;
    } catch (exception) {
      return {
        success: false,
        exception,
      };
    }
  }

  @RabbitRPC({
    routingKey: 'auth.login',
    exchange: 'exchange',
    queue: 'auth.login',
  })
  async login(payload: LoginDto) {
    try {
      const { token, maxAge } = await this.authService.login(payload);
      return { token, maxAge, httpOnly: true };
    } catch (exception) {
      return {
        success: false,
        exception,
      };
    }
  }

  @RabbitRPC({
    routingKey: 'auth.logout',
    exchange: 'exchange',
    queue: 'auth.logout',
  })
  logout() {
    try {
      return { success: true, token: '', httpOnly: true, maxAge: 0 };
    } catch (exception) {
      return {
        success: false,
        exception,
      };
    }
  }

  @RabbitRPC({
    routingKey: 'auth.validate',
    exchange: 'exchange',
    queue: 'auth.logout',
  })
  async validate(payload: { authentication: string }) {
    try {
      const user = await this.authService.getUserFromToken(
        payload.authentication,
      );
      return user;
    } catch (exception) {
      return {
        success: false,
        exception,
      };
    }
  }

  @RabbitRPC({
    routingKey: 'auth.changePassword',
    exchange: 'exchange',
    queue: 'auth.changePassword',
  })
  async changePassword(payload: RpcRequest<ChangePasswordDto>) {
    try {
      const { user_id: userId, data } = payload;
      const updatedUser = await this.userService.changePassword(userId, data);
      return updatedUser;
    } catch (exception) {
      return {
        success: false,
        exception,
      };
    }
  }
}
