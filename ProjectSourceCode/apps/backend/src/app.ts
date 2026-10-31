import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { logger } from './log.js';
import { createSessionMiddleware } from './middleware/session.js';
import { authRouter } from './routes/auth/index.js';
import { healthRouter } from './routes/health.js';

interface AppConfig {
  databaseUrl: string;
  sessionSecret: string;
}

export function createApp(config: AppConfig): Express {
  const app = express();
  app.use(helmet());
  app.use(pinoHttp({ logger }));
  app.use(express.json());

  app.use(createSessionMiddleware(config.databaseUrl, config.sessionSecret));

  app.use('/api', healthRouter);
  app.use('/api/auth', authRouter);

  return app;
}
