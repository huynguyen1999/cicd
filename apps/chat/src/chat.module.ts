import { Module } from '@nestjs/common';
import * as controllers from './controllers';
import * as services from './services';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@app/database';
import { RabbitmqModule } from '@app/rabbitmq';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().required(),
        MONGODB_URI: Joi.string().required(),
        RABBITMQ_URI: Joi.string().required(),
      }),
      envFilePath: './apps/chat/.env',
    }),
    DatabaseModule,
    RabbitmqModule,
  ],
  providers: [...Object.values(controllers), ...Object.values(services)],
})
export class ChatModule {}
