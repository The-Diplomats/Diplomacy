import { type NextFunction, type Request, type RequestHandler, type Response } from 'express';

export function surfaceOnly(surface: 'api' | 'admin'): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (req.surface === surface || req.surface === 'dev') {
      next();
    } else {
      next('router');
    }
  };
}
