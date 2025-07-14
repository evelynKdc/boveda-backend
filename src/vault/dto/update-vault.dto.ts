// src/vault/dto/update-vault.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateVaultDto {
    @IsString()
    @IsNotEmpty()
    encryptedData: string;
}