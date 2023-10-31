import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RevokeSessionsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MinLength(1)
  session_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whitelist?: string[];

  @IsOptional()
  @IsBoolean()
  keep_current?: boolean = true;
}
