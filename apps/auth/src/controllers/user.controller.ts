import { Controller, UseGuards } from '@nestjs/common';
import { StsAuthGuard } from '@app/sts-auth';
import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import {
  GetUsersStatusDto,
  RpcRequest,
  UpdateUserProfileDto,
  UpdateUserStatusDto,
} from '@app/common';
import { UserService } from '../services';

@UseGuards(StsAuthGuard)
@Controller()
export class UserController {
  constructor(private userService: UserService) {}

  @RabbitRPC({
    routingKey: 'user.getProfile',
    exchange: 'exchange',
    queue: 'user.getProfile',
  })
  async getUserProfile(@RabbitPayload() payload: RpcRequest<{}>) {
    return await this.userService.getProfile(payload.user);
  }

  @RabbitRPC({
    routingKey: 'user.updateUserStatus',
    exchange: 'exchange',
    queue: 'user.updateUserStatus',
  })
  async updateUserStatus(
    @RabbitPayload() payload: RpcRequest<UpdateUserStatusDto>,
  ) {
    return await this.userService.updateUserStatus(payload.data, payload.user);
  }

  @RabbitRPC({
    routingKey: 'user.getUsersStatus',
    exchange: 'exchange',
    queue: 'user.getUsersStatus',
  })
  async getUsersStatus(
    @RabbitPayload() payload: RpcRequest<GetUsersStatusDto>,
  ) {
    return await this.userService.getUsersStatus(payload.data, payload.user);
  }

  @RabbitRPC({
    routingKey: 'user.updateProfile',
    exchange: 'exchange',
    queue: 'user.updateProfile',
  })
  async updateUserProfile(
    @RabbitPayload() payload: RpcRequest<UpdateUserProfileDto>,
  ) {
    const { data, user } = payload;
    return await this.userService.updateUserProfile(data, user);
  }
}
