import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TranslateMessageDto {
  @IsString()
  @IsNotEmpty()
  message_id: string;

  @IsString()
  @IsNotEmpty()
  room_id: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  from_language: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  to_language: string;
}
