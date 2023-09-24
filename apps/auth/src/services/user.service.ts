import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';

import * as bcryptjs from 'bcryptjs';
import { SALT_ROUNDS } from '../auth.constant';
import { User, UserRepository } from '../../../../libs/database/src';
import { ChangePasswordDto, RegisterDto } from '../../../../libs/dto/src';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}
  async getUser(filter: Partial<User>): Promise<User> {
    const user: User = await this.userRepository.findOne(filter);
    return user;
  }

  // This function creates a new user in the database.
  async createUser(data: RegisterDto) {
    await this.validateCreateUserRequest(data);
    const user = await this.userRepository.create({
      ...data,
      password: await bcryptjs.hash(data.password, SALT_ROUNDS),
    });
    return user;
  }

  private async validateCreateUserRequest(data: RegisterDto) {
    const user: User = await this.getUser({ email: data.email });
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

  async changePassword(userId: string, data: ChangePasswordDto) {
    if (data.password !== data.password_confirm) {
      throw new UnprocessableEntityException('Passwords do not match.');
    }
    return await this.userRepository.findOneAndUpdate(
      { user_id: userId },
      {
        password: await bcryptjs.hash(data.password, SALT_ROUNDS),
      },
    );
  }
}
