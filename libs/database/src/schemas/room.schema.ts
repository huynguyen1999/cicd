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
  created_at?: Date;
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
  })
  participants: Types.ObjectId[]; // List of users who are part of the room

  @Prop({
    type: [{ type: mongoose.Schema.Types.Mixed }],
    default: [],
    select: false,
  })
  join_requests?: JoinRequest[];

  @Prop({ type: Date, default: Date.now })
  created_at?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    select: false,
    default: null,
  })
  created_by: Types.ObjectId; // User who created the room
}

export type RoomDocument = HydratedDocument<Room>;
export const RoomSchema = SchemaFactory.createForClass(Room);
