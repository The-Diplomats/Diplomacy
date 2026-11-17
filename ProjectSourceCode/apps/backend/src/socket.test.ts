import { createServer } from 'node:http';
import { type AddressInfo } from 'node:net';

import { type RequestHandler } from 'express';
import { io as ioClient, type Socket as ClientSocket } from 'socket.io-client';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { initAccess, OPEN_ACCESS } from './services/access.js';
import { createSocketServer } from './socket.js';

describe('Socket.IO health handler', () => {
  const stubSession: RequestHandler = (_req, _res, next) => next();

  let httpServer: ReturnType<typeof createServer>;
  let socketServer: ReturnType<typeof createSocketServer>;
  let url: string;

  beforeAll(async () => {
    httpServer = createServer();
    socketServer = createSocketServer(httpServer, {
      sessionMiddleware: stubSession,
      origins: ['*'],
    });
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const address = httpServer.address() as AddressInfo;
    url = `http://localhost:${address.port}`;
  });

  afterAll(async () => {
    await socketServer.close();
  });

  test('responds to health:ping with a timestamped health:pong', async () => {
    const client: ClientSocket = ioClient(url, { transports: ['websocket'] });

    try {
      const pong = await new Promise<{ timestamp: number }>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('timed out waiting for pong')), 2000);
        client.on('health:pong', (payload) => {
          clearTimeout(timeout);
          resolve(payload);
        });
        client.on('connect', () => client.emit('health:ping'));
      });

      expect(typeof pong.timestamp).toBe('number');
      expect(pong.timestamp).toBeGreaterThan(0);
    } finally {
      client.disconnect();
    }
  });

  test('rejects WS upgrade from admin host', async () => {
    const client: ClientSocket = ioClient(url, {
      transports: ['websocket'],
      extraHeaders: { host: 'admin.dev.diplomacy.gg' },
    });

    try {
      const error = await new Promise<Error>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('expected connect_error, got nothing')),
          2000,
        );
        client.on('connect_error', (err) => {
          clearTimeout(timeout);
          resolve(err);
        });
        client.on('connect', () => {
          clearTimeout(timeout);
          reject(new Error('expected connect to fail, but it succeeded'));
        });
      });

      expect(error).toBeInstanceOf(Error);
    } finally {
      client.disconnect();
    }
  });
});

describe('Socket.IO in maintenance mode', () => {
  let sessionLookups = 0;
  const countingSession: RequestHandler = (_req, _res, next) => {
    sessionLookups += 1;
    next();
  };

  let httpServer: ReturnType<typeof createServer>;
  let socketServer: ReturnType<typeof createSocketServer>;
  let url: string;

  beforeAll(async () => {
    initAccess({ ...OPEN_ACCESS, maintenanceMode: true });
    httpServer = createServer();
    socketServer = createSocketServer(httpServer, {
      sessionMiddleware: countingSession,
      origins: ['*'],
    });
    await new Promise<void>((resolve) => httpServer.listen(0, resolve));
    const address = httpServer.address() as AddressInfo;
    url = `http://localhost:${address.port}`;
  });

  afterAll(async () => {
    initAccess(OPEN_ACCESS);
    await socketServer.close();
  });

  test('refuses the handshake without loading the session', async () => {
    const client: ClientSocket = ioClient(url, { transports: ['websocket'], reconnection: false });

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error('expected connect_error, got nothing')),
          2000,
        );
        client.on('connect_error', () => {
          clearTimeout(timeout);
          resolve();
        });
        client.on('connect', () => {
          clearTimeout(timeout);
          reject(new Error('expected connect to fail, but it succeeded'));
        });
      });

      expect(sessionLookups).toBe(0);
    } finally {
      client.disconnect();
    }
  });
});
