// src/vault/vault.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VaultController } from './vault.controller';
import { VaultService } from './vault.service';
import { Vault, VaultSchema } from './entities/vault.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Vault.name, schema: VaultSchema }]),
  ],
  controllers: [VaultController],
  providers: [VaultService],
})
export class VaultModule {}