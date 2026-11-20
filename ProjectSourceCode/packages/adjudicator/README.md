# @diplomacy/adjudicator

Pure-function Diplomacy adjudicator. Takes a `BoardState` + `Order[]`, returns a `Resolution`.

## Usage

```ts
import { affectedPowers, initialBoard, resolve } from '@diplomacy/adjudicator';

let board = initialBoard(); // Spring 1901 movement
const { results, nextBoard, winner } = resolve(board, orders);
const mustAct = affectedPowers(nextBoard);
```

`resolve()` adjudicates any phase and returns the next phase that needs decisions:

- `results` is keyed by each order's `unit`. An order gets a result only when the phase can act on it (a unit in that
  province, a dislodged unit, a build site); when several orders name the same unit, only the first is used.
- `nextBoard` follows Spring movement, Spring retreat, Fall movement, Fall retreat, Fall build. A retreat phase is
  skipped when no dislodged unit can retreat, and a build phase when no power has a choice to make. A power left with no
  supply centers has no choice: its units are removed without waiting on its orders.
- `winner` is set when a power holds 18 supply centers once Fall's moves and retreats are done.

Other exports: `retreatOptions`, `affectedPowers` (the powers that must act in a phase), `buildSites`,
`adjustmentDelta`, `mustAdjust`, `supplyCenterCount`, `civilDisorderOrder`, `homeDistance`.

## Rules

The 2000 Avalon Hill rulebook, taking DATC's preferred option wherever DATC leaves a choice.

Movement uses Lucas Kruijswijk's algorithm from "The Math of Adjudication", with these backup rules:

- **Circular movement** succeeds.
- **Convoy paradoxes** use the Szykman rule: the convoyed move fails and has no effect.

Movement orders:

- An order that can't be carried out (non-adjacent move with no possible convoy route, support out of reach, convoy by a
  fleet not at sea) makes the unit hold, with result `void`.
- A fleet moving to a split-coast province without a coast goes to the only reachable coast, or holds if both are
  reachable.
- An army moving to an adjacent province goes by convoy only when a convoy route exists and either the order says
  `viaConvoy` or a fleet of its own power has a legal order to convoy it. Otherwise it moves over land.
- Supports name provinces, not coasts, so DATC 6.B.9 (support for the wrong coast) resolves as a standoff instead of the
  file's expected result.

Retreats: a dislodged unit may retreat to an adjacent, unoccupied location that isn't its attacker's origin (unless the
attacker came by convoy) or a province left empty by a standoff. Units with no retreat, an illegal retreat or no order
are disbanded, and so are units retreating into the same province.

Adjustments: supply centers change hands at the end of Fall. A power builds in unoccupied home centers it still owns, at
most one unit per center and no more than it is owed; fleets on split-coast provinces must name a coast. Unused builds
are waived. A power that orders too few disbands loses the units farthest from its home centers, counting moves for the
unit's type (armies may cross seas as if convoyed), fleets before armies on a tie, then by province name.

Results: `hold` gives `success`; `move` gives `success` or `bounced`; `support` gives `success`, `cut` or `void` (no
matching order); `convoy` gives `success`, `cut` (fleet dislodged) or `void`; `retreat` gives `success`, `disbanded`
(another unit retreated to the same province) or `void`; `build` and `disband` give `success` or `void`.

## Tests

`pnpm --filter @diplomacy/adjudicator run test` (Vitest).

`datc/datc_v2.4_06.txt` is the DATC section 6 suite in jDip's text format (sources and corrections in
`datc/ATTRIBUTIONS.md`). `src/datc/harness.ts` parses it and runs each case; each section has its own test file
(`src/datc/6a-basic-checks.test.ts` through `6j-...`). The file lists a dislodged unit with no retreat as destroyed, so
the harness compares only dislodged units that have a retreat option. Retreat cases don't record where attackers came
from, so the harness rebuilds the movement phase from the recorded orders, resolves it, and checks it reproduces the
stated position before resolving the retreats.
