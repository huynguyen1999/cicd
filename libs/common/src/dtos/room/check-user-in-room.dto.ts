import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RpcRequest } from '..';

export class CheckUserInRoomDto  {
  @IsString()
  @IsNotEmpty()
  room_id: string;
}
