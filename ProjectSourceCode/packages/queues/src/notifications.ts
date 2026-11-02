import type { ServerToClientEvents } from '@diplomacy/contracts';
import { type ConnectionOptions, Queue } from 'bullmq';

export const NOTIFICATIONS_QUEUE_NAME = 'notifications';

export interface BroadcastJobData {
  event: keyof ServerToClientEvents;
  payload?: unknown;
}

export function createNotificationsQueue(connection: ConnectionOptions): Queue<BroadcastJobData> {
  return new Queue<BroadcastJobData>(NOTIFICATIONS_QUEUE_NAME, { connection });
}

export async function addBroadcast<K extends keyof ServerToClientEvents>(
  queue: Queue<BroadcastJobData>,
  event: K,
  payload: Parameters<ServerToClientEvents[K]>[0],
) {
  return queue.add('broadcast', { event, payload });
}
