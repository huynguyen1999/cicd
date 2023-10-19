import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class SeenMessagesDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  message_ids: string[];

  @IsString()
  @IsNotEmpty()
  room_id: string;
}
