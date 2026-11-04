import { useMap } from '../hooks/useMap.ts';
import { classifyLabel, prettifySeaText } from '../labels.ts';
import {
  COUNTRY_LABEL_POSITIONS,
  COUNTRY_LABEL_TEXT,
  PROVINCE_LABEL_OVERRIDES,
  provinceIdFromLabel,
} from '../powers.ts';

// Country-label soft halos — land-clipped so the lightening never bleeds onto sea.
export function CountryLabelHalos() {
  const { toggles } = useMap();
  if (!toggles.countryLabels) {
    return null;
  }
  return (
    <g clipPath="url(#land-clip)" pointerEvents="none">
      {(Object.keys(COUNTRY_LABEL_TEXT) as Array<keyof typeof COUNTRY_LABEL_TEXT>).map((power) => {
        const spec = COUNTRY_LABEL_POSITIONS[power];
        const text = COUNTRY_LABEL_TEXT[power];
        const textWidth =
          text.length * spec.fontSize * 0.55 + (text.length - 1) * spec.letterSpacing;
        return (
          <ellipse
            key={`halo-${power}`}
            cx={spec.x}
            cy={spec.y - spec.fontSize * 0.3}
            rx={textWidth * 1.2}
            ry={spec.fontSize * 2.8}
            fill="url(#country-halo)"
          />
        );
      })}
    </g>
  );
}

// Synthesized country name labels (ENGLAND, FRANCE, etc.). godip's data lacks country-level
// labels so we synthesize them at hand-authored positions.
export function CountryLabels() {
  const { toggles } = useMap();
  if (!toggles.countryLabels) {
    return null;
  }
  return (
    <>
      {(Object.keys(COUNTRY_LABEL_TEXT) as Array<keyof typeof COUNTRY_LABEL_TEXT>).map((power) => {
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
            style={{ userSelect: 'none' }}
          >
            {COUNTRY_LABEL_TEXT[power]}
          </text>
        );
      })}
    </>
  );
}

// Labels from godip's SVG `names` layer — classified into country / sea / province / skip.
// Province labels honor PROVINCE_LABEL_OVERRIDES for horizontal, hand-placed positioning.
export function GodipLabels() {
  const { data, toggles } = useMap();
  return (
    <>
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

        // Province label: if a hand-authored override exists for this province, render
        // horizontal (no rotation) at the override position with a consistent font size.
        const upper = label.text.toUpperCase();
        const first = upper.charAt(0);
        const rest = upper.slice(1);
        const provId = provinceIdFromLabel(label.text);
        const override = provId ? PROVINCE_LABEL_OVERRIDES[provId] : undefined;
        const baseSize = override ? 10 : label.fontSize * 0.75;
        const labelX = override ? override.x : label.x;
        const labelY = override ? override.y : label.y;
        const effectiveRotation = override ? undefined : rotationAttr;
        const effectiveAnchor = override ? 'middle' : undefined;
        return (
          <text
            key={`label-${index}`}
            transform={effectiveRotation}
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
            textAnchor={effectiveAnchor}
            style={{ userSelect: 'none' }}
          >
            <tspan x={labelX} y={labelY}>
              <tspan fontSize={baseSize * 1.2}>{first}</tspan>
              {rest}
            </tspan>
          </text>
        );
      })}
    </>
  );
}

// Switzerland label — godip's data lacks it; styled to match province labels (white italic
// Merriweather with first-letter small-caps and dark outline), with the Deluxe "(impassable)"
// qualifier beneath.
export function SwitzerlandLabel() {
  const { toggles } = useMap();
  if (!toggles.impassableLabel) {
    return null;
  }
  const text = 'SWITZERLAND';
  const baseSize = 10;
  return (
    <>
      <text
        x={578}
        y={918}
        textAnchor="middle"
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
        <tspan fontSize={baseSize * 1.2}>{text.charAt(0)}</tspan>
        {text.slice(1)}
      </text>
      <text
        x={578}
        y={931}
        textAnchor="middle"
        fontSize={baseSize * 0.75}
        fontFamily="'Merriweather Variable', serif"
        fontStyle="italic"
        fontWeight={500}
        fill="#ffffff"
        stroke="#0a0804"
        strokeWidth={1.4}
        strokeLinejoin="round"
        paintOrder="stroke"
        style={{ userSelect: 'none' }}
      >
        (impassable)
      </text>
    </>
  );
}
