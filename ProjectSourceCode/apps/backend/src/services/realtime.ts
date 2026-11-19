import type { Message } from '@diplomacy/contracts';

import type { DiplomacySocketServer } from '../socket.js';
import { gameRoom } from '../sockets/game-rooms.js';

let io: DiplomacySocketServer | undefined;

export function initRealtime(server: DiplomacySocketServer): void {
  io = server;
}

export function broadcastPublicMessage(message: Message): void {
  io?.to(gameRoom(message.gameId)).emit('message:new', message);
}
