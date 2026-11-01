import connectPgSimple from 'connect-pg-simple';
import session, { type SessionOptions } from 'express-session';
import pg from 'pg';

import { logger } from '../log';

const PgStore = connectPgSimple(session);

export function createSessionMiddleware(connectionString: string, secret: string) {
  const pool = new pg.Pool({
    connectionString,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    max: 10,
  });

  pool.on('error', (err) => {
    logger.error({ err }, 'session store pool error');
  });

  const store = new PgStore({
    pool,
    createTableIfMissing: false,
  });

  const options: SessionOptions = {
    store,
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    },
  };

  return {
    middleware: session(options),
    pool,
  };
}
