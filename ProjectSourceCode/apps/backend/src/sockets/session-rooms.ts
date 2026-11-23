import type { Session, SessionData } from 'express-session';

import type { DiplomacySocketServer } from '../socket.js';

export type SessionRequest = { session?: Session & Partial<SessionData> };

export function sessionRoom(sessionId: string): string {
  return `session:${sessionId}`;
}

export function registerSessionRoomHandlers(io: DiplomacySocketServer): void {
  io.on('connection', (socket) => {
    const { session } = socket.request as typeof socket.request & SessionRequest;
    if (session?.user) {
      void socket.join(sessionRoom(session.id));
    }
  });
}
