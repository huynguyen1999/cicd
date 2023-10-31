import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RpcRequest } from '..';
export class JoinRoomDto  {
  @IsString()
  @IsNotEmpty()
  room_id: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  introduction?: string;
}
