import { Router } from 'express';

import { requireAdmin } from '../../middleware/require-admin.js';
import { surfaceOnly } from '../../middleware/surface-only.js';

export function createAdminSurface(): Router {
  const admin = Router();
  admin.use(surfaceOnly('admin'));
  admin.get('/queues', requireAdmin, (_req, res) => {
    res.status(503).end();
  });
  return admin;
}
