import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcryptjs from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '@app/common';
import { UserRepository } from '@app/database';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: LoginDto) {
    const user = await this.userRepository.findOne(
      { email: data.email },
      '+password',
    );
    if (!user) {
      throw new UnauthorizedException('Credentials are not valid');
    }
    const isValidPassword = await bcryptjs.compare(
      data.password,
      user.password,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException('Credentials are not valid.');
    }
    const maxAge = this.configService.get('JWT_EXPIRATION') * 1000;
    const tokenPayload = { user_id: user._id.toHexString() };
    const token = this.jwtService.sign(tokenPayload);
    return { token, maxAge };
  }

  async getUserFromToken(token: string) {
    const tokenPayload = this.jwtService.verify(token);
    const { user_id: userId } = tokenPayload;
    const user = await this.userRepository.findOne({ _id: userId });
    return user;
  }
}
