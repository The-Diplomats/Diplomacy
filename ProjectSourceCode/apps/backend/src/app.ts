import express, { type ErrorRequestHandler, type Express, type RequestHandler } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { logger } from './log.js';
import { surfaceRouter } from './middleware/surface-router.js';
import { createAdminSurface } from './routes/admin/index.js';
import { createApiSurface } from './routes/api/index.js';

interface AppConfig {
  corsMiddleware: RequestHandler;
  openApiValidator: RequestHandler[];
  openApiErrorHandler: ErrorRequestHandler;
  sessionMiddleware: RequestHandler;
}

export function createApp(config: AppConfig): Express {
  const app = express();

  app.set('trust proxy', 1);

  app.use(surfaceRouter);
  app.use(helmet());
  app.use(pinoHttp({ logger }));
  app.use(express.json());
  app.use(config.corsMiddleware);
  app.use(config.sessionMiddleware);

  app.use(createApiSurface(config.openApiValidator));
  app.use(createAdminSurface());

  app.use(config.openApiErrorHandler);

  return app;
}
