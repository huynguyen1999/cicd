import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  room_id: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  introduction?: string;
}
