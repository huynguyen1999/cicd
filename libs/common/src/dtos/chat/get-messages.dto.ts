import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetMessagesDto {
  @IsString()
  @IsNotEmpty()
  room_id: string;

  @IsOptional()
  @IsNumber()
  limit: number;

  @IsOptional()
  @IsNumber()
  skip: number;

  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value === 'true';
    return value;
  })
  pagination: boolean;
}
