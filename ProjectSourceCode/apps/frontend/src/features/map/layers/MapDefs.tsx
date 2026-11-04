import {
  HOVER_EXTENSIONS,
  MAP_EXTENSION_LEFT,
  MAP_EXTENSION_X,
  MAP_EXTENSION_Y,
} from '../constants.ts';
import { useMap } from '../hooks/useMap.ts';
import { getProvinceOwner } from '../powers.ts';

// All SVG <defs> used by the map: filters, clip paths, gradients, patterns.
export function MapDefs() {
  const { data } = useMap();
  return (
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

      {/* Coast vignette filter — godip's source (filter848): Gaussian blur on a coast path.
          Use userSpaceOnUse so short paths (our NAf SW extension) get enough bleed room for
          the 5.76 stdDev blur — percentage-based padding is too tight for small bboxes. */}
      <filter
        id="coast-vignette"
        filterUnits="userSpaceOnUse"
        x={-MAP_EXTENSION_LEFT}
        y={-MAP_EXTENSION_Y}
        width={data.width + MAP_EXTENSION_X}
        height={data.height + 2 * MAP_EXTENSION_Y}
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur stdDeviation="6" />
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
        {/* Include the hand-authored Atlantic extension polygons so the vignette has water
            to paint onto west of godip's edge (around the NAf SW coast extension). */}
        <path d={HOVER_EXTENSIONS.nat!.fill} />
        <path d={HOVER_EXTENSIONS.mid!.fill} />
      </clipPath>

      {/* Land-only clip: union of all non-water provinces + decorative landmasses. Used to
          clip the country-label halos so the lightening stays on land. */}
      <clipPath id="land-clip">
        {data.provinces
          .filter((p) => p.id.includes('/') === false && getProvinceOwner(p.id) !== 'water')
          .map((p) => (
            <path key={`land-clip-${p.id}`} d={p.d} />
          ))}
        {data.decorativeRegions?.map((r, i) => (
          <path key={`land-clip-decor-${i}`} d={r.d} />
        ))}
      </clipPath>

      {/* Soft white radial halo behind country labels — lightens the land color beneath the
          text without a hard border. */}
      <radialGradient id="country-halo">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
        <stop offset="65%" stopColor="#ffffff" stopOpacity="0.15" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </radialGradient>

      {/* Soft drop shadow for the Diplomacy script logo — gives embossed depth. */}
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

      {/* Clip godip content to slightly-inset of its native viewBox so edge-touching province
          strokes don't form a visible rectangle. */}
      <clipPath id="godip-content-clip">
        <rect x={3} y={3} width={data.width - 6} height={data.height - 6} />
      </clipPath>
    </defs>
  );
}
