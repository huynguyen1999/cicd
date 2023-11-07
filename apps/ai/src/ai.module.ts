import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule } from '@app/redis';
import { DatabaseModule } from '@app/database';
import { RabbitmqModule } from '@app/rabbitmq';
import * as controllers from './controllers';
import * as services from './service';
import * as Joi from 'joi';
import { AxiosModule } from '@app/axios';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().required(),
        MODEL_PORT: Joi.number().required(),
        SERVICE_NAME: Joi.string().required(),
        MONGODB_URI: Joi.string().required(),
        RABBITMQ_URI: Joi.string().required(),
        REDIS_URI: Joi.string().required(),
      }),
      envFilePath: './apps/ai/.env',
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
    AxiosModule,
  ],
  providers: [...Object.values(services), ...Object.values(controllers)],
})
export class AiModule {}
