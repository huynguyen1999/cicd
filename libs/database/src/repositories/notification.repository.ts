import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection, SaveOptions } from 'mongoose';
import { Notification, NotificationDocument } from '../schemas';
import { AbstractRepository } from '../abstract.repository';
import { RabbitmqService } from '@app/rabbitmq';

@Injectable()
export class NotificationRepository extends AbstractRepository<NotificationDocument> {
  protected readonly logger = new Logger(NotificationRepository.name);
  constructor(
    @InjectModel(Notification.name)
    notificationModel: Model<NotificationDocument>,
    @InjectConnection() connection: Connection,
    private readonly rmqService: RabbitmqService,
  ) {
    super(notificationModel, connection);
  }

  override async create(
    document: Omit<NotificationDocument, '_id'>,
    options?: SaveOptions,
  ): Promise<NotificationDocument> {
    const createdDocument = super.create(document, options);

    this.rmqService.publish({ data: document }, 'gateway.pushNotification');

    return createdDocument;
  }
}
