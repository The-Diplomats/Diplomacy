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
  const secrets = SECRET_QUERY_PARAMS.filter((name) => req.query?.[name] !== undefined);
  if (secrets.length === 0) {
    return req;
  }
  const query = { ...req.query };
  for (const name of secrets) {
    query[name] = REDACTED;
  }
  let url = req.url;
  if (url) {
    const parsed = new URL(url, 'http://redact.invalid');
    for (const name of secrets) {
      parsed.searchParams.set(name, REDACTED);
    }
    url = parsed.pathname + parsed.search;
  }
  return { ...req, url, query };
}
