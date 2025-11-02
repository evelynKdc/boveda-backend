import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

@Schema({ timestamps: true })
export class PasswordItem extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  userId: User;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  username: string;

  @Prop({ default: '' })
  url: string; 

  @Prop({ required: true })
  encryptedData: string;
}

export const PasswordItemSchema = SchemaFactory.createForClass(PasswordItem);