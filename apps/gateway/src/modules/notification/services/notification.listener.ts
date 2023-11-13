import { RabbitPayload, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NOTIFICATION_EVENT, NotificationEventDto } from '@app/common';

@Injectable()
export class NotificationListener {
  constructor(private notificationEvent: EventEmitter2) {}
  @RabbitSubscribe({
    routingKey: 'gateway.pushNotification',
    exchange: 'exchange',
    queue: 'gateway.pushNotification',
  })
  public async listen(@RabbitPayload() payload: any) {
    const { data } = payload;
    if (!data?.recipient) {
      return;
    }
    this.notificationEvent.emit(NOTIFICATION_EVENT(data.recipient.toString()), {
      message: data.message,
      timestamp: Date.now(),
    });
  }
}
