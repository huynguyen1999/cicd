import { IsNotEmpty, IsString } from 'class-validator';

export class InviteUserToRoomDto {
  @IsString()
  @IsNotEmpty()
  room_id: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;
}
