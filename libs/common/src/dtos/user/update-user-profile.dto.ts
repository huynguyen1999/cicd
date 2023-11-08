import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  full_name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  bio?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  file_name?: string;

  @ValidateIf((o) => typeof o.profile_picture !== 'undefined')
  @IsBoolean()
  used_as_identifier?: boolean;
}
