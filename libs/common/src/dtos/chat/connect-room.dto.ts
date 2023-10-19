import { IsNotEmpty, IsString } from 'class-validator';

export class ConnectRoomDto {
  @IsString()
  @IsNotEmpty()
  room_id: string;
}
