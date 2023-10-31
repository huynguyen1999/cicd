import { BadRequestException, Injectable } from '@nestjs/common';
import { TranslateMessageDto } from '@app/common';
import { MessageRepository } from '@app/database';
//@ts-ignore
import * as translate from '@iamtraction/google-translate';

@Injectable()
export class MessageTranslationService {
  constructor(private readonly messageRepository: MessageRepository) {}
  async translateMessage(data: TranslateMessageDto) {
    const message = await this.messageRepository.findOne({
      _id: data.message_id,
      room: data.room_id,
      is_deleted: false,
    });
    if (!message || !message.content) {
      throw new BadRequestException('Message content not found');
    }
    const translation = await translate(message.content, {
      from: data.from_language,
      to: data.to_language,
    });
    return { id: message._id, translation: translation.text };
  }
}
