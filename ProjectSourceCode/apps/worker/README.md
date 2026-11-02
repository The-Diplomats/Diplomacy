# worker

Diplomacy background job consumer. Listens on the `notifications` BullMQ queue, dispatches jobs to handlers, and
broadcasts socket events via `@socket.io/redis-emitter` to the backend's connected clients.

## Local setup

Before running `pnpm dev`, create a local `.env`:

```sh
cp .env.example .env
# edit REDIS_URL if your Redis isn't at the default
```

The dev script loads `.env` strictly: missing `REDIS_URL` causes startup failure.

### Required env vars

- `REDIS_URL`: BullMQ queue connection + Socket.IO redis-emitter publishing. Both use the same Redis instance.

### Optional env vars

- `LOG_LEVEL` (default info), `NODE_ENV` (default development)

## Scripts

- `pnpm --filter worker dev`: hot-reload dev server (tsx watch)
- `pnpm --filter worker test`: Vitest integration test. Skips if `REDIS_URL` unset.
- `pnpm --filter worker... build`: compile worker + its workspace deps in dep order
- `pnpm --filter worker start`: run compiled dist/index.js

## Queues

Consumes jobs from the `notifications` queue defined in `@diplomacy/queues`.

### Job types

- `broadcast`: emits a typed Socket.IO event to all connected clients via `@socket.io/redis-emitter`. Event name and
  payload are typed against `ServerToClientEvents` from `@diplomacy/contracts`.

## Adding a new broadcast event

When a producer just needs to tell connected clients "this happened," reuse the existing `broadcast` job type and add
the new event name to the contract. No handler changes needed.

Example: `chat:received` to notify a game's players when a chat message arrives.

1. In `packages/contracts/src/sockets/events.ts`, add the event to `ServerToClientEvents`:

   ```ts
   export interface ServerToClientEvents {
     'health:pong': (payload: { timestamp: number }) => void;
     'health:tick': (payload: { at: number }) => void;
     'chat:received': (payload: { gameId: string; from: string; text: string }) => void;
   }
   ```

2. Rebuild contracts so the type reaches consumers:

   ```sh
   pnpm --filter @diplomacy/contracts build
   ```

3. From the producer (e.g., backend chat handler), call `addBroadcast` with the typed event + payload:

   ```ts
   import { addBroadcast } from '@diplomacy/queues';
   await addBroadcast(queue, 'chat:received', { gameId, from, text });
   ```

   TypeScript narrows the payload shape to match the event's declared parameter type. Wrong event name or payload shape
   fails at compile time.

The existing `broadcast` handler receives the job, calls `emitter.emit(event, payload)`, and connected clients see the
typed event via Socket.IO.

## Adding a new job type (not just a broadcast)

When a job needs to do work beyond broadcasting (DB writes, state transitions, external calls, chained enqueues), add a
new job type with its own handler.

Example: `phase:resolve` runs the adjudicator, writes the resolved state to Postgres, then broadcasts.

1. In `@diplomacy/queues`, define the payload and an `addPhaseResolve` helper:

   ```ts
   // packages/queues/src/notifications.ts (or a new file if phase jobs grow)
   export interface PhaseResolvePayload {
     gameId: string;
     phaseId: string;
   }

   export async function addPhaseResolve(queue: Queue, data: PhaseResolvePayload) {
     return queue.add('phase:resolve', data);
   }
   ```

2. Create a handler at `src/handlers/phase-resolve.ts` as a factory that takes its own dependencies (adjudicator
   function, DB client, emitter, etc.):

   ```ts
   export function createPhaseResolveHandler(deps: { emitter: DiplomacyEmitter; db: DbClient }) {
     return async function handlePhaseResolve(job: Job<PhaseResolvePayload>) {
       const result = adjudicator.resolve(await deps.db.loadPhase(job.data.phaseId));
       await deps.db.savePhase(result);
       deps.emitter.to(`game:${job.data.gameId}`).emit('phase:resolved', { ... });
     };
   }
   ```

3. Wire the handler in `src/worker.ts`'s dispatch under a new case:

   ```ts
   if (job.name === 'phase:resolve') {
     return options.handlePhaseResolve(job as Job<PhaseResolvePayload>);
   }
   ```

4. Instantiate in `src/index.ts` with its dependencies and pass to `createWorker`.

5. Add integration test coverage at `src/handlers/phase-resolve.test.ts` using the same real-Redis pattern as
   `broadcast.test.ts`.

Pick the broadcast approach whenever possible: it's cheaper and keeps the queue's job-type surface small. Reach for a
new job type when the work isn't just an emit.

## Redis connections

The worker opens two separate Redis connections to the same instance:

- **BullMQ connection**: `maxRetriesPerRequest: null` per BullMQ's documented requirement so connection-level failures
  surface for reconnection.
- **Emitter connection**: standard ioredis defaults; publishes socket events via Redis pub/sub.

The Socket.IO server (backend process) listens to the same Redis via its Redis adapter, so emitter publishes reach
connected clients across processes.
