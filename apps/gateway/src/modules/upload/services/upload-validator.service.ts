import { BadRequestException, Injectable } from '@nestjs/common';
import { FileExtension, TYPE_UPLOAD_CONFIGS, UploadDto } from '@app/common';
import { fromBuffer } from 'file-type';
import { User } from '@app/database';

@Injectable()
export class UploadValidatorService {
  private isExtensionBlocked(
    extension: string,
    mime: string,
    whitelist: FileExtension[],
    blacklist: FileExtension[],
  ) {
    const isBlocked = blacklist.some(
      (bl) => bl.ext === extension || bl.mime === mime,
    );
    if (isBlocked) {
      return true;
    }
    const isWhitelisted = whitelist.some(
      (wl) => wl.ext === extension && wl.mime === mime,
    );
    if (isWhitelisted) {
      return false;
    }
    // not in black list and not in white list
    return false;
  }

  private validateSize(file: Express.Multer.File, maxSize: number) {
    if (file.size >= maxSize) {
      throw new BadRequestException('File size too large');
    }
  }
  private async validateExtension(
    file: Express.Multer.File,
    whitelist: FileExtension[],
    blacklist: FileExtension[],
  ) {
    const { ext, mime } = await fromBuffer(file.buffer);
    if (!ext || !mime) {
      throw new BadRequestException('Invalid file type');
    }
    if (mime !== file.mimetype) {
      throw new BadRequestException('Invalid file mime type');
    }
    if (this.isExtensionBlocked(ext, mime, whitelist, blacklist)) {
      throw new BadRequestException('Invalid file extension');
    }
    return { ext, mime };
  }

  async validateFiles(
    files: Array<Express.Multer.File>,
    data: UploadDto,
    user: User,
  ) {
    const { type } = data;
    const typeUploadConfig = TYPE_UPLOAD_CONFIGS[type];
    if (!typeUploadConfig) {
      throw new BadRequestException(
        'Upload config not available for type ' + type,
      );
    }
    const {
      max_size_in_bytes: maxSize,
      whitelist,
      blacklist,
    } = typeUploadConfig;
    for await (const file of files) {
      this.validateSize(file, maxSize);
      const { ext, mime } = await this.validateExtension(
        file,
        whitelist,
        blacklist,
      );
    }
  }
}
