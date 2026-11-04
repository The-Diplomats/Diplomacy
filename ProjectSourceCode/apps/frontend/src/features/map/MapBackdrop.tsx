import { useState } from 'react';
import { useLocation } from 'react-router';

import {
  COUNTRY_LABEL_NAMES,
  COUNTRY_LABEL_POSITIONS,
  COUNTRY_LABEL_TEXT,
  getProvinceOwner,
  POWER_COLORS,
} from './powers.ts';
import type { LabelData } from './types.ts';
import { useMapData } from './useMapData.ts';

// Debug layer toggles via URL query params:
//   ?noprovlabels - hide province labels
//   ?nosealabels  - hide sea labels
//   ?nocountries  - hide synthesized country labels
//   ?nolabels     - hide ALL labels (shortcut for all three above)
//   ?nostars      - hide SC stars
//   ?nodecor      - hide decorative foreground borders (keeps province fills)
//   ?nonoise      - hide paper noise texture
//   ?nowatercolor - disable watercolor filter on provinces
//   ?noimpassable - hide impassable (Switzerland) label
function useLayerToggles() {
  const params = new URLSearchParams(useLocation().search);
  const has = (key: string) => params.has(key) || params.has('nolabels');
  return {
    provinceLabels: !has('noprovlabels'),
    seaLabels: !has('nosealabels'),
    countryLabels: !has('nocountries'),
    stars: !params.has('nostars'),
    decorations: !params.has('nodecor'),
    noise: !params.has('nonoise'),
    watercolor: !params.has('nowatercolor'),
    vignette: !params.has('novignette'),
    impassableLabel: !params.has('noimpassable'),
  };
}

type LabelKind = 'country' | 'province' | 'sea' | 'skip';

const SHORT_ABBREV_RE = /^[A-Z]{2,4}\.?$/;
const SEA_WORD_RE =
  /\b(sea|ocean|channel|mediterranean|atlantic|gulf|bight|strait|skagerrak|med)\b/i;
const KNOWN_SEA_NAMES = new Set(['Helgoland', 'ENGLISHCHANNEL']);

// Each decorative landmass (non-province island) gets its Deluxe-correct color.
// Known godip ids: ireland, iceland, cyprus, swiss (named) + Path-5-5, Path-6-7,
// Path-14, Path-28, Path-34, use168 (generic). We identify by name when possible,
// otherwise by approximate first-point position of the path.
// Deluxe colors decorative landmasses to match their geographic neighbor's power,
// OR neutral terracotta (same as Spain/other unclaimed lands) when not aligned.
const DECOR_NAMED_FILLS: Record<string, string> = {
  ireland: POWER_COLORS.england.fill,
  iceland: POWER_COLORS.neutral.fill,
  cyprus: POWER_COLORS.turkey.fill,
  swiss: POWER_COLORS.neutral.fill,
};

const DECOR_POSITIONED: Array<{ cx: number; cy: number; radius: number; fill: string }> = [
  { cx: 584, cy: 1110, radius: 10, fill: POWER_COLORS.france.fill }, // Corsica (top — French), matches Path-6-7
  { cx: 579, cy: 1107, radius: 10, fill: POWER_COLORS.france.fill }, // Corsica solid-fill pair (Path-6)
  { cx: 557, cy: 1125, radius: 10, fill: POWER_COLORS.italy.fill }, // Sardinia (bottom — Italian), matches Path-5-5
  { cx: 350, cy: 605, radius: 20, fill: POWER_COLORS.england.fill }, // Isle of Man (Path-42) — British
  { cx: 811, cy: 561, radius: 40, fill: POWER_COLORS.neutral.fill }, // Gotland
  { cx: 990, cy: 1324, radius: 80, fill: POWER_COLORS.neutral.fill }, // Crete
  { cx: 1167, cy: 33, radius: 60, fill: POWER_COLORS.neutral.fill }, // northern unknown
  { cx: 370, cy: 1161, radius: 50, fill: POWER_COLORS.neutral.fill }, // Balearics
];

function decorativeRegionFill(id: string, pathD: string): string {
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

function starPoints(cx: number, cy: number, outerR: number, innerR: number): string {
  const points: string[] = [];
  for (let index = 0; index < 10; index++) {
    const angle = (Math.PI / 5) * index - Math.PI / 2;
    const radius = index % 2 === 0 ? outerR : innerR;
    points.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }
  return points.join(' ');
}

function classifyLabel(label: LabelData): LabelKind {
  const text = label.text.trim();
  if (COUNTRY_LABEL_NAMES.has(text.toUpperCase())) {
    return 'country';
  }
  if (SHORT_ABBREV_RE.test(text)) {
    return 'skip';
  }
  if (SEA_WORD_RE.test(text) || KNOWN_SEA_NAMES.has(text)) {
    return 'sea';
  }
  return 'province';
}

// Godip ships sea names in ALL CAPS and some joined (ENGLISHCHANNEL). Deluxe shows
// sea labels in Title Case with real word boundaries, so prettify here.
const SEA_TEXT_FIXUPS: Record<string, string> = {
  ENGLISHCHANNEL: 'English Channel',
  'EAST MED': 'Eastern Mediterranean',
};

function prettifySeaText(text: string): string {
  const fix = SEA_TEXT_FIXUPS[text.toUpperCase()];
  if (fix) {
    return fix;
  }
  if (text === text.toUpperCase()) {
    return text
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return text;
}

// Extend godip's viewBox horizontally AND vertically to make room for the gold Deluxe frame
// with breathing space on all sides. godip native: 1524 × 1357.
// Deluxe sandwich frame: slightly-darker aged-gold edges | aged gold middle | same darker edges.
// All three bands are gold-family colors (middle just slightly lighter). Middle is thin, not thick.
const FRAME_EDGE_THICK = 8; // dark cardboard edges
const FRAME_GOLD_THICK = 19; // lighter cardboard middle (35 total: 8 + 19 + 8)
const FRAME_TOTAL = FRAME_EDGE_THICK * 2 + FRAME_GOLD_THICK;
const FRAME_EDGE_COLOR = '#7a5a38'; // mid cardboard edge
const FRAME_MIDDLE_COLOR = '#b89668'; // lighter muted cardboard tan

// Asymmetric horizontal extension: all open sea on the LEFT (Atlantic), godip's right edge
// butts up against the frame (lands run to the painted edge, per spec #9).
const MAP_EXTENSION_LEFT = 561;
const MAP_EXTENSION_RIGHT = 35;
const MAP_EXTENSION_X = MAP_EXTENSION_LEFT + MAP_EXTENSION_RIGHT;
const MAP_EXTENSION_Y = FRAME_TOTAL; // vertical: just enough for the frame thickness

// Hover highlight extension shapes — when hovering NAt/MAt, the highlight extends into the
// hand-authored left-sea extension area so the ocean reads as one continuous province.
// `fill` closes along the shared x=3 godip-clip edge (invisible seam against the province path).
// `stroke` is open and skips that shared edge so there's no double-line at x=3.
const HOVER_EXTENSIONS: Record<string, { fill: string; stroke: string }> = {
  nat: {
    fill: 'M 3 3 L 3 709.8 C -40 716 -110 732 -180 745 S -300 758 -523 764 L -523 3 Z',
    stroke: 'M 3 709.8 C -40 716 -110 732 -180 745 S -300 758 -523 764 L -523 3 L 3 3',
  },
  mid: {
    fill: 'M 3 709.8 C -40 716 -110 732 -180 745 S -300 758 -523 764 L -523 1354 L -10 1354 L -10 1352 L 3 1331 Z',
    stroke:
      'M 3 709.8 C -40 716 -110 732 -180 745 S -300 758 -523 764 L -523 1354 L -10 1354 L -10 1352 L 3 1331',
  },
};
export function MapBackdrop() {
  const { data } = useMapData();
  const location = useLocation();
  const toggles = useLayerToggles();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const isGameRoute = location.pathname.startsWith('/game/');

  if (isGameRoute || !data) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-0 bg-black">
      <svg
        viewBox={`${-MAP_EXTENSION_LEFT} ${-MAP_EXTENSION_Y} ${data.width + MAP_EXTENSION_X} ${data.height + 2 * MAP_EXTENSION_Y}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <filter id="watercolor" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.025"
              numOctaves="1"
              seed="7"
              result="noise"
            />
            <feColorMatrix
              in="noise"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.08 0"
              result="darken"
            />
            <feComposite in="darken" in2="SourceGraphic" operator="in" result="watercolorMask" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="watercolorMask" />
            </feMerge>
          </filter>

          {data.noise && (
            <pattern
              id="paper-noise"
              patternUnits="userSpaceOnUse"
              width="258"
              height="258"
              x="-258"
              y="-258"
            >
              <image href={data.noise.href} width="258" height="258" />
            </pattern>
          )}

          {/* Coast vignette filter — godip's source (filter848): Gaussian blur on a coast path. */}
          <filter
            id="coast-vignette"
            x="-1%"
            y="-1%"
            width="102%"
            height="103%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur stdDeviation="5.76" />
          </filter>

          {/* Water-only clip: all water province shapes unioned, used to mask the vignette so the
              blur paints onto sea but is hidden on land (our province fills are opaque unlike
              diplicity's semi-transparent ones). */}
          <clipPath id="water-clip">
            {data.provinces
              .filter((p) => getProvinceOwner(p.id) === 'water')
              .map((p) => (
                <path key={`water-clip-${p.id}`} d={p.d} />
              ))}
          </clipPath>

          {/* Soft drop shadow for the Diplomacy script logo — gives embossed depth */}
          <filter id="logo-shadow" x="-10%" y="-10%" width="120%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" />
            <feOffset dx="3" dy="4" result="shadow" />
            <feComponentTransfer in="shadow" result="softShadow">
              <feFuncA type="linear" slope="0.55" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode in="softShadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Clip godip content to slightly-inset of its native viewBox so edge-touching
              province strokes don't form a visible rectangle. */}
          <clipPath id="godip-content-clip">
            {/* Inset all 4 sides to hide edge strokes at godip viewBox boundaries */}
            <rect x={3} y={3} width={data.width - 6} height={data.height - 6} />
          </clipPath>
        </defs>

        {/* Base water fill — extends across full extended viewBox */}
        <rect
          x={-MAP_EXTENSION_LEFT}
          y={-MAP_EXTENSION_Y}
          width={data.width + MAP_EXTENSION_X}
          height={data.height + 2 * MAP_EXTENSION_Y}
          fill={POWER_COLORS.water.fill}
        />

        {/* Deluxe sandwich frame: thin dark cardboard | thick lighter gold | thin dark cardboard */}
        {(() => {
          const fullW = data.width + MAP_EXTENSION_X;
          const fullH = data.height + 2 * MAP_EXTENSION_Y;
          const x0 = -MAP_EXTENSION_LEFT;
          const y0 = -MAP_EXTENSION_Y;
          return (
            <>
              {/* Outer darker-gold edge — fills the whole frame area */}
              <rect x={x0} y={y0} width={fullW} height={fullH} fill={FRAME_EDGE_COLOR} />
              {/* Lighter gold middle — inset by outer edge thickness */}
              <rect
                x={x0 + FRAME_EDGE_THICK}
                y={y0 + FRAME_EDGE_THICK}
                width={fullW - 2 * FRAME_EDGE_THICK}
                height={fullH - 2 * FRAME_EDGE_THICK}
                fill={FRAME_MIDDLE_COLOR}
              />
              {/* Cardboard fiber texture — paper noise cranked up only on the frame.
                  Painted after gold middle so inner water rect below covers the map area. */}
              {toggles.noise && data.noise && (
                <rect
                  x={x0}
                  y={y0}
                  width={fullW}
                  height={fullH}
                  fill="url(#paper-noise)"
                  opacity={0.15}
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {/* Inner dark cardboard edge — filled rect so visible thickness matches outer */}
              <rect
                x={x0 + FRAME_EDGE_THICK + FRAME_GOLD_THICK}
                y={y0 + FRAME_EDGE_THICK + FRAME_GOLD_THICK}
                width={fullW - 2 * (FRAME_EDGE_THICK + FRAME_GOLD_THICK)}
                height={fullH - 2 * (FRAME_EDGE_THICK + FRAME_GOLD_THICK)}
                fill={FRAME_EDGE_COLOR}
              />
              {/* Inner water (map area); filter matches sea-province watercolor so extension water
                  reads the same as godip's water. */}
              <rect
                x={x0 + 2 * FRAME_EDGE_THICK + FRAME_GOLD_THICK}
                y={y0 + 2 * FRAME_EDGE_THICK + FRAME_GOLD_THICK}
                width={fullW - 2 * (2 * FRAME_EDGE_THICK + FRAME_GOLD_THICK)}
                height={fullH - 2 * (2 * FRAME_EDGE_THICK + FRAME_GOLD_THICK)}
                fill={POWER_COLORS.water.fill}
                filter={toggles.watercolor ? 'url(#watercolor)' : undefined}
              />
            </>
          );
        })()}

        {/* Extensions removed — will handle via gold frame + proper strategy later. */}

        {/* All godip-sourced content is clipped so edge strokes don't form a visible rectangle. */}
        <g clipPath="url(#godip-content-clip)">
          {/* Impassables (Switzerland shape from background layer — neutral terracotta per Deluxe) */}
          {data.impassables.map((impassable, index) => (
            <path
              key={`impassable-${index}`}
              d={impassable.d}
              fill={POWER_COLORS.neutral.fill}
              stroke="#000"
              strokeWidth={1}
            />
          ))}

          {/* Decorative non-province landmasses. Deluxe paints each one the color of its
            geographic country (Corsica/Sardinia green with Italy; Gotland salmon with Scandinavia;
            Ireland blue with UK; etc.). godip's SVG uses generic Path-X-Y ids so we identify by
            position too. */}
          {data.decorativeRegions?.map((region, index) => {
            const fill = decorativeRegionFill(region.id, region.d);
            return (
              <path
                key={`decor-${region.id || index}`}
                d={region.d}
                fill={fill}
                stroke="#000"
                strokeWidth={1}
                filter={toggles.watercolor ? 'url(#watercolor)' : undefined}
              />
            );
          })}

          {/* Province fills with per-power colors + watercolor variation + pure-black stroke */}
          {data.provinces.map((province) => {
            const colors = POWER_COLORS[getProvinceOwner(province.id)];
            return (
              <path
                key={province.id}
                id={province.id}
                d={province.d}
                fill={colors.fill}
                stroke="#000"
                strokeWidth={1}
                strokeLinejoin="round"
                filter={toggles.watercolor ? 'url(#watercolor)' : undefined}
                onMouseEnter={() => setHoveredId(province.id)}
                onMouseLeave={() =>
                  setHoveredId((current) => (current === province.id ? null : current))
                }
                style={{ cursor: 'pointer', pointerEvents: 'all' }}
              />
            );
          })}

          {/* Coastal vignette — godip ships a pre-computed coast-only path (`id="Shape"`) with a
            Gaussian blur. Clipped to water provinces so the blur only paints onto the sea side,
            giving a dark watercolor halo along coasts visible in the water. */}
          {toggles.vignette && data.coastShadow && (
            <g clipPath="url(#water-clip)">
              <path
                d={data.coastShadow}
                fill="none"
                stroke="#000"
                strokeWidth={4}
                filter="url(#coast-vignette)"
              />
            </g>
          )}

          {/* Decorative border overlay from godip's foreground layer */}
          {toggles.decorations && (
            <g fill="none" stroke="#000" strokeWidth={1} strokeLinejoin="round">
              {data.borders.map((border, index) => (
                <path key={`border-${index}`} d={border.d} />
              ))}
            </g>
          )}

          {/* Hover highlight (province) — inside the godip clip so the province's native edge
            strokes at the viewBox boundary are cleanly cut off (no double-line against the
            extension polygon, no bleed into the frame). Top-left corner may read slightly cropped
            but that's the accepted tradeoff. */}
          {hoveredId &&
            (() => {
              const prov = data.provinces.find((p) => p.id === hoveredId);
              if (!prov) {
                return null;
              }
              return (
                <path
                  d={prov.d}
                  fill="rgba(255, 255, 255, 0.35)"
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  pointerEvents="none"
                />
              );
            })()}
        </g>
        {/* End godip-content-clip group */}

        {/* Hand-authored extensions of godip lines into the extension area so coasts/convoys don't
            dead-end abruptly at the clip boundary.
             - Left (sea): convoy curve continuing west from the Ireland dead-end at (0, 709).
             - Left-bottom (coast): NAf SW coast continuing down-and-left from its clipped end
               at ~(3, 1331), curving into the ocean toward the frame corner. */}
        {toggles.decorations && (
          <>
            {/* NAf land fill continuation — closes the coast curve back to the clip edge so the
                peach land shows through the SW extension sliver, not water. */}
            <path
              d="M 3 1331 C -2 1335 -5 1340 -8 1344 S -12 1349 -10 1352 L -10 1354 L 3 1354 Z"
              fill={POWER_COLORS.neutral.fill}
            />
            <g fill="none" stroke="#000" strokeWidth={1} strokeLinecap="round">
              <path d="M 3 709.8 C -40 716 -110 732 -180 745 S -300 758 -523 764" />
              <path d="M 3 1331 C -2 1335 -5 1340 -8 1344 S -12 1349 -10 1352" />
            </g>
          </>
        )}

        {/* Hover highlight (extension) — rendered AFTER the hand-authored black extensions so the
            white stroke covers the black convoy/coast lines when the adjacent sea is hovered.
            Fill and stroke are separate so the stroke skips the shared x=3 edge. */}
        {hoveredId && HOVER_EXTENSIONS[hoveredId] && (
          <g pointerEvents="none">
            <path
              d={HOVER_EXTENSIONS[hoveredId].fill}
              fill="rgba(255, 255, 255, 0.35)"
              stroke="none"
            />
            <path
              d={HOVER_EXTENSIONS[hoveredId].stroke}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Paper noise overlay — outside the godip clip so the extension area gets the same
            paper texture as godip's water, keeping the two reads as one continuous board. */}
        {toggles.noise && data.noise && (
          <rect
            x={-MAP_EXTENSION_LEFT}
            y={-MAP_EXTENSION_Y}
            width={data.width + MAP_EXTENSION_X}
            height={data.height + 2 * MAP_EXTENSION_Y}
            fill="url(#paper-noise)"
            opacity={0.025}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* Diplomacy script logo — top-left over the Atlantic, Great Vibes cursive to match the
            Avalon Hill 50th-anniversary Deluxe board aesthetic. */}
        <text
          x={-450}
          y={180}
          fontSize={150}
          fontFamily="'Great Vibes', cursive"
          fill="#2a1a0a"
          filter="url(#logo-shadow)"
          style={{ userSelect: 'none' }}
        >
          Diplomacy
        </text>

        {/* Supply centers: black fill, gold/yellow border (flat — matches physical board) */}
        {toggles.stars &&
          data.supplyCenters.map((sc) => (
            <polygon
              key={`sc-${sc.id}`}
              points={starPoints(sc.x, sc.y, 9, 3.8)}
              fill="#0f0a04"
              stroke="#d4a846"
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
          ))}

        {/* Synthesized country name labels rendered FIRST so province labels paint on top where they overlap. */}
        {toggles.countryLabels &&
          (Object.keys(COUNTRY_LABEL_TEXT) as Array<keyof typeof COUNTRY_LABEL_TEXT>).map(
            (power) => {
              const spec = COUNTRY_LABEL_POSITIONS[power];
              return (
                <text
                  key={`country-${power}`}
                  x={spec.x}
                  y={spec.y}
                  textAnchor="middle"
                  fontSize={spec.fontSize}
                  fontFamily="'Merriweather Variable', serif"
                  fontStyle="italic"
                  fontWeight={700}
                  letterSpacing={spec.letterSpacing}
                  fill="#0a0804"
                  stroke="#f8f1dc"
                  strokeWidth={4}
                  strokeLinejoin="round"
                  strokeOpacity={0.85}
                  paintOrder="stroke"
                  style={{ userSelect: 'none' }}
                >
                  {COUNTRY_LABEL_TEXT[power]}
                </text>
              );
            },
          )}

        {/* Labels — three visual tiers: country (bold caps + halo), province (white caps), sea (dark italic). Rotation preserved per godip's SVG. */}
        {data.labels.map((label, index) => {
          const kind = classifyLabel(label);
          if (kind === 'skip') {
            return null;
          }
          if (kind === 'country' && !toggles.countryLabels) {
            return null;
          }
          if (kind === 'sea' && !toggles.seaLabels) {
            return null;
          }
          if (kind === 'province' && !toggles.provinceLabels) {
            return null;
          }
          // Preserve godip's rotation — labels designed with rotation; baking out breaks positions.
          const rotationAttr = label.rotation ? `rotate(${label.rotation})` : undefined;

          if (kind === 'country') {
            return (
              <text
                key={`label-${index}`}
                transform={rotationAttr}
                fontSize={label.fontSize * 1.6}
                fontFamily="'Merriweather Variable', serif"
                fontWeight={700}
                letterSpacing={4}
                fill="#1a0f08"
                stroke="#f5ead0"
                strokeWidth={5}
                strokeLinejoin="round"
                paintOrder="stroke"
                style={{ userSelect: 'none' }}
              >
                <tspan x={label.x} y={label.y}>
                  {label.text.toUpperCase()}
                </tspan>
              </text>
            );
          }

          if (kind === 'sea') {
            return (
              <text
                key={`label-${index}`}
                transform={rotationAttr}
                fontSize={label.fontSize * 1.3}
                fontFamily="'Merriweather Variable', serif"
                fontStyle="italic"
                letterSpacing={label.letterSpacing}
                fill="#1a1210"
                style={{ userSelect: 'none' }}
              >
                <tspan x={label.x} y={label.y}>
                  {prettifySeaText(label.text)}
                </tspan>
              </text>
            );
          }

          const upper = label.text.toUpperCase();
          const first = upper.charAt(0);
          const rest = upper.slice(1);
          const baseSize = label.fontSize * 0.75;
          return (
            <text
              key={`label-${index}`}
              transform={rotationAttr}
              fontSize={baseSize}
              fontFamily="'Merriweather Variable', serif"
              fontStyle="italic"
              fontWeight={500}
              letterSpacing={0.5}
              fill="#ffffff"
              stroke="#0a0804"
              strokeWidth={1.6}
              strokeLinejoin="round"
              paintOrder="stroke"
              style={{ userSelect: 'none' }}
            >
              <tspan x={label.x} y={label.y}>
                <tspan fontSize={baseSize * 1.2}>{first}</tspan>
                {rest}
              </tspan>
            </text>
          );
        })}

        {/* Switzerland label — godip's data lacks it; Deluxe always labels this impassable region. */}
        {toggles.impassableLabel && (
          <>
            <text
              x={755}
              y={1035}
              textAnchor="middle"
              fontSize={13}
              fontFamily="'Merriweather Variable', serif"
              fontWeight={600}
              letterSpacing={1}
              fill="#2a1f14"
              style={{ userSelect: 'none' }}
            >
              SWITZERLAND
            </text>
            <text
              x={755}
              y={1049}
              textAnchor="middle"
              fontSize={10}
              fontFamily="'Merriweather Variable', serif"
              fontStyle="italic"
              fill="#2a1f14"
              style={{ userSelect: 'none' }}
            >
              (impassable)
            </text>
          </>
        )}
      </svg>
    </div>
  );
}
