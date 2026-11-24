import type { Session, SessionData } from 'express-session';

import type { DiplomacySocketServer } from '../socket.js';

export type SessionRequest = { session?: Session & Partial<SessionData> };

export function sessionRoom(sessionId: string): string {
  return `session:${sessionId}`;
}

export function registerSessionRoomHandlers(io: DiplomacySocketServer): void {
  io.use((socket, next) => {
    const { session } = socket.request as typeof socket.request & SessionRequest;
    if (!session?.user) {
      next();
      return;
    }
    session.reload((err) => {
      next(err ? new Error('session expired') : undefined);
    });
  });
  io.on('connection', (socket) => {
    const { session } = socket.request as typeof socket.request & SessionRequest;
    if (session?.user) {
      void socket.join(sessionRoom(session.id));
    }
  });
}

export function reloadSession(session: Session): Promise<boolean> {
  return new Promise((resolve) => {
    session.reload((err) => resolve(!err));
  });
}
