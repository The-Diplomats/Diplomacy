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
    </>
  );
}
