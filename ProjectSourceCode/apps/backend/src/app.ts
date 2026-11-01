import express, { type Express, type RequestHandler } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { logger } from './log.js';
import { surfaceGuard } from './middleware/surface-guard.js';
import { surfaceRouter } from './middleware/surface-router.js';
import { adminRouter } from './routes/admin/index.js';
import { authRouter } from './routes/auth/index.js';
import { healthRouter } from './routes/health.js';

interface AppConfig {
  corsMiddleware: RequestHandler;
  sessionMiddleware: RequestHandler;
}

export function createApp(config: AppConfig): Express {
  const app = express();

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(pinoHttp({ logger }));
  app.use(express.json());

  app.use(surfaceRouter);
  app.use(config.corsMiddleware);
  app.use(config.sessionMiddleware);

  app.use('/', surfaceGuard('admin'), adminRouter);
  app.use('/', surfaceGuard('api'), healthRouter);
  app.use('/auth', surfaceGuard('api'), authRouter);

  return app;
}
