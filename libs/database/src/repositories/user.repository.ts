import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import {
  Model,
  Connection,
  FilterQuery,
  UpdateQuery,
  QueryOptions,
  FlattenMaps,
} from 'mongoose';
import { User, UserDocument } from '../schemas';
import { AbstractRepository } from '../abstract.repository';
import { RedisService } from '@app/redis';
import { USER_DATA, USER_SESSIONS } from '@app/common';

@Injectable()
export class UserRepository extends AbstractRepository<UserDocument> {
  protected readonly logger = new Logger(UserRepository.name);

  constructor(
    @InjectModel(User.name) userModel: Model<UserDocument>,
    @InjectConnection() connection: Connection,
    private redisService: RedisService,
  ) {
    super(userModel, connection);
  }

  override async findOneAndUpdate(
    filterQuery: FilterQuery<UserDocument>,
    update: UpdateQuery<UserDocument>,
    options?: QueryOptions<UserDocument>,
  ): Promise<UserDocument | FlattenMaps<UserDocument>> {
    const updatedUser = await super.findOneAndUpdate(
      filterQuery,
      update,
      options,
    );
    await this.redisService.set(
      USER_DATA(updatedUser._id.toString()),
      updatedUser,
      {
        KEEPTTL: true,
        XX: true,
      },
    );
    return updatedUser;
  }

  async updateManyAndCache(
    filterQuery: FilterQuery<UserDocument>,
    update: UpdateQuery<UserDocument>,
  ): Promise<any> {
    let users = await this.find(filterQuery, { _id: 1 });
    const result = await super.updateMany(filterQuery, update);
    users = await this.find(filterQuery);
    for (const user of users) {
      // set to redis if already existsed
      await this.redisService.set(USER_DATA(user._id.toString()), user, {
        XX: true,
      });
    }
    return result;
  }
}
