import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { User, UserDocument, UserRepository } from '@app/database';
import {
  SALT_ROUNDS,
  ChangePasswordDto,
  RegisterDto,
  RevokeSessionsDto,
  UpdateUserStatusDto,
  USER_DATA,
  GetUsersStatusDto,
} from '@app/common';
import * as bcryptjs from 'bcryptjs';
import { SessionService } from './session.service';
import { RedisService } from '@app/redis';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionService: SessionService,
    private readonly redisService: RedisService,
  ) {}

  async createUser(data: RegisterDto) {
    await this.validateCreateUserRequest(data);
    const hashedPassword = await bcryptjs.hash(data.password, SALT_ROUNDS);
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
      old_passwords: [hashedPassword],
    } as UserDocument);
    return user;
  }

  async getProfile(user: User) {
    const detailedUserProfile = await this.userRepository.findOne(
      { _id: user._id },
      '+blocked_users +role +date_of_registration +last_ip_address',
    );
    if (!detailedUserProfile) {
      throw new UnauthorizedException('User not found.');
    }
    return detailedUserProfile;
  }

  private async validateCreateUserRequest(data: RegisterDto) {
    const user: User = await this.userRepository.findOne({ email: data.email });
    if (user) {
      throw new UnprocessableEntityException('Email already exists.');
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({ email });
    const passwordIsValid = await bcryptjs.compare(password, user.password);
    if (!passwordIsValid) {
      throw new UnauthorizedException('Credentials are not valid.');
    }
    return user;
  }

  async changePassword(data: ChangePasswordDto, user: User) {
    // check confirm password match new password
    if (data.new_password !== data.password_confirm) {
      throw new UnprocessableEntityException('Passwords do not match.');
    }
    // check if password is same as current password
    if (data.new_password === data.current_password) {
      throw new UnprocessableEntityException(
        'New password cannot be same as old password.',
      );
    }
    user = await this.userRepository.findOne(
      { user_id: user._id.toString() },
      '+password +old_passwords',
    );
    // validate current password
    const passwordIsValid = await bcryptjs.compare(
      data.current_password,
      user.password,
    );
    if (!passwordIsValid) {
      throw new UnauthorizedException('Credentials are not valid.');
    }

    // check if new password is already used
    const oldPasswords = user.old_passwords || [user.password];
    for await (const oldPassword of oldPasswords) {
      const isUsed = await bcryptjs.compare(data.new_password, oldPassword);
      if (isUsed) {
        throw new UnprocessableEntityException('Password already used.');
      }
    }
    // update password
    const hashedNewPassword = await bcryptjs.hash(
      data.new_password,
      SALT_ROUNDS,
    );
    await this.sessionService.revokeMultipleSessions(
      { whitelist: [user.session] } as RevokeSessionsDto,
      user,
    );
    return await this.userRepository.findOneAndUpdate(
      { user_id: user._id },
      {
        password: hashedNewPassword,
        $push: { old_passwords: hashedNewPassword },
      },
    );
  }

  async updateLastActivityTime(user: User) {
    await this.userRepository.findOneAndUpdate(
      { _id: user._id },
      { last_activity_at: new Date() },
    );
  }

  async updateUserStatus(data: UpdateUserStatusDto, user: User) {
    const { status } = data;

    // update to the database then update to redis
    return await this.userRepository.findOneAndUpdate(
      { _id: user._id },
      { status },
    );
  }

  async getUsersStatus(data: GetUsersStatusDto, user: User) {
    const userDataKeys: string[] = data.user_ids.map((userId) =>
      USER_DATA(userId),
    );
    console.log(userDataKeys);
    const users: Partial<User>[] = await this.redisService.getMultiple(
      userDataKeys,
    );
    return users
      .filter((user) => user !== null)
      .map((user) => ({ _id: user._id, status: user.status }));
  }
}
