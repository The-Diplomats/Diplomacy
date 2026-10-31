import connectPgSimple from 'connect-pg-simple';
import session, { type SessionOptions } from 'express-session';

const PgStore = connectPgSimple(session);

export function createSessionMiddleware(connectionString: string, secret: string) {
  const store = new PgStore({
    conString: connectionString,
    createTableIfMissing: true,
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

  return session(options);
}
