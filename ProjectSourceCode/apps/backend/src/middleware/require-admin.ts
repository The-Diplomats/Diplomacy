import { type NextFunction, type Request, type Response } from 'express';

export const ADMIN_EMAILS: ReadonlySet<string> = new Set([
  'nabl2869@colorado.edu',
  'deven.chen@colorado.edu',
  'brynne.geittmann@colorado.edu',
  'rez.haleem@colorado.edu',
  'jkurtz950@gmail.com',
]);

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const email = req.session.user?.email?.toLowerCase();
  if (!email || !ADMIN_EMAILS.has(email)) {
    res.status(403).json({ title: 'Admin only' });
    return;
  }
  next();
}
