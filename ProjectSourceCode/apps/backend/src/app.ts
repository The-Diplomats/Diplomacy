import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { logger } from './log.js';
import { healthRouter } from './routes/health.js';

export function createApp(): Express {
  const app = express();
  app.use(helmet());
  app.use(pinoHttp({ logger }));
  app.use(express.json());

  app.use('/api', healthRouter);

  return app;
}
