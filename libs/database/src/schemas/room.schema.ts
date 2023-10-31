import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.schema';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { JoinRequestStatus } from '@app/common';

@Schema()
export class JoinRequest {
  @Prop({ type: String })
  id: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }) // User who has seen the message
  user: mongoose.Types.ObjectId;

  @Prop({
    required: true,
    type: String,
    default: JoinRequestStatus.Pending,
    enum: Object.values(JoinRequestStatus),
  })
  status: JoinRequestStatus;

  @Prop({ type: String })
  introduction?: string;

  @Prop({ type: Date, default: Date.now })
  time?: Date;
}

@Schema({ versionKey: false })
export class Room extends AbstractDocument {
  @Prop({ index: true, required: true })
  name: string; // Room name or title

  @Prop({ type: String, default: '' })
  description?: string; // Room description (optional)

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
    index: true,
  })
  participants: Types.ObjectId[]; // List of users who are part of the room

  @Prop({
    type: [{ type: mongoose.Schema.Types.Mixed }],
    default: [],
    select: false,
  })
  join_requests?: JoinRequest[];

  @Prop({ type: Date, default: Date.now, index: true })
  created_at?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    select: false,
    default: null,
    index: true,
  })
  created_by: Types.ObjectId; // User who created the room
}

export type RoomDocument = HydratedDocument<Room>;
export const RoomSchema = SchemaFactory.createForClass(Room);
RoomSchema.plugin(require('mongoose-paginate-v2'));
