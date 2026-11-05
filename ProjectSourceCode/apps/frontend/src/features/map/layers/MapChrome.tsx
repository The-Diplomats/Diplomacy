import { MAP_EXTENSION_LEFT, MAP_EXTENSION_X, MAP_EXTENSION_Y } from '../constants.ts';
import { useMap } from '../hooks/useMap.ts';
import { POWER_COLORS } from '../powers.ts';

// Chrome rendered OUTSIDE godip's content clip:
//   - Hand-authored extensions that continue godip's dead-end coasts/convoys into the extension
//   - Paper noise overlay (map-wide)
//   - Diplomacy script logo
// Order matters: hand-authored extensions sit under the vignette; paper noise goes on top of both.

export function MapExtensions() {
  const { toggles } = useMap();
  if (!toggles.decorations) {
    return null;
  }
  return (
    <>
      {/* NAf land fill continuation — closes the coast curve back to the clip edge so the peach
          land shows through the SW extension sliver, not water. */}
      <path
        d="M 3 1331 C -2 1335 -5 1340 -8 1344 S -12 1349 -10 1352 L -10 1354 L 3 1354 Z"
        fill={POWER_COLORS.neutral.fill}
      />
      <g fill="none" stroke="#000" strokeWidth={1} strokeLinecap="round">
        {/* Left (sea): convoy curve continuing west from the Ireland dead-end at (0, 709). */}
        <path d="M 3 709.8 C -40 716 -110 732 -180 745 S -300 758 -523 764" />
        {/* Left-bottom (coast): NAf SW coast continuing down-and-left from clipped end at (3, 1331). */}
        <path d="M 3 1331 C -2 1335 -5 1340 -8 1344 S -12 1349 -10 1352" />
      </g>
    </>
  );
}

export function PaperNoiseOverlay() {
  const { data, toggles } = useMap();
  if (!toggles.noise || !data.noise) {
    return null;
  }
  return (
    <rect
      x={-MAP_EXTENSION_LEFT}
      y={-MAP_EXTENSION_Y}
      width={data.width + MAP_EXTENSION_X}
      height={data.height + 2 * MAP_EXTENSION_Y}
      fill="url(#paper-noise)"
      opacity={0.025}
      style={{ pointerEvents: 'none' }}
    />
  );
}

export function DiplomacyLogo() {
  return (
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
  );
}
