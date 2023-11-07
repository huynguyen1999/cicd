import {
  Body,
  Controller,
  Post,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UploadService } from './services';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SessionGuard } from '../../guards';
import { Response } from 'express';
import { CurrentUser, UploadDto } from '@app/common';
import { UploadValidatorService } from './services';
import { User } from '@app/database';

@UseGuards(SessionGuard)
@Controller('upload')
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly uploadValidateService: UploadValidatorService,
  ) {}

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async upload(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() body: UploadDto,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    await this.uploadValidateService.validateFiles(files, body, user);
    const paths = await this.uploadService.saveFiles(files, body, user);
    return res.status(200).send(paths);
  }
}
