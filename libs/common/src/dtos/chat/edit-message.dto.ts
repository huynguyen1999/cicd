import { IsNotEmpty, IsString } from 'class-validator';
import { RpcRequest } from '..';

export class EditMessageDto  {
  @IsString()
  @IsNotEmpty()
  room_id: string;

  @IsString()
  @IsNotEmpty()
  message_id: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
