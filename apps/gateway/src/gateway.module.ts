import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { RabbitmqModule } from '@app/rabbitmq';
import { AuthModule } from './modules/auth/auth.module';
import * as modules from './modules';
import { RedisModule } from '@app/redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().required(),
        SOCKET_IO_PORT: Joi.number().required(),
        MONGODB_URI: Joi.string().required(),
        RABBITMQ_URI: Joi.string().required(),
        REDIS_URI: Joi.string().required(),
      }),
      envFilePath: './apps/gateway/.env',
    }),
    RedisModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        url: configService.get('REDIS_URI'),
      }),
      inject: [ConfigService],
    }),
    RabbitmqModule,
    AuthModule,
    ...Object.values(modules),
  ],
})
export class GatewayModule {}
