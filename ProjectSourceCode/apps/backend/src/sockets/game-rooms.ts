import { logger } from '../log.js';
import { db } from '../services/db.js';
import { type DiplomacySocketServer } from '../socket.js';
import { reloadSession, type SessionRequest } from './session-rooms.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function gameRoom(gameId: string): string {
  return `game:${gameId}`;
}

export function registerGameRoomHandlers(io: DiplomacySocketServer): void {
  io.on('connection', (socket) => {
    socket.on('game:join', async (payload, ack) => {
      if (typeof ack !== 'function') {
        return;
      }

      const { session } = socket.request as typeof socket.request & SessionRequest;
      const gameId = payload?.gameId;
      if (!session?.user || typeof gameId !== 'string' || !UUID_PATTERN.test(gameId)) {
        ack({ ok: false });
        return;
      }

      try {
        const user = (await reloadSession(session)) ? session.user : undefined;
        if (!user) {
          ack({ ok: false });
          return;
        }
        const player = await db.players.findByUserInGame({ gameId, userId: user.id });
        if (!player) {
          ack({ ok: false });
          return;
        }
        await socket.join(gameRoom(gameId));
        ack({ ok: true });
      } catch (err) {
        logger.error({ err, gameId }, 'game:join failed');
        ack({ ok: false });
      }
    });
  });
}
