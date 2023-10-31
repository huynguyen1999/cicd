import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.schema';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { RefreshTokenStatus } from '@app/common';

@Schema({ versionKey: false, collection: 'refresh_tokens' })
export class RefreshToken extends AbstractDocument {
  @Prop({ type: String, unique: true, index: true })
  token: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true })
  user: Types.ObjectId;

  @Prop({
    type: [{ type: String, ref: 'Session', refPath: 'session_id' }],
  })
  sessions: string[];

  @Prop({ type: String, enum: RefreshTokenStatus, index: true })
  status: RefreshTokenStatus;

  @Prop({ type: Date, default: Date.now, index: true })
  created_at?: Date;

  @Prop({ type: Date, index: true })
  expired_at: Date;
}

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;
export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
RefreshTokenSchema.plugin(require('mongoose-paginate-v2'));
