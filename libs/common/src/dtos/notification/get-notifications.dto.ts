import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { NotificationStatus } from '@app/common';
import { Type } from 'class-transformer';

export class TimeRangeDto {
  @IsOptional()
  @IsNumber()
  from_time?: number;

  @IsOptional()
  @IsNumber()
  to_time?: number;
}

export class GetNotificationsDto {
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @IsOptional()
  @ValidateNested()
  created_at?: TimeRangeDto;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;
}
