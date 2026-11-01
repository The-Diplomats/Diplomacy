import { type DiplomacySocketServer } from '../socket.js';

export function registerHealthSocketHandlers(io: DiplomacySocketServer): void {
  io.on('connection', (socket) => {
    socket.on('health:ping', () => {
      socket.emit('health:pong', { timestamp: Date.now() });
    });
  });
}
