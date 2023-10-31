import { IsNotEmpty, IsString } from 'class-validator';

export class ExpireSessionDto {
  @IsString()
  @IsNotEmpty()
  session_id: string;
}
