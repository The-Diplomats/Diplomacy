import { useState } from 'react';

import { MAP_EXTENSION_LEFT, MAP_EXTENSION_X, MAP_EXTENSION_Y } from './constants.ts';
import { useLayerToggles } from './hooks/useLayerToggles.ts';
import type { ZoomPan } from './hooks/useZoomPan.ts';
import { MapBoard } from './MapBoard.tsx';
import { MapProvider } from './MapContext.tsx';
import { useMapData } from './useMapData.ts';

type Props = {
  zoomPan: ZoomPan;
  onSelectProvince?: (id: string) => void;
  selectedProvinceId?: string | null;
};

export function MapCanvas({ zoomPan, onSelectProvince, selectedProvinceId }: Props) {
  const { data } = useMapData();
  const toggles = useLayerToggles();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [internalSelected, setInternalSelected] = useState<string | null>(null);

  if (!data) {
    return null;
  }

  const isControlled = selectedProvinceId !== undefined;
  const selected = isControlled ? selectedProvinceId : internalSelected;

  const handleClick = (id: string) => {
    if (!isControlled) {
      setInternalSelected(id);
    }
    onSelectProvince?.(id);
  };

  // Selected province gets the hover treatment too; gives a persistent highlight until the
  // player clicks elsewhere. HUD will replace this with its own treatment later.
  const activeHoverId = hoveredId ?? selected;

  const cursor = zoomPan.zoom > 1 ? (zoomPan.isDragging ? 'grabbing' : 'grab') : 'default';

  return (
    <div
      ref={zoomPan.viewportRef}
      className="absolute inset-0 z-0 overflow-hidden bg-black"
      onPointerDown={zoomPan.onPointerDown}
      onPointerMove={zoomPan.onPointerMove}
      onPointerUp={zoomPan.onPointerUp}
      onPointerCancel={zoomPan.onPointerUp}
      style={{ cursor, touchAction: 'none', contain: 'paint', isolation: 'isolate' }}
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
            <MapBoard
              hoveredId={activeHoverId}
              onHoverEnter={setHoveredId}
              onHoverLeave={(id) => setHoveredId((current) => (current === id ? null : current))}
              onClickProvince={handleClick}
            />
          </MapProvider>
        </svg>
      </div>
    </div>
  );
}
