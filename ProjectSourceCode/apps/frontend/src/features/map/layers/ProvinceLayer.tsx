import { decorativeRegionFill, starPoints } from '../decorations.ts';
import { useMap } from '../hooks/useMap.ts';
import { getProvinceOwner, POWER_COLORS, SC_POSITION_OVERRIDES } from '../powers.ts';

type Props = {
  onHoverEnter: (id: string) => void;
  onHoverLeave: (id: string) => void;
};

// Inside godip's content clip: impassables, decorative landmasses, supplemental vignettes for
// province gaps (con/den/kie), province fills (with hover handlers), and foreground borders.
export function ProvinceLayer({ onHoverEnter, onHoverLeave }: Props) {
  const { data, toggles } = useMap();
  return (
    <>
      {/* Impassables (Switzerland shape from background layer — neutral terracotta per Deluxe). */}
      {data.impassables.map((impassable, index) => (
        <path
          key={`impassable-${index}`}
          d={impassable.d}
          fill={POWER_COLORS.neutral.fill}
          stroke="#000"
          strokeWidth={1}
        />
      ))}

      {/* Decorative non-province landmasses. Deluxe paints each one to match its geographic
          neighbor's power (Corsica/Sardinia green with Italy; Ireland blue with UK; etc.). */}
      {data.decorativeRegions.map((region, index) => {
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

      {/* Supplemental coast vignette for provinces godip's Shape path misses: Constantinople
          (Marmara is a HOLE in con's path), Denmark (3 islands), Kiel canal. Rendered BEFORE
          province fills so the opaque fills mask the land-side blur; the water-side stays visible. */}
      {toggles.vignette && (
        <g>
          {['con', 'den', 'kie'].map((id) => {
            const prov = data.provinces.find((p) => p.id === id);
            if (!prov) {
              return null;
            }
            return (
              <path
                key={`vignette-prov-${id}`}
                d={prov.d}
                fill="none"
                stroke="#000"
                strokeWidth={5}
                filter="url(#coast-vignette)"
              />
            );
          })}
        </g>
      )}

      {/* Province fills with per-power colors + watercolor filter + pure-black stroke.
          Coast variants (`foo/bar`) are skipped — the base path covers the whole shape. */}
      {data.provinces
        .filter((province) => !province.id.includes('/'))
        .map((province) => {
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
              onMouseEnter={() => onHoverEnter(province.id)}
              onMouseLeave={() => onHoverLeave(province.id)}
              style={{ cursor: 'pointer', pointerEvents: 'all' }}
            />
          );
        })}

      {/* Decorative border overlay from godip's foreground layer. */}
      {toggles.decorations && (
        <g fill="none" stroke="#000" strokeWidth={1} strokeLinejoin="round">
          {data.borders.map((border, index) => (
            <path key={`border-${index}`} d={border.d} />
          ))}
        </g>
      )}
    </>
  );
}

// Supply center stars — rendered outside the godip clip so they can overlap edge insets cleanly.
export function SupplyCenterStars() {
  const { data, toggles } = useMap();
  if (!toggles.stars) {
    return null;
  }
  return (
    <>
      {data.supplyCenters.map((sc) => {
        const override = SC_POSITION_OVERRIDES[sc.id];
        const cx = override ? override.x : sc.x;
        const cy = override ? override.y : sc.y;
        return (
          <polygon
            key={`sc-${sc.id}`}
            points={starPoints(cx, cy, 7, 3)}
            fill="#0f0a04"
            stroke="#e2b85c"
            strokeWidth={1.6}
            strokeLinejoin="miter"
          />
        );
      })}
    </>
  );
}
