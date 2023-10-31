import { Logger, NotFoundException } from '@nestjs/common';
import {
  FilterQuery,
  Model,
  Types,
  UpdateQuery,
  SaveOptions,
  Connection,
  FlattenMaps,
  ProjectionType,
  QueryOptions,
} from 'mongoose';
import { AbstractDocument } from './abstract.schema';

export abstract class AbstractRepository<TDocument extends AbstractDocument> {
  protected abstract readonly logger: Logger;

  constructor(
    protected readonly model: Model<TDocument>,
    private readonly connection: Connection,
  ) {}

  async create(
    document: Omit<TDocument, '_id'>,
    options?: SaveOptions,
  ): Promise<TDocument> {
    const createdDocument = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });
    return (await createdDocument.save(options)) as unknown as TDocument;
  }

  async findOne(
    filterQuery: FilterQuery<TDocument>,
    projection?: ProjectionType<TDocument>,
    options?: QueryOptions<TDocument>,
  ): Promise<TDocument | FlattenMaps<TDocument>> {
    const document = await this.model.findOne(filterQuery, projection, {
      lean: true,
      ...options,
    });
    return document;
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
    options?: QueryOptions<TDocument>,
  ): Promise<TDocument | FlattenMaps<TDocument>> {
    const document = await this.model.findOneAndUpdate(filterQuery, update, {
      lean: true,
      new: true,
      ...options,
    });
    return document;
  }

  async find(
    filterQuery: FilterQuery<TDocument>,
    projection?: ProjectionType<TDocument>,
    options?: QueryOptions<TDocument>,
  ) {
    return this.model.find(filterQuery, projection, { lean: true, ...options });
  }

  async updateMany(
    filterQuery: FilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
  ): Promise<any> {
    return this.model.updateMany(filterQuery, update);
  }

  async paginate(
    filterQuery: FilterQuery<TDocument>,
    options?: QueryOptions<TDocument>,
  ) {
    // @ts-ignore
    return await this.model.paginate(filterQuery, {
      lean: true,
      ...options,
    });
  }

  async startTransaction() {
    const session = await this.connection.startSession();
    session.startTransaction();
    return session;
  }
}
