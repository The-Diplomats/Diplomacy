import { type NextFunction, type Request, type Response } from 'express';

import { classifySurface } from '../surface.js';

export function surfaceRouter(req: Request, res: Response, next: NextFunction): void {
  const surface = classifySurface(req.hostname);
  if (surface === 'unknown') {
    res.status(404).end();
    return;
  }
  req.surface = surface;
  next();
}
