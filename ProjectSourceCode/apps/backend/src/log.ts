import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: ['req.headers.authorization', 'req.headers.cookie', 'req.headers["set-cookie"]'],
});

const REDACTED = '[Redacted]';

// OAuth authorization codes arrive as `?code=` on the provider callback.
const SECRET_QUERY_PARAMS = ['code'];

interface SerializedRequest {
  url?: string;
  query?: Record<string, unknown>;
}

/**
 * pino-http request serializer that masks secret query params. `redact` paths
 * can cover `req.query.code`, but the same value is embedded in the `req.url`
 * string, which needs rewriting.
 */
export function redactRequestSecrets<T extends SerializedRequest>(req: T): T {
  // Express's query parser stops after 1,000 params, so `req.query` can miss a `code` the URL has.
  const parsedUrl = req.url?.includes('?') ? new URL(req.url, 'http://redact.invalid') : null;
  const secrets = SECRET_QUERY_PARAMS.filter(
    (name) => req.query?.[name] !== undefined || parsedUrl?.searchParams.has(name),
  );
  if (secrets.length === 0) {
    return req;
  }
  let query = req.query;
  if (query) {
    query = { ...query };
    for (const name of secrets) {
      if (query[name] !== undefined) {
        query[name] = REDACTED;
      }
    }
  }
  let url = req.url;
  if (parsedUrl) {
    for (const name of secrets) {
      if (parsedUrl.searchParams.has(name)) {
        parsedUrl.searchParams.set(name, REDACTED);
      }
    }
    url = parsedUrl.pathname + parsedUrl.search;
  }
  return { ...req, url, query };
}
