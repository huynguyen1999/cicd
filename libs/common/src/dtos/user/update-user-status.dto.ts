import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserStatus } from '@app/common';

export class UpdateUserStatusDto {
  @IsString()
  @IsNotEmpty()
  status: UserStatus;
}
