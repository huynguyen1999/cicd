import { IsEnum, IsString } from 'class-validator';
import { NotificationStatus } from '../../constants';

export class UpdateNotificationsStatusDto {
  @IsString({ each: true })
  notification_ids: string[] = [];

  @IsEnum(NotificationStatus)
  status: NotificationStatus;
}
