import { type Request, type Response, Router } from 'express';

export const meRouter = Router();

meRouter.get('/me', (req: Request, res: Response) => {
  const user = req.session.user;
  if (!user) {
    return res.status(401).json({ title: 'Not authenticated' });
  }
  res.json({ user });
});
