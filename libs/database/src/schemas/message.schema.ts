import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.schema';
import mongoose, { HydratedDocument } from 'mongoose';
import { ReactionType } from '@app/common';

@Schema()
export class MessageSeenReceipt {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }) // User who has seen the message
  user: mongoose.Types.ObjectId;

  @Prop({ required: true }) // Timestamp when the user saw the message
  time: Date;
}

@Schema()
export class MessageReactReceipt {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }) // User who has seen the message
  user: mongoose.Types.ObjectId;

  @Prop({ type: String, enum: Object.values(ReactionType), required: true })
  reaction: ReactionType;

  @Prop({ type: Date, required: true })
  time: Date;
}

@Schema()
export class MessageMetadata {}

@Schema()
export class MessageHistory {
  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  time: Date;
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
    index: true,
  })
  sender?: mongoose.Types.ObjectId; // User who sent the message

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true,
  }) // Reference to the room being invited to
  room: mongoose.Types.ObjectId;

  @Prop({
    type: [{ type: mongoose.Schema.Types.Mixed }],
    default: [],
  })
  seen_by?: MessageSeenReceipt[]; // List of users who has seen the message

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    default: {},
  })
  metadata?: MessageMetadata;

  @Prop({
    type: [{ type: mongoose.Schema.Types.Mixed }],
    default: [],
  })
  reacted_by?: MessageReactReceipt[];

  @Prop({ type: Date, default: Date.now, index: true })
  created_at?: Date;

  @Prop({ type: [{ type: mongoose.Schema.Types.Mixed }] })
  history?: MessageHistory[];

  @Prop({ type: Boolean, index: true, default: false })
  is_deleted?: boolean;

  @Prop({ type: Date, index: true })
  deleted_at?: Date;
}

export type MessageDocument = HydratedDocument<Message>;
export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.plugin(require('mongoose-paginate-v2'));
