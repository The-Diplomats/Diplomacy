import { type NextFunction, type Request, type Response } from 'express';

import { classifySurface, extractForwardedHost } from '../surface.js';

export function surfaceRouter(req: Request, res: Response, next: NextFunction): void {
  const forwardedSurface = classifySurface(extractForwardedHost(req.headers));
  const hostSurface = classifySurface(req.headers.host);
  if (
    req.headers['x-forwarded-host'] &&
    hostSurface !== 'unknown' &&
    hostSurface !== forwardedSurface
  ) {
    res.status(400).end();
    return;
  }
  const surface = forwardedSurface;
  if (surface === 'unknown') {
    res.status(404).end();
    return;
  }
  req.surface = surface;
  next();
}
