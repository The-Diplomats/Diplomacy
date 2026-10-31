# @diplomacy/adjudicator

Pure-function Diplomacy adjudicator. Takes a `BoardState` + `Order[]`, returns a `Resolution`.

## Usage

```ts
import { resolve, type Resolution } from '@diplomacy/adjudicator';

const resolution = resolve(board, orders);
```

Currently a scaffold stub that throws `NotImplemented`. Real logic + DATC test suite lands with adjudicator work.

Tests: `pnpm --filter @diplomacy/adjudicator run test` (Vitest).
