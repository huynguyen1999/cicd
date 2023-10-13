import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Room } from '../schemas';
import { AbstractRepository } from '../abstract.repository';

@Injectable()
export class RoomRepository extends AbstractRepository<Room> {
  protected readonly logger = new Logger(RoomRepository.name);

  constructor(
    @InjectModel(Room.name) roomModel: Model<Room>,
    @InjectConnection() connection: Connection,
  ) {
    super(roomModel, connection);
  }
}
