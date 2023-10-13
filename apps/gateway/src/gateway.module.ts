import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { RabbitmqModule } from '@app/rabbitmq';
import { AuthModule } from './modules/auth/auth.module';
import * as modules from './modules';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().required(),
        SOCKET_IO_PORT: Joi.number().required(),
        MONGODB_URI: Joi.string().required(),
        RABBITMQ_URI: Joi.string().required(),
      }),
      envFilePath: './apps/gateway/.env',
    }),
    RabbitmqModule,
    AuthModule,
    ...Object.values(modules),
  ],
})
export class GatewayModule {}
