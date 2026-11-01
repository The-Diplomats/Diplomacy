import { openApiSpec } from '@diplomacy/contracts';
import { type RequestHandler } from 'express';
import { middleware as createOpenApiMiddleware } from 'express-openapi-validator';

export function createOpenApiValidator(options: { validateResponses: boolean }): RequestHandler[] {
  return createOpenApiMiddleware({
    // Library's apiSpec type wraps Document in DeepImmutableObject.
    // Bridge at this single boundary with `as never`.
    apiSpec: openApiSpec as never,
    validateRequests: true,
    validateResponses: options.validateResponses,
  });
}
