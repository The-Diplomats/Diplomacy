import { Router } from 'express';

import { loginRouter } from './login.js';
import { logoutRouter } from './logout.js';
import { meRouter } from './me.js';
import { passwordResetRouter } from './password-reset.js';
import { registerRouter } from './register.js';

export const authRouter = Router();
authRouter.use(meRouter);
authRouter.use(loginRouter);
authRouter.use('/register', registerRouter);
authRouter.use('/password-reset', passwordResetRouter);
authRouter.use(logoutRouter);
