import { useMap } from '../hooks/useMap.ts';

// Coastal vignette — godip ships a pre-computed coast-only path (`id="Shape"`) with a Gaussian
// blur. Clipped to water provinces (incl. hand-authored Atlantic extensions) so the blur paints
// onto the sea side of every coast, including our NAf SW extension.
export function Vignette() {
  const { data, toggles } = useMap();
  if (!toggles.vignette || !data.coastShadow) {
    return null;
  }
  return (
    <g clipPath="url(#water-clip)">
      <path
        d={data.coastShadow}
        fill="none"
        stroke="#000"
        strokeWidth={5}
        filter="url(#coast-vignette)"
      />
      {/* NAf SW extension coast — same blur, same clip. */}
      <path
        d="M 3 1331 C -2 1335 -5 1340 -8 1344 S -12 1349 -10 1352"
        fill="none"
        stroke="#000"
        strokeWidth={5}
        filter="url(#coast-vignette)"
      />
    </g>
  );
}
