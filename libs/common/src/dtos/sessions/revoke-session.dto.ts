import { IsNotEmpty, IsString } from 'class-validator';

export class RevokeSessionDto {
  @IsString()
  @IsNotEmpty()
  session_id: string;
}
