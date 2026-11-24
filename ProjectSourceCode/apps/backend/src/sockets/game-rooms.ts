import { logger } from '../log.js';
import { db } from '../services/db.js';
import { type DiplomacySocketServer } from '../socket.js';
import { type SessionRequest } from './session-rooms.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function gameRoom(gameId: string): string {
  return `game:${gameId}`;
}

export function playerRoom(playerId: string): string {
  return `player:${playerId}`;
}

export function registerGameRoomHandlers(io: DiplomacySocketServer): void {
  io.on('connection', (socket) => {
    socket.on('game:join', async (payload, ack) => {
      if (typeof ack !== 'function') {
        return;
      }

      const { session } = socket.request as typeof socket.request & SessionRequest;
      const user = session?.user;
      const gameId = payload?.gameId;
      if (!user || typeof gameId !== 'string' || !UUID_PATTERN.test(gameId)) {
        ack({ ok: false });
        return;
      }

      try {
        const player = await db.players.findByUserInGame({ gameId, userId: user.id });
        if (!player) {
          ack({ ok: false });
          return;
        }
        await socket.join([gameRoom(gameId), playerRoom(player.id)]);
        ack({ ok: true });
      } catch (err) {
        logger.error({ err, gameId }, 'game:join failed');
        ack({ ok: false });
      }
    });
  });
}
