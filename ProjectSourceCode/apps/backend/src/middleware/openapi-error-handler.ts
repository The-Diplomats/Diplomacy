import { type ErrorRequestHandler } from 'express';
import { error } from 'express-openapi-validator';

import { logger } from '../log.js';

const openApiErrorClasses = [
  error.BadRequest,
  error.NotFound,
  error.MethodNotAllowed,
  error.Unauthorized,
  error.Forbidden,
  error.InternalServerError,
  error.UnsupportedMediaType,
  error.RequestEntityTooLarge,
] as const;

export const openApiErrorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (openApiErrorClasses.some((cls) => err instanceof cls)) {
    const httpErr = err as InstanceType<(typeof openApiErrorClasses)[number]>;
    if (httpErr.headers) {
      for (const [key, value] of Object.entries(httpErr.headers)) {
        if (typeof value === 'string') res.setHeader(key, value);
      }
    }
    if (httpErr.status >= 500) {
      logger.error({ err: httpErr }, 'openapi response validation error');
      res.status(httpErr.status).json({
        title: httpErr.name,
        status: httpErr.status,
      });
      return;
    }
    res.status(httpErr.status).json({
      title: httpErr.name,
      detail: httpErr.message,
      status: httpErr.status,
    });
    return;
  }
  next(err);
};
