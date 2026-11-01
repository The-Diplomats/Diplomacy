import { type NextFunction, type Request, type RequestHandler, type Response } from 'express';

import { type DiplomacySurface } from '../surface.js';

export function surfaceGuard(
  surface: Exclude<DiplomacySurface, 'dev' | 'unknown'>,
): RequestHandler {
  return function surfaceGuardMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (req.surface === surface || req.surface === 'dev') {
      next();
      return;
    }
    res.status(404).end();
  };
}
