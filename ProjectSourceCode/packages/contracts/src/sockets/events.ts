export interface ClientToServerEvents {
  'health:ping': () => void;
}

export interface ServerToClientEvents {
  'health:pong': (payload: { timestamp: number }) => void;
}
