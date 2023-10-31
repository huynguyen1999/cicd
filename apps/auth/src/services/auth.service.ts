import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  CreateSessionDto,
  LoginDto,
  LogoutDto,
  SessionStatus,
  UserStatus,
  ValidateDto,
} from '@app/common';
import { SessionRepository, User, UserRepository } from '@app/database';
import { SessionService } from './session.service';
import * as bcryptjs from 'bcryptjs';
import { UserService } from './user.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userService: UserService,
    private readonly sessionRepository: SessionRepository,
    private readonly sessionService: SessionService,
  ) {}

  async login(data: LoginDto) {
    const user = await this.userRepository.findOne(
      { email: data.email },
      '+password',
    );
    if (!user) {
      throw new UnauthorizedException('Credentials are not valid');
    }
    const { password: userPassword, ...userWithoutPassword } = user;
    const isValidPassword = await bcryptjs.compare(data.password, userPassword);
    if (!isValidPassword) {
      throw new UnauthorizedException('Credentials are not valid.');
    }
    await this.userService.updateUserStatus(
      { status: UserStatus.Online },
      user,
    );
    const session = await this.sessionService.saveSession(
      data as CreateSessionDto,
      userWithoutPassword,
    );
    const refreshToken = await this.sessionService.createRefreshToken(
      session,
      user,
    );

    return {
      session: session.session_id,
      refresh_token: refreshToken.token,
      user,
    };
  }

  async logout(data: LogoutDto, user: User) {
    await this.sessionService.revokeSession(
      { session_id: data.session_id },
      user,
    );
    await this.userService.updateUserStatus(
      {
        status: UserStatus.Offline,
      },
      user,
    );
    return true;
  }

  async getUserFromSession(data: ValidateDto) {
    const { user_id, session_id } = data;
    const [session, user] = await Promise.all([
      this.sessionRepository.findOne({
        session_id,
        status: SessionStatus.Active,
        expired_at: { $gte: new Date() },
      }),
      this.userRepository.findOne({ _id: user_id }),
    ]);

    if (!session) {
      throw new UnauthorizedException('Unauthorized');
    }
    return user;
  }
}
