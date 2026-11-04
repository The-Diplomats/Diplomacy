import { HOVER_EXTENSIONS } from '../constants.ts';
import { useMap } from '../hooks/useMap.ts';

// Hover highlight for the hovered province. Rendered INSIDE the godip clip so the province's
// native edge strokes at the viewBox boundary are cleanly cut off (no double-line against the
// extension polygon, no bleed into the frame).
export function HoverProvinceHighlight({ hoveredId }: { hoveredId: string | null }) {
  const { data } = useMap();
  if (!hoveredId) {
    return null;
  }
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
}

// Hover highlight extension for sea provinces (NAt / MAt) — extends into the hand-authored
// Atlantic area. Rendered OUTSIDE the godip clip so the extension area shows through. Fill +
// stroke are separate so the stroke skips the shared x=3 edge (no double-line vs the province).
export function HoverExtensionHighlight({ hoveredId }: { hoveredId: string | null }) {
  if (!hoveredId || !HOVER_EXTENSIONS[hoveredId]) {
    return null;
  }
  const ext = HOVER_EXTENSIONS[hoveredId];
  return (
    <g pointerEvents="none">
      <path d={ext.fill} fill="rgba(255, 255, 255, 0.35)" stroke="none" />
      <path
        d={ext.stroke}
        fill="none"
        stroke="#ffffff"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </g>
  );
}
