import type { ClientToServerEvents, ServerToClientEvents } from '@diplomacy/contracts';
import { io, type Socket } from 'socket.io-client';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const apiUrl = import.meta.env.VITE_API_URL;
const SOCKET_URL = apiUrl?.startsWith('http') ? apiUrl : undefined;

export function createGameSocket(): GameSocket {
  return io(SOCKET_URL, { transports: ['websocket'], withCredentials: true });
}
