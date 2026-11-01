import { Router } from 'express';

import { requireAdmin } from '../../middleware/require-admin.js';

export const adminRouter = Router();

adminRouter.get('/queues', requireAdmin, (_req, res) => {
  res.status(503).end();
});
