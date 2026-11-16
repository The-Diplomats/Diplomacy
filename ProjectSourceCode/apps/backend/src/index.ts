import { createServer } from 'node:http';

import { createDbClient } from '@diplomacy/db';
import cors from 'cors';

import { createApp } from './app.js';
import { VERIFICATION_CODE_TTL_MINUTES } from './auth/verification-code.js';
import { logger } from './log.js';
import { openApiErrorHandler } from './middleware/openapi-error-handler.js';
import { createOpenApiValidator } from './middleware/openapi-validator.js';
import { createSessionMiddleware } from './middleware/session.js';
import { initDb, shutdownDb } from './services/db.js';
import { initEmails } from './services/emails.js';
import { initOAuth, type OAuthConfig } from './services/oauth.js';
import { createSocketServer } from './socket.js';

const databaseUrl = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;
const frontendOriginsRaw = process.env.FRONTEND_ORIGINS;
const emailFrom = process.env.EMAIL_FROM;
const appUrl = process.env.APP_URL;

if (!databaseUrl?.trim()) {
  logger.error('DATABASE_URL is required');
  process.exit(1);
}
if (!sessionSecret?.trim()) {
  logger.error('SESSION_SECRET is required');
  process.exit(1);
}
if (!frontendOriginsRaw?.trim()) {
  logger.error('FRONTEND_ORIGINS is required (comma-separated list of allowed origins)');
  process.exit(1);
}
if (!emailFrom?.trim()) {
  logger.error('EMAIL_FROM is required');
  process.exit(1);
}
if (!appUrl?.trim()) {
  logger.error('APP_URL is required');
  process.exit(1);
}

function readOAuthCredentials(prefix: 'GOOGLE' | 'MICROSOFT') {
  const clientId = process.env[`${prefix}_CLIENT_ID`]?.trim();
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`]?.trim();
  if (!clientId && !clientSecret) {
    return undefined;
  }
  if (!clientId || !clientSecret) {
    logger.error(`${prefix}_CLIENT_ID and ${prefix}_CLIENT_SECRET must be set together`);
    process.exit(1);
  }
  return { clientId, clientSecret };
}

const googleCredentials = readOAuthCredentials('GOOGLE');
const microsoftCredentials = readOAuthCredentials('MICROSOFT');
const oauthProviders: OAuthConfig['providers'] = {
  ...(googleCredentials && { google: googleCredentials }),
  ...(microsoftCredentials && { microsoft: microsoftCredentials }),
};
const apiPublicUrl = process.env.API_PUBLIC_URL?.trim() ?? '';
if (Object.keys(oauthProviders).length > 0 && !apiPublicUrl) {
  logger.error('API_PUBLIC_URL is required when an OAuth provider is configured');
  process.exit(1);
}

const origins = frontendOriginsRaw
  .split(',')
  .map((o) => o.trim())
  .filter((o) => o.length > 0);

const redisUrl = process.env.REDIS_URL?.trim() || undefined;
const port = Number(process.env.PORT ?? 3001);

const corsMiddleware = cors({ origin: origins, credentials: true });
const openApiValidator = createOpenApiValidator({
  validateResponses: process.env.NODE_ENV !== 'production',
});
const { middleware: sessionMiddleware, pool } = createSessionMiddleware(databaseUrl, sessionSecret);

initDb(createDbClient(databaseUrl));
initEmails(
  {
    resendApiKey: process.env.RESEND_API_KEY?.trim() || undefined,
    from: emailFrom,
    appUrl,
    codeExpiresInMinutes: VERIFICATION_CODE_TTL_MINUTES,
    nodeEnv: process.env.NODE_ENV,
  },
  logger,
);

initOAuth({ providers: oauthProviders, apiPublicUrl, appUrl });
logger.info({ providers: Object.keys(oauthProviders) }, 'oauth providers configured');

const app = createApp({
  corsMiddleware,
  openApiValidator,
  openApiErrorHandler,
  sessionMiddleware,
});
const httpServer = createServer(app);
const socketServer = createSocketServer(httpServer, {
  sessionMiddleware,
  origins,
  redisUrl,
});

httpServer.on('error', (err) => {
  logger.error({ err, port }, 'backend failed to start');
  process.exit(1);
});

httpServer.listen(port, () => {
  logger.info({ port }, 'backend listening');
});

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  logger.info({ signal }, 'backend shutting down');

  const forceExit = setTimeout(() => {
    logger.error('shutdown timeout exceeded, forcing exit');
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  try {
    await socketServer.close();
    await Promise.all([pool.end(), shutdownDb()]);
    clearTimeout(forceExit);
    logger.info('backend shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'backend shutdown error');
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  void shutdown('SIGINT');
});
