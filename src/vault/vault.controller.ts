// src/vault/vault.controller.ts
import { Controller, Get, Put, UseGuards, Request, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VaultService } from './vault.service';
import { UpdateVaultDto } from './dto/update-vault.dto';

@UseGuards(JwtAuthGuard) // Protege todas las rutas de este controlador
@Controller('vault')
export class VaultController {
    constructor(private vaultService: VaultService) { }

    @Get()
    async getVault(@Request() req) {
        const userId = req.user.userId;

        // CAMBIO 3: Usamos la nueva función y manejamos el caso nulo.
        const vault = await this.vaultService.findByUserId(userId);

        if (!vault) {
            // Si no hay bóveda, devolvemos un objeto vacío por defecto.
            // No se guarda nada en la base de datos.
            return { encryptedData: '' };
        }

        return { encryptedData: vault.encryptedData };
    }
    @Put()
    async updateVault(@Request() req, @Body() updateVaultDto: UpdateVaultDto) {
        const updatedVault = await this.vaultService.update(
            req.user.userId,
            updateVaultDto.encryptedData
        );
        return { message: 'Bóveda actualizada con éxito' };
    }
}