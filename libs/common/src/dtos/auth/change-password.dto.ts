import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';
import { RpcRequest } from '..';

export class ChangePasswordDto  {
  @IsString()
  @IsNotEmpty()
  password_confirm: string;

  @IsString()
  @IsNotEmpty()
  new_password: string;

  @IsString()
  @IsNotEmpty()
  current_password: string;
}
