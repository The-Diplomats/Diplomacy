import type {
  DislodgedUnit,
  MapLocation,
  Order,
  OrderResult,
  ProvinceCode,
  Unit,
} from '@diplomacy/game-types';
import { FLEET_ADJACENCY } from '@diplomacy/game-types';

import {
  canReach,
  fleetDestinationsIn,
  isArmyAdjacent,
  isCoastal,
  isSea,
  provinceOf,
  seasLinkedTo,
} from './map.js';

interface EntryBase {
  readonly unit: Unit;
  readonly province: ProvinceCode;
  readonly submitted: Order | undefined;
}

interface HoldEntry extends EntryBase {
  readonly kind: 'hold';
  // The submitted order could not be carried out, so the unit holds instead.
  readonly invalid: boolean;
}

interface MoveEntry extends EntryBase {
  readonly kind: 'move';
  readonly to: MapLocation;
  readonly target: ProvinceCode;
  readonly viaConvoy: boolean;
  readonly byConvoy: boolean;
}

interface SupportEntry extends EntryBase {
  readonly kind: 'support';
  readonly supported: ProvinceCode;
  readonly to: ProvinceCode | undefined;
}

interface ConvoyEntry extends EntryBase {
  readonly kind: 'convoy';
  readonly army: ProvinceCode;
  readonly to: ProvinceCode;
}

type Entry = HoldEntry | MoveEntry | SupportEntry | ConvoyEntry;

type DecisionKind = 'move' | 'support' | 'path';

interface Decision {
  readonly kind: DecisionKind;
  readonly entry: number;
  state: 'unresolved' | 'guessing' | 'resolved';
  resolution: boolean;
}

export interface MovementOutcome {
  readonly results: Partial<Record<MapLocation, OrderResult>>;
  readonly units: readonly Unit[];
  readonly dislodged: readonly DislodgedUnit[];
  readonly standoffs: readonly ProvinceCode[];
}

function moveDestination(unit: Unit, province: ProvinceCode, to: MapLocation): MapLocation | null {
  const target = provinceOf(to);
  if (target === province) {
    return null;
  }
  if (unit.type === 'army') {
    if (isSea(target)) {
      return null;
    }
    return isArmyAdjacent(province, target) || (isCoastal(province) && isCoastal(target))
      ? target
      : null;
  }
  if (FLEET_ADJACENCY[unit.location].includes(to)) {
    return to;
  }
  // A split-coast province given without a coast resolves only when one coast is reachable.
  const reachable = fleetDestinationsIn(unit.location, target);
  const [onlyCoast] = reachable;
  return to === target && reachable.length === 1 && onlyCoast ? onlyCoast : null;
}

function toEntry(unit: Unit, submitted: Order | undefined): Entry {
  const province = provinceOf(unit.location);
  const base = { unit, province, submitted };
  const hold = (invalid: boolean): HoldEntry => ({ ...base, kind: 'hold', invalid });
  if (!submitted) {
    return hold(false);
  }
  switch (submitted.action) {
    case 'hold':
      return hold(false);
    case 'move': {
      const to = moveDestination(unit, province, submitted.to);
      if (!to) {
        return hold(true);
      }
      const viaConvoy = submitted.viaConvoy === true;
      return { ...base, kind: 'move', to, target: provinceOf(to), viaConvoy, byConvoy: false };
    }
    case 'support': {
      const { supported, to } = submitted;
      const reach = to ?? supported;
      if (
        supported === province ||
        to === supported ||
        !canReach(unit.type, unit.location, reach)
      ) {
        return hold(true);
      }
      return { ...base, kind: 'support', supported, to };
    }
    case 'convoy': {
      const { army, to } = submitted;
      if (unit.type !== 'fleet' || !isSea(province) || army === to) {
        return hold(true);
      }
      return { ...base, kind: 'convoy', army, to };
    }
    default:
      return hold(true);
  }
}

// Kruijswijk's partial-information algorithm ("The Math of Adjudication"), with the Szykman rule
// for convoy paradoxes and success for circular movement as the backup rule.
class MovementResolver {
  private readonly decisions: Decision[] = [];
  private readonly decisionIds: Readonly<Record<DecisionKind, Map<number, number>>> = {
    move: new Map(),
    support: new Map(),
    path: new Map(),
  };
  private readonly dependencies: number[] = [];
  private readonly occupants = new Map<ProvinceCode, number>();
  private readonly movesInto = new Map<ProvinceCode, number[]>();
  private readonly supportsOf = new Map<number, number[]>();
  private readonly convoysOf = new Map<number, number[]>();

  constructor(private readonly entries: readonly Entry[]) {
    entries.forEach((entry, index) => this.occupants.set(entry.province, index));
    entries.forEach((entry, index) => {
      if (entry.kind === 'move') {
        this.addTo(this.movesInto, entry.target, index);
        this.addDecision('move', index);
        if (entry.byConvoy) {
          this.addDecision('path', index);
          this.convoysOf.set(index, this.convoysFor(entry));
        }
      }
      if (entry.kind === 'support') {
        const supported = this.occupants.get(entry.supported);
        if (supported !== undefined && this.supportMatches(entry, this.entry(supported))) {
          this.addTo(this.supportsOf, supported, index);
          this.addDecision('support', index);
        }
      }
    });
  }

  resolveAll(): void {
    this.decisions.forEach((_decision, id) => this.resolve(id));
  }

  moveSucceeds(index: number): boolean {
    return this.resolve(this.decisionId('move', index));
  }

  pathSucceeds(index: number): boolean {
    const move = this.move(index);
    return !move.byConvoy || this.resolve(this.decisionId('path', index));
  }

  isDislodged(index: number): boolean {
    const entry = this.entry(index);
    if (entry.kind === 'move' && this.moveSucceeds(index)) {
      return false;
    }
    return (this.movesInto.get(entry.province) ?? []).some((attacker) =>
      this.moveSucceeds(attacker),
    );
  }

  resultOf(index: number): OrderResult {
    const entry = this.entry(index);
    switch (entry.kind) {
      case 'hold':
        return entry.invalid ? 'void' : 'success';
      case 'move':
        return this.moveSucceeds(index) ? 'success' : 'bounced';
      case 'support': {
        const id = this.decisionIds.support.get(index);
        if (id === undefined) {
          return 'void';
        }
        return this.resolve(id) ? 'success' : 'cut';
      }
      case 'convoy': {
        if (!this.convoyMatches(entry)) {
          return 'void';
        }
        return this.isDislodged(index) ? 'cut' : 'success';
      }
    }
  }

  private resolve(id: number): boolean {
    const decision = this.decision(id);
    if (decision.state === 'resolved') {
      return decision.resolution;
    }
    if (decision.state === 'guessing') {
      // Recorded on every read, so a caller can tell it read a guess even when an outer
      // decision already listed this one.
      this.dependencies.push(id);
      return decision.resolution;
    }
    const start = this.dependencies.length;
    decision.resolution = false;
    decision.state = 'guessing';
    const first = this.adjudicate(decision);
    if (this.dependencies.length === start) {
      // The backup rule may already have resolved this decision while it was being guessed.
      if (this.decision(id).state !== 'resolved') {
        decision.resolution = first;
        decision.state = 'resolved';
      }
      return decision.resolution;
    }
    if (this.dependencies[start] !== id) {
      // Depends on another decision's guess; that decision settles this one later.
      this.dependencies.push(id);
      decision.resolution = first;
      return first;
    }
    this.releaseDependencies(start);
    decision.resolution = true;
    decision.state = 'guessing';
    const second = this.adjudicate(decision);
    if (first === second) {
      this.releaseDependencies(start);
      decision.resolution = first;
      decision.state = 'resolved';
      return first;
    }
    this.applyBackupRule(start);
    return this.resolve(id);
  }

  private releaseDependencies(start: number): void {
    for (const id of this.dependencies.slice(start)) {
      this.decision(id).state = 'unresolved';
    }
    this.dependencies.length = start;
  }

  private applyBackupRule(start: number): void {
    const cycle = this.dependencies.slice(start);
    this.dependencies.length = start;
    const paradox = cycle.some((id) => this.decision(id).kind === 'path');
    let settled = false;
    for (const id of cycle) {
      const decision = this.decision(id);
      if (paradox && decision.kind === 'path') {
        decision.resolution = false;
        decision.state = 'resolved';
        settled = true;
      } else if (!paradox && decision.kind === 'move') {
        decision.resolution = true;
        decision.state = 'resolved';
        settled = true;
      } else {
        decision.state = 'unresolved';
      }
    }
    if (!settled) {
      throw new Error('Adjudication cycle without a move or convoy path to settle it');
    }
  }

  private adjudicate(decision: Decision): boolean {
    switch (decision.kind) {
      case 'move':
        return this.adjudicateMove(decision.entry);
      case 'support':
        return this.adjudicateSupport(decision.entry);
      case 'path':
        return this.routeExists(decision.entry, (fleet) => !this.isDislodged(fleet));
    }
  }

  private adjudicateMove(index: number): boolean {
    const move = this.move(index);
    const attack = this.attackStrength(index);
    const occupant = this.occupants.get(move.target);
    if (occupant !== undefined && this.isHeadToHead(index, occupant)) {
      if (attack <= this.defendStrength(occupant)) {
        return false;
      }
    } else if (attack <= this.holdStrength(move.target)) {
      return false;
    }
    for (const rival of this.movesInto.get(move.target) ?? []) {
      if (rival !== index && attack <= this.preventStrength(rival)) {
        return false;
      }
    }
    return true;
  }

  private adjudicateSupport(index: number): boolean {
    const support = this.support(index);
    // An attack from the province the support is aimed at does not cut it.
    const exempt = support.to ?? support.supported;
    for (const attacker of this.movesInto.get(support.province) ?? []) {
      const move = this.move(attacker);
      if (
        move.unit.owner !== support.unit.owner &&
        move.province !== exempt &&
        this.pathSucceeds(attacker)
      ) {
        return false;
      }
    }
    return !this.isDislodged(index);
  }

  private holdStrength(province: ProvinceCode): number {
    const occupant = this.occupants.get(province);
    if (occupant === undefined) {
      return 0;
    }
    if (this.entry(occupant).kind === 'move') {
      return this.moveSucceeds(occupant) ? 0 : 1;
    }
    return 1 + this.countGiven(this.supportsOf.get(occupant) ?? []);
  }

  private attackStrength(index: number): number {
    if (!this.pathSucceeds(index)) {
      return 0;
    }
    const move = this.move(index);
    const supports = this.supportsOf.get(index) ?? [];
    const occupant = this.occupants.get(move.target);
    if (occupant === undefined || this.movesAway(index, occupant)) {
      return 1 + this.countGiven(supports);
    }
    const defender = this.entry(occupant).unit.owner;
    if (defender === move.unit.owner) {
      return 0;
    }
    // A power's supports never help dislodge its own unit.
    const helping = supports.filter((support) => this.entry(support).unit.owner !== defender);
    return 1 + this.countGiven(helping);
  }

  private defendStrength(index: number): number {
    return 1 + this.countGiven(this.supportsOf.get(index) ?? []);
  }

  private preventStrength(index: number): number {
    if (!this.pathSucceeds(index)) {
      return 0;
    }
    // A unit that lost a head-to-head battle has no effect on the province it attacked.
    const occupant = this.occupants.get(this.move(index).target);
    if (
      occupant !== undefined &&
      this.isHeadToHead(index, occupant) &&
      this.moveSucceeds(occupant)
    ) {
      return 0;
    }
    return 1 + this.countGiven(this.supportsOf.get(index) ?? []);
  }

  private movesAway(index: number, occupant: number): boolean {
    return (
      this.entry(occupant).kind === 'move' &&
      !this.isHeadToHead(index, occupant) &&
      this.moveSucceeds(occupant)
    );
  }

  private isHeadToHead(index: number, other: number): boolean {
    const move = this.move(index);
    const opposing = this.entry(other);
    return (
      opposing.kind === 'move' &&
      opposing.target === move.province &&
      !move.byConvoy &&
      !opposing.byConvoy
    );
  }

  private countGiven(supports: readonly number[]): number {
    return supports.filter((support) => this.resolve(this.decisionId('support', support))).length;
  }

  private routeExists(index: number, usable: (fleet: number) => boolean): boolean {
    const move = this.move(index);
    const fleets = this.convoysOf.get(index) ?? [];
    const borders = (fleet: number, province: ProvinceCode) =>
      canReach('fleet', this.entry(fleet).unit.location, province);
    const frontier = fleets.filter((fleet) => borders(fleet, move.province) && usable(fleet));
    const visited = new Set(frontier);
    for (let fleet = frontier.pop(); fleet !== undefined; fleet = frontier.pop()) {
      if (borders(fleet, move.target)) {
        return true;
      }
      const position = this.entry(fleet).province;
      for (const next of fleets) {
        if (!visited.has(next) && borders(next, position) && usable(next)) {
          visited.add(next);
          frontier.push(next);
        }
      }
    }
    return false;
  }

  private convoysFor(move: MoveEntry): number[] {
    return this.entries.flatMap((entry, index) =>
      entry.kind === 'convoy' && entry.army === move.province && entry.to === move.target
        ? [index]
        : [],
    );
  }

  private supportMatches(support: SupportEntry, supported: Entry): boolean {
    if (support.to === undefined) {
      return supported.kind !== 'move';
    }
    return supported.kind === 'move' && supported.target === support.to;
  }

  private convoyMatches(convoy: ConvoyEntry): boolean {
    const army = this.occupants.get(convoy.army);
    if (army === undefined) {
      return false;
    }
    const entry = this.entry(army);
    return entry.kind === 'move' && entry.byConvoy && entry.target === convoy.to;
  }

  private addDecision(kind: DecisionKind, entry: number): void {
    this.decisionIds[kind].set(entry, this.decisions.length);
    this.decisions.push({ kind, entry, state: 'unresolved', resolution: false });
  }

  private addTo<Key>(map: Map<Key, number[]>, key: Key, index: number): void {
    const list = map.get(key);
    if (list) {
      list.push(index);
    } else {
      map.set(key, [index]);
    }
  }

  private decisionId(kind: DecisionKind, entry: number): number {
    const id = this.decisionIds[kind].get(entry);
    if (id === undefined) {
      throw new Error(`No ${kind} decision for order ${entry}`);
    }
    return id;
  }

  private decision(id: number): Decision {
    const decision = this.decisions[id];
    if (!decision) {
      throw new Error(`Unknown decision ${id}`);
    }
    return decision;
  }

  private entry(index: number): Entry {
    const entry = this.entries[index];
    if (!entry) {
      throw new Error(`Unknown order ${index}`);
    }
    return entry;
  }

  private move(index: number): MoveEntry {
    const entry = this.entry(index);
    if (entry.kind !== 'move') {
      throw new Error(`Order ${index} is not a move`);
    }
    return entry;
  }

  private support(index: number): SupportEntry {
    const entry = this.entry(index);
    if (entry.kind !== 'support') {
      throw new Error(`Order ${index} is not a support`);
    }
    return entry;
  }
}

// Fleets linked to `start` through a chain of the given fleets.
function convoyChain<Fleet extends Entry>(
  convoys: readonly Fleet[],
  start: ProvinceCode,
): Set<Fleet> {
  const borders = (convoy: Fleet, province: ProvinceCode) =>
    canReach('fleet', convoy.unit.location, province);
  const frontier = convoys.filter((convoy) => borders(convoy, start));
  const chain = new Set(frontier);
  for (let convoy = frontier.pop(); convoy; convoy = frontier.pop()) {
    for (const next of convoys) {
      if (!chain.has(next) && borders(next, convoy.province)) {
        chain.add(next);
        frontier.push(next);
      }
    }
  }
  return chain;
}

function routeFleets<Fleet extends Entry>(fleets: readonly Fleet[], move: MoveEntry): Fleet[] {
  const fromOrigin = convoyChain(fleets, move.province);
  return [...convoyChain(fleets, move.target)].filter((fleet) => fromOrigin.has(fleet));
}

// 2000 rulebook. A move to a non-adjacent province is illegal only when no fleets at sea could
// form a route; otherwise it is a convoyed move that fails without matching convoy orders.
// A move to an adjacent province goes by convoy only when a route exists and the army is ordered
// `viaConvoy` or a fleet of its own power has a legal order to convoy it (one that lies on some
// sea path between the two provinces, even if not on the route formed); otherwise over land.
function travelMode(move: MoveEntry, entries: readonly Entry[]): 'land' | 'convoy' | 'illegal' {
  if (move.unit.type !== 'army') {
    return 'land';
  }
  const convoys = entries.filter(
    (entry): entry is ConvoyEntry =>
      entry.kind === 'convoy' && entry.army === move.province && entry.to === move.target,
  );
  const onRoute = routeFleets(convoys, move);
  if (!isArmyAdjacent(move.province, move.target)) {
    const fleetsAtSea = entries.filter(
      (entry) => entry.unit.type === 'fleet' && isSea(entry.province),
    );
    return routeFleets(fleetsAtSea, move).length > 0 ? 'convoy' : 'illegal';
  }
  if (onRoute.length === 0) {
    return 'land';
  }
  const seaPath = new Set(
    [...seasLinkedTo(move.province)].filter((sea) => seasLinkedTo(move.target).has(sea)),
  );
  const ownIntent = convoys.some(
    (convoy) => convoy.unit.owner === move.unit.owner && seaPath.has(convoy.province),
  );
  return move.viaConvoy || ownIntent ? 'convoy' : 'land';
}

export function adjudicateMovement(
  units: readonly Unit[],
  orders: readonly Order[],
): MovementOutcome {
  const ordersByProvince = new Map<ProvinceCode, Order>();
  for (const order of orders) {
    const province = provinceOf(order.unit);
    if (!ordersByProvince.has(province)) {
      ordersByProvince.set(province, order);
    }
  }
  const occupied = new Set<ProvinceCode>();
  const drafts = units.map((unit) => {
    const province = provinceOf(unit.location);
    if (occupied.has(province)) {
      throw new Error(`Two units in ${province}`);
    }
    occupied.add(province);
    return toEntry(unit, ordersByProvince.get(province));
  });
  const entries = drafts.map((entry): Entry => {
    if (entry.kind !== 'move') {
      return entry;
    }
    const mode = travelMode(entry, drafts);
    if (mode === 'illegal') {
      const { unit, province, submitted } = entry;
      return { unit, province, submitted, kind: 'hold', invalid: true };
    }
    return { ...entry, byConvoy: mode === 'convoy' };
  });

  const resolver = new MovementResolver(entries);
  resolver.resolveAll();

  const arrivals = new Map<ProvinceCode, MoveEntry>();
  entries.forEach((entry, index) => {
    if (entry.kind !== 'move' || !resolver.moveSucceeds(index)) {
      return;
    }
    if (arrivals.has(entry.target)) {
      throw new Error(`Two moves into ${entry.target} succeeded`);
    }
    arrivals.set(entry.target, entry);
  });

  const results: Partial<Record<MapLocation, OrderResult>> = {};
  const remaining: Unit[] = [];
  const dislodged: DislodgedUnit[] = [];
  entries.forEach((entry, index) => {
    if (entry.submitted) {
      results[entry.submitted.unit] = resolver.resultOf(index);
    }
    if (entry.kind === 'move' && resolver.moveSucceeds(index)) {
      remaining.push({ ...entry.unit, location: entry.to });
      return;
    }
    const attack = arrivals.get(entry.province);
    if (attack) {
      dislodged.push({ unit: entry.unit, attackerFrom: attack.byConvoy ? null : attack.province });
      return;
    }
    remaining.push(entry.unit);
  });

  const occupiedAfter = new Set(remaining.map((unit) => provinceOf(unit.location)));
  const standoffs = [
    ...new Set(
      entries.flatMap((entry, index) =>
        entry.kind === 'move' &&
        !resolver.moveSucceeds(index) &&
        resolver.pathSucceeds(index) &&
        !occupiedAfter.has(entry.target)
          ? [entry.target]
          : [],
      ),
    ),
  ].sort();

  return { results, units: remaining, dislodged, standoffs };
}
