import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.schema';
import mongoose, { HydratedDocument } from 'mongoose';
import { UploadType, UploadedFileStatus } from '@app/common';

@Schema({ versionKey: false, collection: 'uploaded_files' })
export class UploadedFile extends AbstractDocument {
  @Prop({ type: String, required: true })
  original_name: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  name: string;

  @Prop({ type: String, required: true, unique: true })
  path: string;

  @Prop({ type: Number, required: true })
  size: number;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  metadata?: any;

  @Prop({ type: Date, default: Date.now, index: true })
  created_at?: Date;

  @Prop({ type: String, enum: UploadType })
  upload_type: UploadType;

  @Prop({
    type: String,
    enum: UploadedFileStatus,
    default: UploadedFileStatus.Active,
  })
  status: UploadedFileStatus;
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    required: true,
  })
  created_by: mongoose.Types.ObjectId;
  @Prop({ type: Boolean, default: false, index: true })
  is_deleted?: boolean;
  @Prop({ type: Date, index: true })
  deleted_at?: Date;
  @Prop({ type: mongoose.Schema.Types.Mixed, default: [] })
  notes?: { time: Date; content: string }[];
}

export type UploadedFileDocument = HydratedDocument<UploadedFile>;
export const UploadedFileSchema = SchemaFactory.createForClass(UploadedFile);
UploadedFileSchema.plugin(require('mongoose-paginate-v2'));
