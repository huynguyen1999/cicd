import { Controller, UseGuards } from '@nestjs/common';
import { StsAuthGuard } from '@app/sts-auth';
import { SessionService } from '../services';
import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import {
  GetSessionsDto,
  RefreshSessionDto,
  RevokeSessionDto,
  RevokeSessionsDto,
  RpcRequest,
  UpdateRefreshTokenDto,
} from '@app/common';
import { RpcException } from '@nestjs/microservices';

@UseGuards(StsAuthGuard)
@Controller()
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @RabbitRPC({
    routingKey: 'session.getSessions',
    exchange: 'exchange',
    queue: 'session.getSessions',
  })
  async getSessions(@RabbitPayload() payload: RpcRequest<GetSessionsDto>) {
    const sessions = await this.sessionService.getSessions(
      payload.data,
      payload.user,
    );
    return sessions;
  }

  @RabbitRPC({
    routingKey: 'session.revokeSession',
    exchange: 'exchange',
    queue: 'session.revokeSession',
  })
  async revokeSession(@RabbitPayload() payload: RpcRequest<RevokeSessionDto>) {
    const { data, user } = payload;
    if (data.session_id === user.session) {
      throw new RpcException('Cannot revoke current session');
    }
    const session = await this.sessionService.revokeSession(
      payload.data,
      payload.user,
    );
    return session;
  }

  @RabbitRPC({
    routingKey: 'session.revokeSessions',
    exchange: 'exchange',
    queue: 'session.revokeSessions',
  })
  async revokeSessions(
    @RabbitPayload() payload: RpcRequest<RevokeSessionsDto>,
  ) {
    await this.sessionService.revokeMultipleSessions(
      payload.data,
      payload.user,
    );
    return true;
  }

  @RabbitRPC({
    routingKey: 'session.updateRefreshToken',
    exchange: 'exchange',
    queue: 'session.updateRefreshToken',
  })
  async updateRefreshToken(
    @RabbitPayload() payload: RpcRequest<UpdateRefreshTokenDto>,
  ) {
    const refreshToken = await this.sessionService.updateRefreshToken(
      payload.data,
      payload.user,
    );
    return refreshToken;
  }

  @RabbitRPC({
    routingKey: 'session.refreshSession',
    exchange: 'exchange',
    queue: 'session.refreshSession',
  })
  async refreshSession(
    @RabbitPayload() payload: RpcRequest<RefreshSessionDto>,
  ) {
    const newSession = await this.sessionService.refreshSession(
      payload.data,
      payload.user,
    );
    return { session: newSession.session_id, http_only: true };
  }
}
