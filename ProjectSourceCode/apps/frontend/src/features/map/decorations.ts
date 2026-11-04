import { POWER_COLORS } from './powers.ts';

// Each decorative landmass (non-province island) gets its Deluxe-correct color.
// Known godip ids: ireland, iceland, cyprus, swiss (named) + Path-5-5, Path-6-7, Path-14,
// Path-28, Path-34, use168 (generic). We identify by name when possible, otherwise by first-point
// position. Deluxe colors each decorative landmass to match its geographic neighbor's power, OR
// neutral terracotta (same as Spain/other unclaimed lands) when not aligned.
const DECOR_NAMED_FILLS: Record<string, string> = {
  ireland: POWER_COLORS.england.fill,
  iceland: POWER_COLORS.neutral.fill,
  cyprus: POWER_COLORS.turkey.fill,
  swiss: POWER_COLORS.neutral.fill,
};

const DECOR_POSITIONED: Array<{ cx: number; cy: number; radius: number; fill: string }> = [
  { cx: 584, cy: 1110, radius: 10, fill: POWER_COLORS.france.fill }, // Corsica (top — French)
  { cx: 579, cy: 1107, radius: 10, fill: POWER_COLORS.france.fill }, // Corsica solid-fill pair
  { cx: 557, cy: 1125, radius: 10, fill: POWER_COLORS.italy.fill }, // Sardinia (bottom — Italian)
  { cx: 350, cy: 605, radius: 20, fill: POWER_COLORS.england.fill }, // Isle of Man — British
  { cx: 811, cy: 561, radius: 40, fill: POWER_COLORS.neutral.fill }, // Gotland
  { cx: 990, cy: 1324, radius: 80, fill: POWER_COLORS.neutral.fill }, // Crete
  { cx: 1167, cy: 33, radius: 60, fill: POWER_COLORS.neutral.fill }, // northern unknown
  { cx: 370, cy: 1161, radius: 50, fill: POWER_COLORS.neutral.fill }, // Balearics
];

export function decorativeRegionFill(id: string, pathD: string): string {
  if (DECOR_NAMED_FILLS[id]) {
    return DECOR_NAMED_FILLS[id];
  }
  const match = pathD.match(/^[Mm]\s*([-\d.]+)[,\s]+([-\d.]+)/);
  if (!match || !match[1] || !match[2]) {
    return POWER_COLORS.neutral.fill;
  }
  const px = parseFloat(match[1]);
  const py = parseFloat(match[2]);
  for (const entry of DECOR_POSITIONED) {
    const dx = px - entry.cx;
    const dy = py - entry.cy;
    if (dx * dx + dy * dy <= entry.radius * entry.radius) {
      return entry.fill;
    }
  }
  return POWER_COLORS.neutral.fill;
}

// Five-pointed star polygon points for SC markers.
export function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let index = 0; index < 10; index++) {
    const angle = (Math.PI / 5) * index - Math.PI / 2;
    const radius = index % 2 === 0 ? outerR : innerR;
    points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return points.join(' ');
}
