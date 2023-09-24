import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsStrongPassword()
  @IsNotEmpty()
  password_confirm: string;

  @IsString()
  @IsStrongPassword()
  @IsNotEmpty()
  password: string;
}
