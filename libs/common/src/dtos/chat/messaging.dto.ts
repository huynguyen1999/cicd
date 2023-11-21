import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { MessageType } from '../../constants';

export class MessagingDto {
  @IsOptional()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  message_id?: string;

  @IsString()
  @IsNotEmpty()
  room_id: string;

  @IsOptional()
  @IsIn(Object.values(MessageType))
  type?: string = MessageType.Text;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  file_name?: string; // for attachment

  @IsOptional()
  @IsBoolean()
  is_from_bot?: boolean = false;

  @IsOptional()
  @IsBoolean()
  ask_bot?: boolean = false;
}
