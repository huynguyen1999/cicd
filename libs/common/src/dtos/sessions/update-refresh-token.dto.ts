import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { RefreshTokenStatus } from '../../constants';

export class UpdateRefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refresh_token: string;

  @IsEnum(RefreshTokenStatus)
  status: RefreshTokenStatus;
}
