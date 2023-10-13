import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.schema';
import mongoose, { HydratedDocument } from 'mongoose';
import { UserRole, UserStatus } from '../../../common/src';
@Schema({ versionKey: false })
export class User extends AbstractDocument {
  @Prop({ required: true, unique: true, index: true })
  email: string;
  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: String })
  full_name?: string;

  @Prop({ type: String })
  profile_picture?: string;

  @Prop({
    type: String,
    default: UserStatus.Offline,
    enum: Object.values(UserStatus),
  })
  status?: UserStatus;

  @Prop({ type: Date, default: Date.now })
  last_seen?: Date;

  @Prop({ type: String })
  bio?: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
  })
  friends_list?: string[];

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: [],
    select: false,
  })
  blocked_users?: string[];

  @Prop({ type: [{ type: Object }], default: [], select: false })
  chat_history?: object[];

  @Prop({ type: Object, default: {}, select: false })
  settings?: object;

  @Prop({ select: false })
  token?: string;

  @Prop({
    default: UserRole.User,
    enum: Object.values(UserRole),
    select: false,
  })
  role?: string;

  @Prop({ type: Date, default: Date.now, select: false })
  date_of_registration?: Date;

  @Prop({ select: false })
  last_ip_address?: string;

  @Prop({ type: Object, select: false })
  device_information?: object;

  @Prop({ default: false, select: false })
  two_factor_authentication?: boolean;

  @Prop({ type: [String], default: [], select: false })
  old_passwords?: string[];

  @Prop({ type: Date, default: Date.now })
  created_at?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    select: false,
    default: null,
  })
  created_by?: User;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
