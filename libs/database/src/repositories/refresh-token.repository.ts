import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { RefreshToken, RefreshTokenDocument } from '../schemas';
import { AbstractRepository } from '../abstract.repository';

@Injectable()
export class RefreshTokenRepository extends AbstractRepository<RefreshTokenDocument> {
  protected readonly logger = new Logger(RefreshTokenRepository.name);

  constructor(
    @InjectModel(RefreshToken.name)
    refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(refreshTokenModel, connection);
  }
}
