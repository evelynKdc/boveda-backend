// src/redis/redis.module.ts
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

// Token de inyección para el cliente
export const REDIS_CLIENT = 'REDIS_CLIENT';

const redisProvider = {
  provide: REDIS_CLIENT,
  // Usamos un factory para crear el cliente
  useFactory: (configService: ConfigService) => {
    const redisUri = configService.get<string>('REDIS_URI');
    if (!redisUri) {
      throw new Error('REDIS_URI no está definida en la configuración');
    }
    // Creamos la instancia singleton
    return new Redis(redisUri);
  },
  // Inyectamos ConfigService para poder leer el .env
  inject: [ConfigService],
};

@Global() // Hacemos el módulo global
@Module({
  imports: [ConfigModule], // Importamos ConfigModule
  providers: [redisProvider],
  exports: [redisProvider], // Exportamos el cliente para que otros módulos lo usen
})
export class RedisModule {}