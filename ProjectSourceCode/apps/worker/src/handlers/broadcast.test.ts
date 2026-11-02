import { createServer, type Server as HttpServer } from 'node:http';
import { type AddressInfo } from 'node:net';

import type { ClientToServerEvents, ServerToClientEvents } from '@diplomacy/contracts';
import { addBroadcast, createNotificationsQueue } from '@diplomacy/queues';
import { createAdapter } from '@socket.io/redis-adapter';
import { type Queue, type Worker } from 'bullmq';
import Redis from 'ioredis';
import { Server as SocketServer } from 'socket.io';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { createEmitter } from '../emitter.js';
import { createWorker } from '../worker.js';
import { createBroadcastHandler } from './broadcast.js';

const redisUrl = process.env.REDIS_URL;

describe.skipIf(!redisUrl?.trim())('broadcast handler end-to-end', () => {
  let httpServer: HttpServer;
  let socketServer: SocketServer<ClientToServerEvents, ServerToClientEvents>;
  let worker: Worker;
  let queue: Queue;
  let bullmqConnection: Redis;
  let emitterConnection: Redis;
  let adapterPub: Redis;
  let adapterSub: Redis;
  let url: string;

  beforeAll(async () => {
    const url_ = redisUrl!;
    bullmqConnection = new Redis(url_, { maxRetriesPerRequest: null });
    emitterConnection = new Redis(url_);
    adapterPub = new Redis(url_);
    adapterSub = adapterPub.duplicate();

    httpServer = createServer();
    socketServer = new SocketServer(httpServer, { transports: ['websocket'] });
    socketServer.adapter(createAdapter(adapterPub, adapterSub));
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const address = httpServer.address() as AddressInfo;
    url = `http://localhost:${address.port}`;

    const emitter = createEmitter(emitterConnection);
    const handleBroadcast = createBroadcastHandler(emitter);
    worker = createWorker({ connection: bullmqConnection, handleBroadcast });
    queue = createNotificationsQueue(bullmqConnection);
  });

  afterAll(async () => {
    await worker.close();
    await queue.close();
    await new Promise<void>((resolve) => socketServer.close(() => resolve()));
    emitterConnection.disconnect();
    bullmqConnection.disconnect();
    adapterPub.disconnect();
    adapterSub.disconnect();
  });

  test('broadcast job reaches connected socket client as typed event', async () => {
    const client: ClientSocket<ServerToClientEvents> = ioClient(url, {
      transports: ['websocket'],
    });

    try {
      const received = await new Promise<{ at: number }>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timed out waiting for event')), 5000);
        client.on('health:tick', (payload) => {
          clearTimeout(timeout);
          resolve(payload);
        });
        client.on('connect', () => {
          void addBroadcast(queue, 'health:tick', { at: Date.now() });
        });
      });

      expect(typeof received.at).toBe('number');
      expect(received.at).toBeGreaterThan(0);
    } finally {
      client.disconnect();
    }
  });
});
