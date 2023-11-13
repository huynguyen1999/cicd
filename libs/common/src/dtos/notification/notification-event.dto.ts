import { Notification } from '@app/database';
export class NotificationEventDto {
  data: Notification;
  [key: string]: any;
}
