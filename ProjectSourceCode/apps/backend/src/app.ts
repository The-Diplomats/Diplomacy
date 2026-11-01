import express, { type Express, type RequestHandler } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { logger } from './log.js';
import { authRouter } from './routes/auth/index.js';
import { healthRouter } from './routes/health.js';

interface AppConfig {
  corsMiddleware: RequestHandler;
  sessionMiddleware: RequestHandler;
}

export function createApp(config: AppConfig): Express {
  const app = express();
  app.use(helmet());
  app.use(pinoHttp({ logger }));
  app.use(express.json());

  app.set('trust proxy', 1);

  app.use(config.corsMiddleware);
  app.use(config.sessionMiddleware);

  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);

  return app;
}
