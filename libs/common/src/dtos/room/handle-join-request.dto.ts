import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { JoinRequestStatus } from '../../constants';
import { RpcRequest } from '..';

export class HandleJoinRequestDto  {
  @IsString()
  @IsNotEmpty()
  room_id: string;

  @IsString()
  @IsNotEmpty()
  join_request_id: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(Object.values(JoinRequestStatus))
  status: JoinRequestStatus;
}
