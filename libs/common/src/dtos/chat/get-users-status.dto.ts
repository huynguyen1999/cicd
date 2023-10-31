import { IsArray, IsString, MinLength } from 'class-validator';

export class GetUsersStatusDto {
  @IsArray()
  @IsString({ each: true })
  @MinLength(1)
  user_ids: string[];
}
