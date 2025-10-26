// src/zkp/redis.challenge.store.ts
import { Injectable, Inject } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from 'src/redis/redis.module';
import { ChallengeData, IChallengeStore } from './challenge.store';

@Injectable()
export class RedisChallengeStore implements IChallengeStore {
  private readonly CHALLENGE_TTL_SECONDS = 60;

  constructor(
    // Inyectamos el cliente Redis que provee nuestro RedisModule
    @Inject(REDIS_CLIENT) private readonly redisClient: Redis,
  ) {}

  private getKey(username: string): string {
    // Convención de nomenclatura de claves
    return `challenge:${username}`;
  }

  async set(username: string, data: ChallengeData): Promise<void> {
    const key = this.getKey(username);

    // Problema: Redis no almacena 'bigint'. Debemos serializar.
    // Convertimos los bigints a strings para guardarlos en JSON.
    const dataToStore = {
      t: data.t.toString(),
      c: data.c.toString(),
    };
    const serializedData = JSON.stringify(dataToStore);

    // Guardamos en Redis con 'EX' (expire)
    await this.redisClient.set(
      key,
      serializedData,
      'EX', // 'EX' significa "expire en segundos"
      this.CHALLENGE_TTL_SECONDS,
    );
  }

  async get(username: string): Promise<ChallengeData | undefined> {
    const key = this.getKey(username);
    const serializedData = await this.redisClient.get(key);

    if (!serializedData) {
      return undefined;
    }

    // Deserializamos los datos
    const parsedData = JSON.parse(serializedData);

    // Convertimos los strings de vuelta a bigints
    return {
      t: BigInt(parsedData.t),
      c: BigInt(parsedData.c),
    };
  }

  async delete(username: string): Promise<boolean> {
    const key = this.getKey(username);
    // 'del' devuelve el número de claves que se borraron (0 o 1)
    const result = await this.redisClient.del(key);
    return result > 0;
  }
}