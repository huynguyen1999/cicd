import { IsNotEmpty, IsString } from 'class-validator';
import { RpcRequest } from '..';

export class MessagingDto  {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  room_id: string;
}
