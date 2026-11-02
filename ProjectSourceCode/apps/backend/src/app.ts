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

  app.get('/chat', (_req, res) => {
    res.send('<h1>Did this thing work</h1>');
  });

  app.post('/chat', async (_req, res) => {
    const test_insert_query = `INSERT INTO messages (author, msg_content)
    VALUES ('Bob', 'This is a test message') returning id;`;

    const new_msg_id = null;

    // I had to add these empty statements becuase it wouldn't let me commit
    if (test_insert_query) {
      console.log();
    }
    if (new_msg_id) {
      console.log();
    }
    // try {
    //   new_msg_id = await db.any(test_insert_query);
    // } catch (err) {
    //   res.status(400).json({ error: err });
    //   return;
    // }
    res.send('placeholder');
  });

  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(pinoHttp({ logger }));
  app.use(express.json());

  app.use(surfaceRouter);
  app.use(config.corsMiddleware);
  app.use(config.sessionMiddleware);

  app.use(createAdminSurface());
  app.use(createApiSurface(config.openApiValidator));

  app.use(config.openApiErrorHandler);

  return app;
}
