# @diplomacy/adjudicator

Pure-function Diplomacy adjudicator. Takes a `BoardState` + `Order[]`, returns a `Resolution`.

## Usage

```ts
import { resolve, retreatOptions, type Resolution } from '@diplomacy/adjudicator';

const { results, nextBoard } = resolve(board, orders);
const options = nextBoard.dislodged.map((dislodged) => retreatOptions(nextBoard, dislodged));
```

`resolve()` adjudicates movement phases: `results` has one entry per submitted order, keyed by its `unit`, and
`nextBoard` is the retreat-phase board with dislodged units and standoffs. Retreat and build phases throw
`NotImplemented`.

## Rules

Movement follows the 2000 Avalon Hill rulebook, taking DATC's preferred option wherever DATC leaves a choice. Resolution
uses Lucas Kruijswijk's algorithm from "The Math of Adjudication", with these backup rules:

- **Circular movement** succeeds.
- **Convoy paradoxes** use the Szykman rule: the convoyed move fails and has no effect.

Order handling:

- An order that can't be carried out (non-adjacent move with no possible convoy route, support out of reach, convoy by a
  fleet not at sea) makes the unit hold, with result `void`.
- A fleet moving to a split-coast province without a coast goes to the only reachable coast, or holds if both are
  reachable.
- An army moving to an adjacent province goes by convoy only when a convoy route exists and either the order says
  `viaConvoy` or a fleet of its own power has a legal order to convoy it. Otherwise it moves over land.
- Supports name provinces, not coasts, so DATC 6.B.9 (support for the wrong coast) resolves as a standoff instead of the
  file's expected result.

Results: `hold` gives `success`; `move` gives `success` or `bounced`; `support` gives `success`, `cut` or `void` (no
matching order); `convoy` gives `success`, `cut` (fleet dislodged) or `void`.

## Tests

`pnpm --filter @diplomacy/adjudicator run test` (Vitest).

`datc/datc_v2.4_06.txt` is the DATC section 6 suite in jDip's text format (sources in `datc/ATTRIBUTIONS.md`).
`src/datc/harness.ts` parses it and runs each case; each section has its own test file
(`src/datc/6a-basic-checks.test.ts` through `6g-...`). The file lists a dislodged unit with no retreat as destroyed, so
the harness compares only dislodged units that have a retreat option.
