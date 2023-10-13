import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.schema';
import mongoose, { HydratedDocument } from 'mongoose';
import { ReactionType } from '@app/common';

@Schema()
export class MessageReadReceipt extends AbstractDocument {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }) // User who has seen the message
  user: mongoose.Types.ObjectId;

  @Prop({ required: true }) // Timestamp when the user saw the message
  seen_at: Date;
}

@Schema()
export class MessageReactReceipt extends AbstractDocument {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }) // User who has seen the message
  user: mongoose.Types.ObjectId;

  @Prop({ type: String, enum: Object.values(ReactionType), required: true })
  reaction: ReactionType;

  @Prop({ type: Date, required: true })
  react_at: Date;
}

@Schema({ versionKey: false })
export class Message extends AbstractDocument {
  @Prop({ required: true })
  content: string;

  @Prop({})
  attachment?: string; // Attachment URL (optional)

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  sender: mongoose.Types.ObjectId; // User who sent the message

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true }) // Reference to the room being invited to
  room: mongoose.Types.ObjectId;

  @Prop({
    type: [{ type: mongoose.Schema.Types.Mixed }],
    default: [],
  })
  seen_by?: MessageReadReceipt[]; // List of users who has seen the message

  @Prop({
    type: [{ type: mongoose.Schema.Types.Mixed }],
    default: [],
  })
  react_by?: MessageReactReceipt[];

  @Prop({ type: Date, default: Date.now })
  created_at?: Date;
}

export type MessageDocument = HydratedDocument<Message>;
export const MessageSchema = SchemaFactory.createForClass(Message);
