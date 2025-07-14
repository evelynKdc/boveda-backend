// src/vault/vault.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vault } from './entities/vault.schema';

@Injectable()
export class VaultService {
  constructor(@InjectModel(Vault.name) private vaultModel: Model<Vault>) {}

  async findByUserId(userId: string): Promise<Vault | null> {
    return this.vaultModel.findOne({ userId }).exec();
  }

  async update(userId: string, encryptedData: string): Promise<Vault> {
    return this.vaultModel.findOneAndUpdate(
      { userId },
      { encryptedData },
      { upsert: true, new: true }, // upsert: si no existe, lo crea
    ).exec();
  }
}

