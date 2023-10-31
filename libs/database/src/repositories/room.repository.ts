import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Room, RoomDocument } from '../schemas';
import { AbstractRepository } from '../abstract.repository';

@Injectable()
export class RoomRepository extends AbstractRepository<RoomDocument> {
  protected readonly logger = new Logger(RoomRepository.name);

  constructor(
    @InjectModel(Room.name) roomModel: Model<RoomDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(roomModel, connection);
  }
}
