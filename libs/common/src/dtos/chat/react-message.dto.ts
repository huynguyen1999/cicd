import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ReactionType } from '../../constants';
import { Transform } from 'class-transformer';
import { RpcRequest } from '..';

export class ReactMessageDto  {
  @IsString()
  @IsEnum(ReactionType)
  reaction: ReactionType;

  @IsString()
  @IsNotEmpty()
  message_id: string;

  @IsString()
  @IsNotEmpty()
  room_id: string;
}
