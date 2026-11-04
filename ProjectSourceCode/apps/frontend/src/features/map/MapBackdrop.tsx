import { useState } from 'react';
import { useLocation } from 'react-router';

import { MAP_EXTENSION_LEFT, MAP_EXTENSION_X, MAP_EXTENSION_Y } from './constants.ts';
import { useLayerToggles } from './hooks/useLayerToggles.ts';
import { useZoomPan } from './hooks/useZoomPan.ts';
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
import { MapProvider } from './MapContext.tsx';
import { useMapData } from './useMapData.ts';

export function MapBackdrop() {
  const { data } = useMapData();
  const location = useLocation();
  const toggles = useLayerToggles();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const zoomPan = useZoomPan();
  const isGameRoute = location.pathname.startsWith('/game/');

  if (isGameRoute || !data) {
    return null;
  }

  const cursor = zoomPan.zoom > 1 ? (zoomPan.isDragging ? 'grabbing' : 'grab') : 'default';

  return (
    <div
      ref={zoomPan.viewportRef}
      className="fixed inset-0 z-0 overflow-hidden bg-black"
      onWheel={zoomPan.onWheel}
      onPointerDown={zoomPan.onPointerDown}
      onPointerMove={zoomPan.onPointerMove}
      onPointerUp={zoomPan.onPointerUp}
      onPointerCancel={zoomPan.onPointerUp}
      style={{ cursor, touchAction: 'none' }}
    >
      <div
        className="h-full w-full"
        style={{
          transform: `translate(${zoomPan.pan.x}px, ${zoomPan.pan.y}px) scale(${zoomPan.zoom})`,
          transformOrigin: 'center center',
          willChange: 'transform',
        }}
      >
        <svg
          viewBox={`${-MAP_EXTENSION_LEFT} ${-MAP_EXTENSION_Y} ${data.width + MAP_EXTENSION_X} ${data.height + 2 * MAP_EXTENSION_Y}`}
          preserveAspectRatio="xMidYMid meet"
          className="h-full w-full"
          style={{ pointerEvents: 'none' }}
        >
          <MapProvider data={data} toggles={toggles}>
            <MapDefs />
            <MapFrame />
            <g clipPath="url(#godip-content-clip)">
              <ProvinceLayer
                onHoverEnter={setHoveredId}
                onHoverLeave={(id) => setHoveredId((current) => (current === id ? null : current))}
              />
              <HoverProvinceHighlight hoveredId={hoveredId} />
            </g>
            <MapExtensions />
            <HoverExtensionHighlight hoveredId={hoveredId} />
            <Vignette />
            <PaperNoiseOverlay />
            <DiplomacyLogo />
            <SupplyCenterStars />
            <CountryLabelHalos />
            <CountryLabels />
            <GodipLabels />
            <SwitzerlandLabel />
          </MapProvider>
        </svg>
      </div>
    </div>
  );
}
