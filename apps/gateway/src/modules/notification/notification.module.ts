import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationListener, NotificationService } from './services';

@Module({
  imports: [],
  providers: [NotificationListener, NotificationService],
  controllers: [NotificationController],
})
export class NotificationModule {}
