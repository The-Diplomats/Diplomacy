import { Graticule } from './layers/Graticule.tsx';
import { HoverExtensionHighlight, HoverProvinceHighlight } from './layers/HoverOverlay.tsx';
import {
  CountryLabelHalos,
  CountryLabels,
  GodipLabels,
  SwitzerlandLabel,
} from './layers/LabelLayer.tsx';
import { DiplomacyLogo, MapExtensions, PaperNoiseOverlay } from './layers/MapChrome.tsx';
import { MapDefs } from './layers/MapDefs.tsx';
import { MapFrame } from './layers/MapFrame.tsx';
import { ProvinceLayer, SupplyCenterStars } from './layers/ProvinceLayer.tsx';
import { Vignette } from './layers/Vignette.tsx';

type Props = {
  hoveredId: string | null;
  onHoverEnter: (id: string) => void;
  onHoverLeave: (id: string) => void;
  onClickProvince?: (id: string) => void;
};

// Shared SVG composition for the Deluxe-styled Diplomacy board. Rendered by MapBackdrop (fullscreen
// non-game backdrop) and MapCanvas (interactive in-game view). Both wrappers provide their own
// outer container, zoom/pan, pointer-events setup, and MapProvider.
export function MapBoard({ hoveredId, onHoverEnter, onHoverLeave, onClickProvince }: Props) {
  return (
    <>
      <MapDefs />
      <MapFrame />
      <g clipPath="url(#godip-content-clip)">
        <ProvinceLayer
          onHoverEnter={onHoverEnter}
          onHoverLeave={onHoverLeave}
          onClickProvince={onClickProvince}
        />
        <HoverProvinceHighlight hoveredId={hoveredId} />
      </g>
      <MapExtensions />
      <Graticule />
      <HoverExtensionHighlight hoveredId={hoveredId} />
      <Vignette />
      <PaperNoiseOverlay />
      <DiplomacyLogo />
      <SupplyCenterStars />
      <CountryLabelHalos />
      <CountryLabels />
      <GodipLabels />
      <SwitzerlandLabel />
    </>
  );
}
