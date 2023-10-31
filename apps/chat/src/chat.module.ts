import { Module } from '@nestjs/common';
import * as controllers from './controllers';
import * as services from './services';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { RabbitmqModule } from '@app/rabbitmq';
import * as Joi from 'joi';
import { RedisModule } from '@app/redis';

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
      envFilePath: './apps/chat/.env',
    }),
    RedisModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        url: configService.get('REDIS_URI'),
      }),
      inject: [ConfigService],
    }),
    DatabaseModule,
    RabbitmqModule,
  ],
  providers: [...Object.values(controllers), ...Object.values(services)],
})
export class ChatModule {}
