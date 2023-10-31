import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RpcRequest } from '..';

export class KickUserFromRoomDto  {
  @IsString()
  @IsNotEmpty()
  room_id: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;
}