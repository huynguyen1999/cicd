import { IsNotEmpty, IsString } from 'class-validator';

export class SpeechToTextDto {
  @IsString()
  @IsNotEmpty()
  file_path: string;
}
