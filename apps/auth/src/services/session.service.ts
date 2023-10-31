import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  RefreshTokenDocument,
  RefreshTokenRepository,
  Session,
  SessionDocument,
  SessionRepository,
  User,
} from '@app/database';
import {
  CreateSessionDto,
  GetSessionsDto,
  REFRESH_TOKEN_DURATION_MS,
  RefreshSessionDto,
  RefreshTokenStatus,
  RevokeSessionDto,
  RevokeSessionsDto,
  SessionStatus,
  USER_DATA,
  USER_SESSIONS,
  UpdateRefreshTokenDto,
  UserStatus,
} from '@app/common';
import { RedisService } from '@app/redis';
import { v4 as uuid } from 'uuid';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { RpcException } from '@nestjs/microservices';
import { FilterQuery, Types } from 'mongoose';

@Injectable()
export class SessionService implements OnModuleInit {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly redisService: RedisService,
    @InjectQueue('auth') private readonly authQueue: Queue,
  ) {}

  async onModuleInit() {
    const activeSessions = await this.sessionRepository.find({
      status: SessionStatus.Active,
      expired_at: { $gte: new Date() },
    });
    activeSessions.forEach((session) => {
      this.redisService.set(
        USER_SESSIONS(session.session_id),
        session.user.toString(),
        {
          PXAT: session.expired_at.getTime(),
        },
      );
    });
  }

  async saveSession(data: CreateSessionDto, user: Partial<User>) {
    const expiryDate = new Date(Date.now() + data.duration);
    const session = await this.sessionRepository.create({
      session_id: uuid(),
      user: user._id,
      status: SessionStatus.Active,
      ip_address: data.ip_address,
      user_agent: data.user_agent,
      expired_at: expiryDate,
    } as SessionDocument);
    // expire session after duration
    this.authQueue.add(
      'expireSession',
      {
        session_id: session.session_id,
      },
      { delay: data.duration, removeOnComplete: true, removeOnFail: true },
    );
    // save user to redis if not available for fast retrieval
    this.redisService.set(
      USER_DATA(user._id.toString()),
      { ...user, status: UserStatus.Online },
      {
        PX: data.duration,
      },
    );
    return session;
  }

  async revokeSession(data: RevokeSessionDto, user: User) {
    const session = await this.sessionRepository.findOneAndUpdate(
      {
        session_id: data.session_id,
        user: user._id.toString(),
      },
      {
        status: SessionStatus.Revoked,
      },
    );
    if (!session) {
      throw new RpcException('Session Not Found');
    }
    return session;
  }

  async revokeMultipleSessions(data: RevokeSessionsDto, user: User) {
    const filter: FilterQuery<Session> = {
      user: user._id,
      status: SessionStatus.Active,
    };
    if (data.session_ids?.length) {
      filter.session_id = { $in: data.session_ids };
    }
    if (data.keep_current) {
      data.whitelist = [...data.whitelist, user.session];
    }
    if (data.whitelist?.length) {
      filter.session_id = { ...filter.session_id, $nin: data.whitelist };
    }

    await this.sessionRepository.updateMany(filter, {
      status: SessionStatus.Revoked,
    });
    this.redisService.deleteKey(USER_DATA(user._id.toString()));
  }

  async getSessions(data: GetSessionsDto, user: User) {
    const filter: FilterQuery<Session> = {
      user: user._id,
      status: SessionStatus.Active,
    };
    if (data.session_ids) {
      filter.session_id = { $in: data.session_ids };
    }
    const sessions = await this.sessionRepository.find(filter);
    return sessions;
  }

  async refreshSession(data: RefreshSessionDto, user: User) {
    const refreshTokenFilter = {
      token: data.refresh_token,
      user: user._id,
      status: RefreshTokenStatus.Active,
    };
    const refreshToken = await this.refreshTokenRepository.findOne(
      refreshTokenFilter,
    );
    if (!refreshToken) {
      throw new RpcException('No refresh token found');
    }
    // deactivate other sessions of refresh token
    await this.sessionRepository.updateMany(
      {
        session_id: { $in: refreshToken.sessions },
      },
      { status: SessionStatus.Revoked },
    );
    const newSession = await this.saveSession(data as CreateSessionDto, user);
    await this.refreshTokenRepository.findOneAndUpdate(refreshTokenFilter, {
      $push: { sessions: newSession.session_id },
    });
    return newSession;
  }

  async updateRefreshToken(data: UpdateRefreshTokenDto, user: User) {
    const refreshTokenFilter = {
      token: data.refresh_token,
      user: user._id,
    };
    const refreshToken = await this.refreshTokenRepository.findOneAndUpdate(
      refreshTokenFilter,
      {
        status: data.status,
      },
    );
    if (!refreshToken) {
      throw new RpcException('No refresh token found');
    }
    return refreshToken;
  }

  async createRefreshToken(session: SessionDocument, user: User) {
    const refreshToken = await this.refreshTokenRepository.create({
      token: uuid(),
      user: new Types.ObjectId(user._id),
      sessions: [session.session_id],
      status: RefreshTokenStatus.Active,
      expired_at: new Date(Date.now() + REFRESH_TOKEN_DURATION_MS),
    } as RefreshTokenDocument);
    this.authQueue.add(
      'expireRefreshToken',
      {
        refresh_token: refreshToken.token,
      },
      {
        delay: REFRESH_TOKEN_DURATION_MS,
        removeOnComplete: true,
        removeOnFail: true,
      },
    );
    session.refresh_token = refreshToken.token;
    await session.save();
    return refreshToken;
  }
}
