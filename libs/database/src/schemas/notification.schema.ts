import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { NotificationStatus } from '@app/common';
import mongoose, { HydratedDocument } from 'mongoose';
import { AbstractDocument } from '../abstract.schema';

@Schema({ versionKey: false })
export class Notification extends AbstractDocument {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
  })
  recipient: mongoose.Types.ObjectId;

  @Prop({ type: String, index: true })
  title: string;

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: Date, default: Date.now, index: true })
  created_at?: Date;

  @Prop({
    type: String,
    enum: NotificationStatus,
    default: NotificationStatus.Unread,
    index: true,
  })
  status: NotificationStatus;

  @Prop({ type: Date, index: true })
  read_at?: Date;
}

export type NotificationDocument = HydratedDocument<Notification>;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
NotificationSchema.plugin(require('mongoose-paginate-v2'));
