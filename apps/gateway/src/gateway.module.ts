import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { RabbitmqModule } from '@app/rabbitmq';
import { AuthModule } from './modules/auth/auth.module';
import * as modules from './modules';
import { RedisModule } from '@app/redis';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { WsThrottlerGuard } from './guards';

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
        THROTTLER_TTL: Joi.number().required(),
        THROTTLER_LIMIT: Joi.number().required(),
      }),
      envFilePath: './apps/gateway/.env',
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('THROTTLER_TTL'),
        limit: configService.get('THROTTLER_LIMIT'),
      }),
      inject: [ConfigService],
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
  providers: [
    {
      provide: APP_GUARD,
      useClass: WsThrottlerGuard,
    },
  ],
})
export class GatewayModule {}
