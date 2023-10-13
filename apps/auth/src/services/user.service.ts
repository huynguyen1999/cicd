import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';

import * as bcryptjs from 'bcryptjs';
import { User, UserRepository } from '@app/database';
import { SALT_ROUNDS, ChangePasswordDto, RegisterDto } from '@app/common';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  // This function creates a new user in the database.
  async createUser(data: RegisterDto) {
    await this.validateCreateUserRequest(data);
    const hashedPassword = await bcryptjs.hash(data.password, SALT_ROUNDS);
    const user = await this.userRepository.create({
      ...data,
      password: hashedPassword,
      old_passwords: [hashedPassword],
    });
    return user;
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

  async changePassword(userId: string, data: ChangePasswordDto) {
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
    const user = await this.userRepository.findOne(
      { user_id: userId },
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
    return await this.userRepository.findOneAndUpdate(
      { user_id: userId },
      {
        password: hashedNewPassword,
        $push: { old_passwords: hashedNewPassword },
      },
    );
  }
}
