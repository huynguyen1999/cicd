import { IsNotEmpty, IsString } from 'class-validator';

export class ValidateDto {
  @IsString()
  @IsNotEmpty()
  session_id: string;

  @IsString()
  @IsNotEmpty()
  user_id: string;
}
