import { IsNotEmpty, IsString } from 'class-validator';

export class MessagingDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  room_id: string;
}
