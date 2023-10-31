import { IsNotEmpty, IsString } from 'class-validator';
import { RpcRequest } from '..';

export class ConnectRoomDto  {
  @IsString()
  @IsNotEmpty()
  room_id: string;
}
