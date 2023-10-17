import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CheckUserInRoomDto {
  @IsString()
  @IsNotEmpty()
  room_id: string;
}
