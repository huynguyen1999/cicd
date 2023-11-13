import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class SwapByFilesDto {
  @IsString()
  @IsNotEmpty()
  source: string;

  @IsString()
  @IsNotEmpty()
  target: string;
}

class SwapByUsersDto {
  @IsString()
  @IsNotEmpty()
  source: string;

  @IsString()
  @IsNotEmpty()
  target: string;
}

export class FaceSwapDto {
  @IsOptional()
  @ValidateNested()
  files?: SwapByFilesDto;

  @IsOptional()
  @ValidateNested()
  users?: SwapByUsersDto;
}
