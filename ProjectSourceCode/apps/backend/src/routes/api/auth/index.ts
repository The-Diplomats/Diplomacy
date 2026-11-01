import { Router } from 'express';

import { meRouter } from './me.js';

export const authRouter = Router();

authRouter.use(meRouter);
