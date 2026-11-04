import { GRATICULE_LATITUDES, GRATICULE_LONGITUDES } from '../graticule.ts';
import { useMap } from '../hooks/useMap.ts';

// Faint latitude/longitude grid clipped to water-only — paints on top of water province fills
// but stays off land and off the frame (water-clip is the union of water provinces + hand-
// authored Atlantic extensions, which naturally excludes both land and the frame area).
export function Graticule() {
  const { toggles } = useMap();
  if (!toggles.graticule) {
    return null;
  }
  return (
    <g
      clipPath="url(#water-clip)"
      fill="none"
      stroke="#1a1a2e"
      strokeWidth={0.8}
      strokeOpacity={0.2}
      pointerEvents="none"
    >
      {GRATICULE_LATITUDES.map((d, i) => (
        <path key={`lat-${i}`} d={d} />
      ))}
      {GRATICULE_LONGITUDES.map((d, i) => (
        <path key={`lon-${i}`} d={d} />
      ))}
    </g>
  );
}
