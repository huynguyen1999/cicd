import { Module } from '@nestjs/common';
import { UploadService } from './services/upload.service';
import { UploadController } from './upload.controller';
import { UploadValidatorService } from './services';

@Module({
  imports: [],
  controllers: [UploadController],
  providers: [UploadService, UploadValidatorService],
})
export class UploadModule {}
