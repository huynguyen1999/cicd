import { Module } from '@nestjs/common';
import { MessageController } from './message.controller';

@Module({ imports: [], controllers: [MessageController] })
export class MessageModule {}
