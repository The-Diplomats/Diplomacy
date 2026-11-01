import { type ErrorRequestHandler } from 'express';
import { error } from 'express-openapi-validator';

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
    res.status(httpErr.status).json({
      title: httpErr.name,
      detail: httpErr.message,
      status: httpErr.status,
    });
    return;
  }
  next(err);
};
