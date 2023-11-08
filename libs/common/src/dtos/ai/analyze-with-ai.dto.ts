import { IsOptional, IsString } from 'class-validator';

export class AnalyzeFileWithAiDto {
  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  file_name?: string;
}
