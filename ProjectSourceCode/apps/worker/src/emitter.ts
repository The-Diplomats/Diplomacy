import type { ServerToClientEvents } from '@diplomacy/contracts';
import { Emitter } from '@socket.io/redis-emitter';
import type Redis from 'ioredis';

export type DiplomacyEmitter = Emitter<ServerToClientEvents>;

export function createEmitter(redis: Redis): DiplomacyEmitter {
  return new Emitter<ServerToClientEvents>(redis);
}
