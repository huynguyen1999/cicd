import { IsEnum, IsString } from 'class-validator';
import { UploadType } from '../../constants';

export class UploadDto {
  @IsString()
  @IsEnum(UploadType)
  type: UploadType;
}
