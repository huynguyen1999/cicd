import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RabbitmqModule } from '@app/rabbitmq';
import { DatabaseModule } from '@app/database';
import { RedisModule } from '@app/redis';
import { StsAuthModule } from '@app/sts-auth';
import { BullModule } from '@nestjs/bull';
import * as Joi from 'joi';
import * as services from './services';
import * as processors from './processors';
import * as controllers from './controllers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().required(),
        SERVICE_NAME: Joi.string().required(),
        MONGODB_URI: Joi.string().required(),
        RABBITMQ_URI: Joi.string().required(),
        REDIS_URI: Joi.string().required(),
      }),
      envFilePath: './apps/auth/.env',
    }),
    RedisModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        url: configService.get('REDIS_URI'),
      }),
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        url: configService.get('REDIS_URI'),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'auth',
    }),
    StsAuthModule,
    DatabaseModule,
    RabbitmqModule,
  ],
  providers: [
    ...Object.values(services),
    ...Object.values(processors),
    ...Object.values(controllers),
  ],
})
export class AuthModule {}
