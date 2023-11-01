import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MessagingDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  message_id?: string;

  @IsString()
  @IsNotEmpty()
  room_id: string;
}
