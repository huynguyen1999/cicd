export enum NotificationStatus {
  Unread = 'unread',
  Read = 'read',
  Archived = 'archived',
}

export const NOTIFICATION_EVENT = (userId: string) => `notification.${userId}`;
