import { Injectable } from '@nestjs/common';

export interface ChallengeData {
  t: bigint;
  c: bigint;
}

export const CHALLENGE_STORE = Symbol('IChallengeStore');

export interface IChallengeStore {
  set(username: string, data: ChallengeData): Promise<void>;
  get(username: string): Promise<ChallengeData | undefined>;
  delete(username: string): Promise<boolean>;
}


@Injectable()
export class InMemoryChallengeStore implements IChallengeStore {
  private store = new Map<string, ChallengeData>();

  async set(username: string, data: ChallengeData): Promise<void> {
    this.store.set(username, data);
    return Promise.resolve();
  }

  async get(username: string): Promise<ChallengeData | undefined> {
    return Promise.resolve(this.store.get(username));
  }

  async delete(username: string): Promise<boolean> {
    return Promise.resolve(this.store.delete(username));
  }
}