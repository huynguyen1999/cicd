import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.schema';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { SessionStatus } from '@app/common';

@Schema({ versionKey: false })
export class Session extends AbstractDocument {
  @Prop({ type: String, unique: true, index: true })
  session_id: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true })
  user: Types.ObjectId;

  @Prop({ type: String, enum: SessionStatus, index: true })
  status: SessionStatus;

  @Prop({ type: String })
  ip_address: string;

  @Prop({ type: String })
  user_agent?: string;

  @Prop({ type: String, ref: 'RefreshToken', refPath: 'token', index: true })
  refresh_token?: string;

  @Prop({ type: Date, default: Date.now, index: true })
  created_at?: Date;

  @Prop({ type: Date, index: true })
  expired_at: Date;
}

export type SessionDocument = HydratedDocument<Session>;
export const SessionSchema = SchemaFactory.createForClass(Session);
SessionSchema.plugin(require('mongoose-paginate-v2'));
