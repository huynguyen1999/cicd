import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { UploadedFile, UploadedFileDocument } from '../schemas';
import { AbstractRepository } from '../abstract.repository';

@Injectable()
export class UploadedFileRepository extends AbstractRepository<UploadedFileDocument> {
  protected readonly logger = new Logger(UploadedFileRepository.name);

  constructor(
    @InjectModel(UploadedFile.name)
    uploadedFileModel: Model<UploadedFileDocument>,
    @InjectConnection() connection: Connection,
  ) {
    super(uploadedFileModel, connection);
  }
}
