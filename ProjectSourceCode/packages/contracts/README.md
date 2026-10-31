# @diplomacy/contracts

OpenAPI 3.1 spec + Kubb-generated typed client + Socket.IO event types.

## Usage

```ts
import { useGetHealth, type HealthStatus } from '@diplomacy/contracts';
import type { ServerToClientEvents, ClientToServerEvents } from '@diplomacy/contracts';
```

## Structure

- `api/public/openapi.yaml`: spec source of truth
- `src/generated/`: Kubb-generated client + hooks + types (gitignored, run `pnpm generate`)
- `src/sockets/events.ts`: hand-written Socket.IO event types

## Workflow

Edit the spec, then `pnpm --filter @diplomacy/contracts run generate`. (The generate step also runs automatically before
`build` and `typecheck`.)
