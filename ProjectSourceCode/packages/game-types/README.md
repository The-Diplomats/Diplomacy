# @diplomacy/game-types

Pure TypeScript domain types for Diplomacy. No runtime logic, zero runtime dependencies.

## Usage

```ts
import { POWERS, type Power, type BoardState, CLASSIC_MAP_META } from '@diplomacy/game-types';
```

## Exports

- `POWERS`, `SEASONS`, `PHASE_TYPES`, `UNIT_TYPES`, `PROVINCE_CODES`: const arrays + union types
- `Unit`, `BoardState`, `Order`: domain interfaces
- `CLASSIC_MAP_META`: stub map metadata (full 76-province data lands with adjudicator work)
