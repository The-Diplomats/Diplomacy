import type { Message } from '../generated/index.js';

export interface ClientToServerEvents {
  'health:ping': () => void;
  'game:join': (payload: { gameId: string }, ack: (result: { ok: boolean }) => void) => void;
}

export interface ServerToClientEvents {
  'health:pong': (payload: { timestamp: number }) => void;
  'health:tick': (payload: { at: number }) => void;
  'message:dm': (message: Message) => void;
  'message:new': (message: Message) => void;
}
