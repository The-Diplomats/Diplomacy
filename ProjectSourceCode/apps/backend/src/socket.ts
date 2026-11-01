import { type Server as HttpServer } from 'node:http';

import { type ClientToServerEvents, type ServerToClientEvents } from '@diplomacy/contracts';
import { createAdapter } from '@socket.io/redis-adapter';
import { type RequestHandler } from 'express';
import Redis from 'ioredis';
import { Server } from 'socket.io';

import { logger } from './log.js';
import { registerHealthSocketHandlers } from './sockets/health.js';

export type DiplomacySocketServer = Server<ClientToServerEvents, ServerToClientEvents>;

interface SocketServerOptions {
  sessionMiddleware: RequestHandler;
  origins: string[];
  redisUrl?: string;
}

export function createSocketServer(
  httpServer: HttpServer,
  options: SocketServerOptions,
): { io: DiplomacySocketServer; close: () => Promise<void> } {
  const io: DiplomacySocketServer = new Server(httpServer, {
    cors: {
      origin: options.origins,
      credentials: true,
    },
  });

  // Share the express-session into the WS handshake so socket.request.session mirrors req.session.
  io.engine.use(options.sessionMiddleware);

  let disconnectRedis: () => void = () => {};

  if (options.redisUrl) {
    const pubClient = new Redis(options.redisUrl);
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => logger.error({ err }, 'socket.io redis pub error'));
    subClient.on('error', (err) => logger.error({ err }, 'socket.io redis sub error'));

    io.adapter(createAdapter(pubClient, subClient));
    logger.info('socket.io using redis adapter');

    disconnectRedis = () => {
      pubClient.disconnect();
      subClient.disconnect();
    };
  } else {
    logger.warn(
      'socket.io REDIS_URL not set: using in-memory adapter (single-replica broadcast only)',
    );
  }

  registerHealthSocketHandlers(io);

  const close = async () => {
    await new Promise<void>((resolve) => io.close(() => resolve()));
    disconnectRedis();
  };

  return { io, close };
}
