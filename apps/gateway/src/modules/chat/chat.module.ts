import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';

@Module({
  imports: [],
  providers: [ChatController],
})
export class ChatModule {}
