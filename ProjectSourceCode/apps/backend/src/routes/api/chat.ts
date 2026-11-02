import { Router } from 'express';

export const chatRouter = Router();

chatRouter.get('/', (_req, res) => {
  res.send('Did this thing work');
});
