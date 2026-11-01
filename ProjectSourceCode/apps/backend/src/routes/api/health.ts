import type { HealthStatus } from '@diplomacy/contracts';
import { type Request, type Response, Router } from 'express';

export const healthRouter = Router();

const startedAt = Date.now();

healthRouter.get('/health', (_req: Request, res: Response<HealthStatus>) => {
  res.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - startedAt) / 1000),
  });
});

healthRouter.head('/health', (_req, res) => {
  res.status(200).end();
});
