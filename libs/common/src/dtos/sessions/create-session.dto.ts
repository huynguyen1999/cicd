import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSessionDto {
  @IsNumber()
  @Min(60000) // 1 minute
  @Max(86400000) // 1 day
  duration: number = 86400000; // in milliseconds, default one day

  @IsOptional()
  @IsString()
  user_agent?: string;

  @IsOptional()
  @IsString()
  ip_address?: string;
}
