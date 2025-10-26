// src/zkp/zkp.module.ts
import { Module } from '@nestjs/common';
import { ZkpService } from './zkp.service';
import {
  CHALLENGE_STORE,

} from './challenge.store';
import { RedisChallengeStore } from './redis.challenge.store';
@Module({
  providers: [ZkpService,
    RedisChallengeStore,
    {
      provide: CHALLENGE_STORE,
      useClass: RedisChallengeStore,
    },],
  exports: [ZkpService],
})
export class ZkpModule { }