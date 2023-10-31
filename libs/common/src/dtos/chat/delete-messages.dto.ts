import { IsNotEmpty, IsString } from 'class-validator';
import { RpcRequest } from '..';

export class DeleteMessagesDto  {
  @IsString()
  @IsNotEmpty()
  room_id: string;

  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  message_ids: string[];
}
