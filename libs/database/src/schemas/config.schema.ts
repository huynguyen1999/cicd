import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { AbstractDocument } from '../abstract.schema';
import mongoose, { HydratedDocument } from 'mongoose';
import { User } from './user.schema';

@Schema({ versionKey: false })
export class Config extends AbstractDocument {}

export type ConfigDocument = HydratedDocument<Config>;
export const ConfigSchema = SchemaFactory.createForClass(Config);
