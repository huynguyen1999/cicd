import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { DatabaseModule } from '../../../libs/database/src';
import { RabbitmqModule } from '../../../libs/rabbitmq/src';
import { AuthModule } from './modules/auth/auth.module';
import { AuthController } from './modules/auth/auth.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        MONGODB_URI: Joi.string().required(),
        RABBITMQ_URI: Joi.string().required(),
      }),
      envFilePath: './apps/gateway/.env',
    }),
    RabbitmqModule,
    AuthModule,
  ],
  controllers: [AuthController],
})
export class GatewayModule {}
