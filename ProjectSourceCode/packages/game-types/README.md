# @diplomacy/game-types

Pure TypeScript domain types for Diplomacy, plus the static classic map. No runtime logic, zero runtime dependencies.

## Usage

```ts
import { POWERS, type Power, type BoardState, CLASSIC_PROVINCES } from '@diplomacy/game-types';
```

## Exports

- `POWERS`, `SEASONS`, `PHASE_TYPES`, `UNIT_TYPES`, `PROVINCE_CODES`, `COAST_CODES`, `ORDER_ACTIONS`, `ORDER_RESULTS`:
  const arrays + union types
- `MapLocation`: a province code or a split-coast code (`stp/nc`); where a unit stands
- `Unit`, `DislodgedUnit`, `BoardState`: board snapshot stored per phase
- `Order`: discriminated union on `action`, grouped as `MovementOrder`, `RetreatPhaseOrder` and `BuildPhaseOrder`
- `CLASSIC_PROVINCES`: name, type, supply center and home power per province
- `ARMY_ADJACENCY`, `FLEET_ADJACENCY`: movement graphs; fleets on split-coast provinces move between coast codes
- `STARTING_UNITS`: the Spring 1901 position

The classic map graph and starting position come from godip and use the same province ids as the frontend map; see
`ATTRIBUTIONS.md`.

Tests: `pnpm --filter @diplomacy/game-types run test` (Vitest).
