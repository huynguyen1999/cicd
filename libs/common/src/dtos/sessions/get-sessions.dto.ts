import { IsOptional, IsString } from 'class-validator';

export class GetSessionsDto {
  @IsOptional()
  @IsString({ each: true })
  session_ids?: string[];
}
