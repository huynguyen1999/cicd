import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SessionController } from './session.controller';

@Module({
  controllers: [AuthController, SessionController],
})
export class AuthModule {}
