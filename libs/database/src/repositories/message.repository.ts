import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Message, Room } from '../schemas';
import { AbstractRepository } from '../abstract.repository';

@Injectable()
export class MessageRepository extends AbstractRepository<Message> {
  protected readonly logger = new Logger(MessageRepository.name);

  constructor(
    @InjectModel(Message.name) messageModel: Model<Message>,
    @InjectConnection() connection: Connection,
  ) {
    super(messageModel, connection);
  }
}
