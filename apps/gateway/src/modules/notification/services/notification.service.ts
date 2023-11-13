import { Injectable } from '@nestjs/common';
import { NotificationRepository, User } from '@app/database';
import {
  GetNotificationsDto,
  UpdateNotificationsStatusDto,
  removeUndefinedFields,
} from '@app/common';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async retrieveNotifications(data: GetNotificationsDto, user: User) {
    const filter: any = removeUndefinedFields({
      recipient: user._id,
      title: data.title ? { $regex: `.*${data.title}.*`, $options: 'i' } : null,
      status: data.status,
      created_at: data.created_at
        ? {
            $gte: data.created_at.from_time
              ? new Date(data.created_at.from_time)
              : null,
            $lte: data.created_at.to_time
              ? new Date(data.created_at.to_time)
              : null,
          }
        : null,
    });
    const notifications = await this.notificationRepository.paginate(filter, {
      projection: { message: 1 },
      sort: { created_at: -1 },
    });
    return notifications.docs || [];
  }

  async updateNotificationsStatus(
    data: UpdateNotificationsStatusDto,
    user: User,
  ) {
    const filter = {
      recipient: user._id,
      _id: { $in: data.notification_ids },
    };
    const updatedNotifications = await this.notificationRepository.updateMany(
      filter,
      { status: data.status },
    );
    return updatedNotifications;
  }
}
