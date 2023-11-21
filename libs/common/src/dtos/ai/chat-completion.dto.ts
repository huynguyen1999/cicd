import { IsNotEmpty, IsString } from 'class-validator';

export class ChatCompletionDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;
}
