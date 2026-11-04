import {
  FRAME_EDGE_COLOR,
  FRAME_EDGE_THICK,
  FRAME_GOLD_THICK,
  FRAME_MIDDLE_COLOR,
  MAP_EXTENSION_LEFT,
  MAP_EXTENSION_X,
  MAP_EXTENSION_Y,
} from '../constants.ts';
import { useMap } from '../hooks/useMap.ts';
import { POWER_COLORS } from '../powers.ts';

// Deluxe sandwich frame + inner-water rect that sits behind godip's content.
export function MapFrame() {
  const { data, toggles } = useMap();
  const fullW = data.width + MAP_EXTENSION_X;
  const fullH = data.height + 2 * MAP_EXTENSION_Y;
  const x0 = -MAP_EXTENSION_LEFT;
  const y0 = -MAP_EXTENSION_Y;
  return (
    <>
      {/* Base water fill — extends across full extended viewBox (behind the frame itself). */}
      <rect x={x0} y={y0} width={fullW} height={fullH} fill={POWER_COLORS.water.fill} />

      {/* Outer darker-gold edge — fills the whole frame area. */}
      <rect x={x0} y={y0} width={fullW} height={fullH} fill={FRAME_EDGE_COLOR} />
      {/* Lighter gold middle — inset by outer edge thickness. */}
      <rect
        x={x0 + FRAME_EDGE_THICK}
        y={y0 + FRAME_EDGE_THICK}
        width={fullW - 2 * FRAME_EDGE_THICK}
        height={fullH - 2 * FRAME_EDGE_THICK}
        fill={FRAME_MIDDLE_COLOR}
      />
      {/* Cardboard fiber texture — paper noise cranked up only on the frame. */}
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
      {/* Inner dark cardboard edge — filled rect so visible thickness matches outer. */}
      <rect
        x={x0 + FRAME_EDGE_THICK + FRAME_GOLD_THICK}
        y={y0 + FRAME_EDGE_THICK + FRAME_GOLD_THICK}
        width={fullW - 2 * (FRAME_EDGE_THICK + FRAME_GOLD_THICK)}
        height={fullH - 2 * (FRAME_EDGE_THICK + FRAME_GOLD_THICK)}
        fill={FRAME_EDGE_COLOR}
      />
      {/* Inner water (map area); watercolor filter matches sea-province variation so the
          extension water reads the same as godip's sea provinces. */}
      <rect
        x={x0 + 2 * FRAME_EDGE_THICK + FRAME_GOLD_THICK}
        y={y0 + 2 * FRAME_EDGE_THICK + FRAME_GOLD_THICK}
        width={fullW - 2 * (2 * FRAME_EDGE_THICK + FRAME_GOLD_THICK)}
        height={fullH - 2 * (2 * FRAME_EDGE_THICK + FRAME_GOLD_THICK)}
        fill={POWER_COLORS.water.fill}
        filter={toggles.watercolor ? 'url(#watercolor)' : undefined}
      />

      {/* 45° miter joints — only drawn across the LIGHTER gold middle band (not the dark cardboard
          edges on either side), reading as a shadow in the center of the frame. */}
      {(() => {
        const inner = FRAME_EDGE_THICK; // outer edge of the gold middle band
        const outer = FRAME_EDGE_THICK + FRAME_GOLD_THICK; // inner edge of the gold middle band
        return (
          <g stroke="#3d2b15" strokeWidth={1} strokeLinecap="square" opacity={0.75}>
            {/* top-left */}
            <line x1={x0 + inner} y1={y0 + inner} x2={x0 + outer} y2={y0 + outer} />
            {/* top-right */}
            <line x1={x0 + fullW - inner} y1={y0 + inner} x2={x0 + fullW - outer} y2={y0 + outer} />
            {/* bottom-left */}
            <line x1={x0 + inner} y1={y0 + fullH - inner} x2={x0 + outer} y2={y0 + fullH - outer} />
            {/* bottom-right */}
            <line
              x1={x0 + fullW - inner}
              y1={y0 + fullH - inner}
              x2={x0 + fullW - outer}
              y2={y0 + fullH - outer}
            />
          </g>
        );
      })()}
    </>
  );
}
