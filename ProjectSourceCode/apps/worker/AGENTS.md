# AGENTS.md — apps/worker

BullMQ job consumer. Processes phase resolution + AI turns + future scheduled jobs. Emits Socket.IO events cross-process
via `@socket.io/redis-emitter`. Read `ProjectSourceCode/AGENTS.md` for monorepo rules first; this file is
worker-specific.

## Directory layout

```
src/
├── index.ts                # bootstrap: load env, start workers, wire emitter
├── worker.ts               # Worker factory (one per queue)
├── emitter.ts              # @socket.io/redis-emitter for cross-process broadcast
├── ai/                     # AI mode setup (mock/live/disabled), daily token budget, ai:smoke script
├── handlers/               # one file per job type (resolvePhase, aiTakeTurn, etc.)
└── log.ts                  # pino logger
```

## Queues + payloads

- **Queue definitions live in `@diplomacy/queues`** (`packages/queues/`), not in worker or backend. Both producer
  (backend) and consumer (worker) import the same typed queue name + job payload interface so renames break the
  compiler, not prod.
- **Register new queues in `packages/queues/src/index.ts`** with a `QUEUE_NAMES` constant and a `JobPayload` type union.
  Never spell the queue name as a string literal in app code.
- **Add a handler** at `src/handlers/<job-name>.ts`. Wire it into `src/worker.ts`.

## Job idempotency

Worker jobs **must be safe to run twice** — BullMQ retries on failure, and stalled jobs can replay.

- **Handler-level idempotency** via `SELECT 1 FROM phases WHERE id = $1 AND resolved_at IS NULL FOR UPDATE`. If the
  phase is already resolved, no-op and return success.
- **Short-circuit on duplicate writes**: `SELECT 1 FROM orders WHERE phase_id = $1 AND power = $2 FOR UPDATE` before
  inserting AI orders. Already written → no-op.
- **Scheduler generation**: deadline/grace jobs carry a `scheduler_gen` in the payload. Handler checks
  `phases.scheduler_gen` matches before acting; mismatch → stale job, no-op. See `DESIGN_DOC.md` §10.
- **JobId pattern**: `<job-type>-<game-id>-<scope>-<phase-id>[-gen<N>]`. For one-shot-per-phase jobs (like
  `ai-take-turn`), no `gen` suffix. For reschedulable jobs (deadline, grace), include `gen<N>` so BullMQ dedup doesn't
  swallow re-enqueues while the prior job is still `active`.

## Cross-process events

- **Worker uses `@socket.io/redis-emitter`** (emit-only; no engine state). Backend's `@socket.io/redis-adapter` on the
  real `Server` delivers each emit to sockets in the targeted room.
- **Every emit names its target room.** Don't emit globally.
  - `phase:resolved`, `cd:changed`, `game:ended` → `game:<id>`
  - `message:new` public → `game:<id>`
  - `message:new` DM → `game:<id>:player:<to_player_id>`
- **Pin major versions.** Emitter and adapter must share a major version. Check both when upgrading.
- **No engine state in the worker.** The emitter can't read sockets, join rooms, or inspect clients. If you need those,
  delegate through backend via a job.

## AI turns

See `DESIGN_DOC.md` §11 for the full flow. The LLM client, schemas, prompts and fixtures live in `@diplomacy/ai`
(`packages/ai/AGENTS.md`); the worker owns loading game state, validating, writing and emitting.

- **Use the `llm` from `setupAi()`**, never `createLlmClient` directly. In live mode it is wrapped by the daily token
  budget; going around it removes the cost ceiling.
- **Validate output semantically** with `getLegalMoves()` from `@diplomacy/adjudicator` before any DB write. Up to 3
  attempts for illegal orders, then fall back to §10 phase-default orders (Hold / Disband / auto-disband per phase
  type). `TokenBudgetExceededError` and a disabled `llm` (null) go straight to the fallback.
- **Let `LlmRateLimitError` propagate.** The `ai-turns` worker pauses the queue for the provider's `retry-after` and
  requeues the job without using an attempt.
- **Per-dev key** goes in `apps/worker/.env`, never committed. Cloud envs use `LLM_API_KEY` from GH environment secrets.

## Logging

- **Pino with structured context.** Every log entry includes `job_id`, `game_id`, `phase_id` where applicable.
- **Never log AI prompt output verbatim at `info` level.** Full prompts are `debug` only — they're large and can contain
  player chat that should stay in the game.
- **Don't log `LLM_API_KEY`** or any part of the Authorization header. Nothing redacts it for you; log the model and
  token usage, never the client or its config.

## Scheduling

- **Scheduler service is shared with backend** — the worker calls the same scheduler path humans use to re-arm deadlines
  on ready / un-ready / skip-grace events. One code path, no divergence.
- **On commit after AI order submission**, invoke the scheduler so AI-last-ready triggers grace instead of waiting the
  full deadline.

## Testing

- **Vitest, same as backend.** Jobs tested in isolation by invoking the handler with a payload + mocked services.
- **Mock the LLM via MSW** — `createMockLlmServer` from `@diplomacy/ai/mock`, same fixtures CI uses. Don't call the real
  API in tests.
- **Idempotency tests** are mandatory: invoke the handler twice with the same payload, assert no duplicate writes.

## What not to do

- Don't spell queue names or payload shapes as inline strings/objects — use `@diplomacy/queues` types so backend +
  worker stay in sync.
- Don't skip the `FOR UPDATE` guard in handlers. BullMQ's retry semantics assume you can handle replay.
- Don't emit from the worker without naming a room. Global broadcasts leak private state (DMs to the wrong game, phase
  updates to spectators).
- Don't hold engine state in the worker. The emitter is write-only; reads belong to the backend.
- Don't call a real LLM in CI. `MOCK_AI=true` + MSW fixtures. The `ai-smoke.yml` workflow is the only place that
  exercises a real host, and it's `workflow_dispatch` only.
- Don't persist AI memory except through the typed `ai_memory` writer. Never serve it via any API — see `DESIGN_DOC.md`
  §15 AI memory privacy.
