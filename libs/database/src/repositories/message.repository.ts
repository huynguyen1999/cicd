import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Message, MessageDocument, Room } from '../schemas';
import { AbstractRepository } from '../abstract.repository';

@Injectable()
export class MessageRepository extends AbstractRepository<MessageDocument> {
  protected readonly logger = new Logger(MessageRepository.name);

  constructor(
    @InjectModel(Message.name) messageModel: Model<MessageDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(messageModel, connection);
  }
}
