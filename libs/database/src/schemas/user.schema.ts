import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.schema';
import mongoose, { HydratedDocument } from 'mongoose';
import { UserRole, UserStatus } from '../../../common/src';

@Schema()
export class UserFaceFeatures {
  @Prop({ type: String })
  path: string;

  @Prop({ type: [Number] })
  values: number[];
}

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
    index: true,
  })
  status?: UserStatus;

  @Prop({ type: Date, default: Date.now })
  last_activity_at?: Date;

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

  @Prop({ type: Object, default: {}, select: false })
  settings?: any;

  @Prop({
    type: String,
    default: UserRole.User,
    enum: Object.values(UserRole),
  })
  role?: UserRole;

  @Prop({ type: Date, default: Date.now, select: false })
  date_of_registration?: Date;

  @Prop({ select: false })
  last_ip_address?: string;

  @Prop({ default: false, select: false })
  two_factor_authentication?: boolean;

  @Prop({ type: [String], default: [], select: false })
  old_passwords?: string[];

  @Prop({ type: Date, default: Date.now, index: true })
  created_at?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    select: false,
    default: null,
  })
  created_by?: User;

  @Prop({
    type: mongoose.Schema.Types.Mixed,
    select: false,
  })
  face_features?: UserFaceFeatures;

  session?: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.plugin(require('mongoose-paginate-v2'));
