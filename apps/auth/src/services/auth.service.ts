import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from './user.service';
import * as bcryptjs from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from '../../../../libs/dto/src';


@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(data: LoginDto) {
    const user = await this.userService.getUser({ email: data.email });
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
    const user = await this.userService.getUser({ _id: userId });
    console.log('user', user);
    return user;
  }
}
