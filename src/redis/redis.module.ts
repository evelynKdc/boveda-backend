
import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

const redisProvider = {
  provide: REDIS_CLIENT,
  useFactory: (configService: ConfigService) => {
    const redisUri = configService.get<string>('REDIS_URI');
    if (!redisUri) {
      throw new Error('REDIS_URI no está definida en la configuración');
    }
    return new Redis(redisUri);
  },
  inject: [ConfigService],
};

@Global() 
@Module({
  imports: [ConfigModule],
  providers: [redisProvider],
  exports: [redisProvider],
})
export class RedisModule {}