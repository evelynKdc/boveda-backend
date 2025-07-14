// src/vault/schemas/vault.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/users/entities/user.entity';

@Schema({ timestamps: true })
export class Vault extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({ required: true })
  encryptedData: string;
}

export const VaultSchema = SchemaFactory.createForClass(Vault);