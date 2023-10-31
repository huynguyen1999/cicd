import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { RpcRequest } from '..';

export class CreateRoomDto  {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;
}
