import {
  type BoardState,
  type MapLocation,
  type Order,
  type PhaseType,
  type Power,
  POWERS,
  type ProvinceCode,
  type Season,
  type Unit,
  type UnitType,
} from '@diplomacy/game-types';

import { isMapLocation, provinceOf } from '../map.js';

export interface DatcOrder {
  readonly power: Power;
  // Null when the order line names no unit type, as in "Remove pic".
  readonly unitType: UnitType | null;
  readonly order: Order;
}

export interface DatcResult extends DatcOrder {
  readonly success: boolean;
}

export interface DatcCase {
  readonly id: string;
  readonly title: string;
  // For retreat cases, `dislodged` lacks attacker origins; `previousMovement` holds the
  // movement-phase orders that produced the position.
  readonly board: BoardState;
  readonly previousMovement: readonly DatcResult[];
  readonly orders: readonly DatcOrder[];
  readonly expectedUnits: readonly Unit[];
  readonly expectedDislodged: readonly Unit[];
}

type Block =
  | 'prestate'
  | 'prestateDislodged'
  | 'supplyCenters'
  | 'previousMovement'
  | 'orders'
  | 'poststate'
  | 'poststateDislodged';

const BLOCKS: Readonly<Record<string, Block>> = {
  PRESTATE: 'prestate',
  PRESTATE_DISLODGED: 'prestateDislodged',
  PRESTATE_SUPPLYCENTER_OWNERS: 'supplyCenters',
  PRESTATE_RESULTS: 'previousMovement',
  ORDERS: 'orders',
  POSTSTATE: 'poststate',
  POSTSTATE_DISLODGED: 'poststateDislodged',
};

const PHASE_TYPES: Readonly<Record<string, PhaseType>> = {
  movement: 'movement',
  retreat: 'retreat',
  adjustment: 'build',
};

const POWER_NAMES: readonly string[] = POWERS;

function isPower(value: string): value is Power {
  return POWER_NAMES.includes(value);
}

function parseUnitType(token: string | undefined): UnitType | null {
  if (token === 'a') {
    return 'army';
  }
  return token === 'f' ? 'fleet' : null;
}

function parseLocation(token: string | undefined): MapLocation | null {
  return token !== undefined && isMapLocation(token) ? token : null;
}

function parseProvince(token: string | undefined): ProvinceCode | null {
  const location = parseLocation(token);
  return location ? provinceOf(location) : null;
}

function splitPowerLine(line: string): { power: Power; body: string } | null {
  const match = /^(\w+):?\s+(.*)$/.exec(line);
  const power = match?.[1]?.toLowerCase();
  const body = match?.[2];
  if (!power || body === undefined || !isPower(power)) {
    return null;
  }
  return {
    power,
    body: body
      .toLowerCase()
      .replace(/\s*-\s*/g, '-')
      .trim(),
  };
}

function parseUnit(line: string): Unit {
  const parsed = splitPowerLine(line);
  const [typeToken, locationToken] = parsed?.body.split(/\s+/) ?? [];
  const type = parseUnitType(typeToken);
  const location = parseLocation(locationToken);
  if (!parsed || !type || !location) {
    throw new Error(`Unreadable DATC unit: ${line}`);
  }
  return { type, owner: parsed.power, location };
}

function parseTarget(token: string | undefined): {
  from: ProvinceCode | null;
  to: ProvinceCode | null;
} {
  const [from, to] = (token ?? '').split('-');
  return { from: parseProvince(from), to: to === undefined ? null : parseProvince(to) };
}

// Orders the harness can't express (bad syntax, unknown provinces) return null: the unit holds,
// which is what DATC expects of an illegal order.
export function parseOrder(line: string): DatcOrder | null {
  const parsed = splitPowerLine(line);
  if (!parsed) {
    return null;
  }
  const { power } = parsed;
  const viaConvoy = /\s+via convoy$/.test(parsed.body);
  const tokens = parsed.body.replace(/\s+via convoy$/, '').split(/\s+/);
  const [first, second, third, ...rest] = tokens;

  if (first === 'build') {
    const unitType = parseUnitType(second);
    const unit = parseLocation(third);
    return unitType && unit
      ? { power, unitType, order: { action: 'build', unit, unitType } }
      : null;
  }
  if (first === 'remove' || first === 'disband') {
    const unitType = parseUnitType(second);
    const unit = parseLocation(unitType ? third : second);
    return unit ? { power, unitType, order: { action: 'disband', unit } } : null;
  }

  const unitType = parseUnitType(first);
  if (!unitType || !second) {
    return null;
  }
  const [origin, destination] = second.split('-');
  const unit = parseLocation(origin);
  if (!unit) {
    return null;
  }
  if (destination !== undefined) {
    const to = parseLocation(destination);
    return to ? { power, unitType, order: { action: 'move', unit, to, viaConvoy } } : null;
  }

  const [, targetToken] = rest;
  switch (third) {
    case undefined:
    case 'h':
    case 'hold':
    case 'holds':
      return { power, unitType, order: { action: 'hold', unit } };
    case 's':
    case 'support':
    case 'supports': {
      const { from, to } = parseTarget(targetToken);
      if (!from) {
        return null;
      }
      const order: Order = to
        ? { action: 'support', unit, supported: from, to }
        : { action: 'support', unit, supported: from };
      return { power, unitType, order };
    }
    case 'c':
    case 'convoy':
    case 'convoys': {
      const { from, to } = parseTarget(targetToken);
      return from && to
        ? { power, unitType, order: { action: 'convoy', unit, army: from, to } }
        : null;
    }
    case 'r':
    case 'retreat':
    case 'retreats': {
      const to = parseLocation(targetToken ?? rest[0]);
      return to ? { power, unitType, order: { action: 'retreat', unit, to } } : null;
    }
    case 'd':
    case 'disband':
      return { power, unitType, order: { action: 'disband', unit } };
    default:
      return null;
  }
}

// "SUCCESS: England: F nth H" records an order from the movement phase before a retreat case.
function parseResultLine(line: string): DatcResult | null {
  const match = /^(success|failure):\s*(.*)$/i.exec(line);
  const parsed = parseOrder(match?.[2] ?? '');
  return match && parsed ? { ...parsed, success: match[1]?.toLowerCase() === 'success' } : null;
}

function parseSupplyCenter(line: string): [ProvinceCode, Power] {
  const unit = parseUnit(line);
  return [provinceOf(unit.location), unit.owner];
}

function parsePhase(text: string): Pick<BoardState, 'year' | 'season' | 'phaseType'> {
  const match = /^(spring|fall)\s+(\d+),\s*(\w+)$/i.exec(text.trim());
  const season = match?.[1]?.toLowerCase();
  const phaseType = PHASE_TYPES[match?.[3]?.toLowerCase() ?? ''];
  if (!match || (season !== 'spring' && season !== 'fall') || !phaseType) {
    throw new Error(`Unreadable DATC phase: ${text}`);
  }
  const parsedSeason: Season = season;
  return { year: Number(match[2]), season: parsedSeason, phaseType };
}

export function parseDatc(text: string): DatcCase[] {
  const cases: DatcCase[] = [];
  let current: {
    id: string;
    title: string;
    phase: Pick<BoardState, 'year' | 'season' | 'phaseType'>;
    lines: Record<Block, string[]>;
    same: boolean;
  } | null = null;
  let block: Block | null = null;

  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/#.*/, '').trim();
    if (!line) {
      continue;
    }
    const indented = /^\s/.test(rawLine);
    if (indented) {
      if (current && block) {
        current.lines[block].push(line);
      }
      continue;
    }
    const [directive = '', ...remainder] = line.split(/\s+/);
    if (directive === 'CASE') {
      const id = (remainder[0] ?? '').replace(/\.$/, '');
      current = {
        id,
        title: line.slice('CASE '.length),
        phase: { year: 1901, season: 'spring', phaseType: 'movement' },
        lines: {
          prestate: [],
          prestateDislodged: [],
          supplyCenters: [],
          previousMovement: [],
          orders: [],
          poststate: [],
          poststateDislodged: [],
        },
        same: false,
      };
      block = null;
      continue;
    }
    if (!current) {
      continue;
    }
    if (directive === 'PRESTATE_SETPHASE') {
      current.phase = parsePhase(remainder.join(' '));
      block = null;
    } else if (directive === 'POSTSTATE_SAME') {
      current.same = true;
      block = null;
    } else if (directive === 'END') {
      const units = current.lines.prestate.map(parseUnit);
      const expectedDislodged = current.lines.poststateDislodged.map(parseUnit);
      const dislodgedKeys = new Set(expectedDislodged.map(unitKey));
      cases.push({
        id: current.id,
        title: current.title,
        board: {
          ...current.phase,
          units,
          supplyCenters: Object.fromEntries(current.lines.supplyCenters.map(parseSupplyCenter)),
          dislodged: current.lines.prestateDislodged
            .map(parseUnit)
            .map((unit) => ({ unit, attackerFrom: null })),
          standoffs: [],
        },
        previousMovement: current.lines.previousMovement.flatMap(
          (resultLine) => parseResultLine(resultLine) ?? [],
        ),
        orders: current.lines.orders.flatMap((orderLine) => parseOrder(orderLine) ?? []),
        expectedUnits: current.same
          ? units.filter((unit) => !dislodgedKeys.has(unitKey(unit)))
          : current.lines.poststate.map(parseUnit),
        expectedDislodged,
      });
      current = null;
      block = null;
    } else {
      block = BLOCKS[directive] ?? null;
    }
  }
  return cases;
}

export function unitKey(unit: Unit): string {
  return `${unit.owner} ${unit.type} ${unit.location}`;
}
