import { Global, Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';

@Global()
@Module({
  imports: [],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
