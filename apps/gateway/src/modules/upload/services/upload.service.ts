import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitmqService } from '@app/rabbitmq';
import { UploadDto, UploadType, UploadedFileStatus } from '@app/common';
import {
  UploadedFileDocument,
  UploadedFileRepository,
  User,
} from '@app/database';
import * as FileSystem from 'fs';
import { promises as fsPromises } from 'fs';
import { join } from 'path';
import { v4 as uuid } from 'uuid';

@Injectable()
export class UploadService implements OnModuleInit {
  constructor(
    private readonly rmqService: RabbitmqService,
    private readonly uploadedFileRepository: UploadedFileRepository,
  ) {}

  onModuleInit() {
    for (const type of Object.values(UploadType)) {
      const path = join(__dirname, '../../../public', type);
      if (!FileSystem.existsSync(path)) {
        FileSystem.mkdirSync(path, { recursive: true });
      }
    }
  }

  async saveFiles(
    files: Array<Express.Multer.File>,
    data: UploadDto,
    user: User,
  ) {
    const paths = [];
    for await (const file of files) {
      const randomFileName = uuid() + '.' + file.originalname.split('.').pop();
      const path = join(
        __dirname,
        '../../../public',
        data.type,
        randomFileName,
      );
      await fsPromises.writeFile(path, file.buffer);
      const uploadedFileDoc = await this.uploadedFileRepository.create({
        original_name: file.originalname,
        name: randomFileName,
        path,
        size: file.size,
        status: UploadedFileStatus.Active,
        created_by: user._id,
      } as UploadedFileDocument);
      paths.push({
        original_name: file.originalname,
        path,
      });
      this.rmqService.publish({ data: { path }, user }, 'ai.nsfwClassifier');
    }
    return paths;
  }
}
