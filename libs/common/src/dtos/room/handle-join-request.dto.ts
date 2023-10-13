import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { JoinRequestStatus } from '../../constants';

export class HandleJoinRequestDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(JoinRequestStatus))
  status: JoinRequestStatus;
}
