// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Esquema para el objeto ZKP
@Schema({ _id: false })
export class ZkpData {
  @Prop({ required: true })
  publicKeyY: string;

  @Prop({ required: true })
  p: string;

  @Prop({ required: true })
  g: string;
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ type: ZkpData, required: true })
  zkp: ZkpData;
}

export const UserSchema = SchemaFactory.createForClass(User);