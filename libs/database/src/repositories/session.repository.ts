import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  Model,
  Connection,
  FilterQuery,
  FlattenMaps,
  QueryOptions,
  UpdateQuery,
  SaveOptions,
} from 'mongoose';
import { Session, SessionDocument } from '../schemas';
import { AbstractRepository } from '../abstract.repository';
import { RedisService } from '@app/redis';
import { SessionStatus, USER_SESSIONS } from '@app/common';

@Injectable()
export class SessionRepository extends AbstractRepository<SessionDocument> {
  protected readonly logger = new Logger(SessionRepository.name);

  constructor(
    @InjectModel(Session.name) sessionModel: Model<SessionDocument>,
    @InjectConnection() connection: Connection,
    private redisService: RedisService,
  ) {
    super(sessionModel, connection);
  }
  override async findOneAndUpdate(
    filterQuery: FilterQuery<SessionDocument>,
    update: UpdateQuery<SessionDocument>,
    options?: QueryOptions<SessionDocument>,
  ): Promise<SessionDocument | FlattenMaps<SessionDocument>> {
    const updatedSession = await super.findOneAndUpdate(
      filterQuery,
      update,
      options,
    );
    if (update.status === SessionStatus.Active) {
      this.redisService.set(
        USER_SESSIONS(updatedSession.session_id),
        updatedSession.user.toString(),
      );
    } else {
      this.redisService.deleteKey(USER_SESSIONS(updatedSession.session_id));
    }
    return updatedSession;
  }

  override async updateMany(
    filterQuery: FilterQuery<SessionDocument>,
    update: UpdateQuery<SessionDocument>,
  ): Promise<any> {
    const sessions = await this.find(filterQuery, { _id: 1, session_id: 1 });
    const result = await super.updateMany(filterQuery, update);
    if (update.status !== SessionStatus.Active) {
      for (const session of sessions) {
        this.redisService.deleteKey(USER_SESSIONS(session.session_id));
      }
    }
    return result;
  }

  override async create(
    document: Omit<SessionDocument, '_id'>,
    options?: SaveOptions,
  ): Promise<SessionDocument> {
    const createdDocument = await super.create(document, options);
    this.redisService.set(
      USER_SESSIONS(createdDocument.session_id),
      createdDocument.user.toString(),
    );
    // having expiration
    if (createdDocument.expired_at) {
      const duration =
        createdDocument.expired_at.getTime() -
        createdDocument.created_at.getTime();
      this.redisService.set(
        USER_SESSIONS(createdDocument.session_id),
        createdDocument.user.toString(),
        { PX: duration },
      );
    }
    return createdDocument as SessionDocument;
  }
}
