import { type NextFunction, type Request, type Response } from 'express';

import { access } from '../services/access.js';

const RETRY_AFTER_SECONDS = 300;

const MAINTENANCE = {
  title: 'Service Unavailable',
  status: 503,
  detail: 'Diplomacy is down for maintenance. Please try again in a few minutes.',
} as const;

// Mounted before the session middleware so a maintenance window that takes the database down
// still answers 503 instead of a session-store 500.
export function maintenanceGate(req: Request, res: Response, next: NextFunction): void {
  if (!access.maintenanceMode || req.surface === 'admin' || req.path === '/health') {
    next();
    return;
  }
  res.set('Retry-After', String(RETRY_AFTER_SECONDS));
  res.status(503).json(MAINTENANCE);
}
