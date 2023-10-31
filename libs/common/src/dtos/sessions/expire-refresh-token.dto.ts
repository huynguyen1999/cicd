import { IsNotEmpty, IsString } from 'class-validator';

export class ExpireRefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
