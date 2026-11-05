import { useState } from 'react';
import { useLocation } from 'react-router';

import { MAP_EXTENSION_LEFT, MAP_EXTENSION_X, MAP_EXTENSION_Y } from './constants.ts';
import { useLayerToggles } from './hooks/useLayerToggles.ts';
import { useZoomPan } from './hooks/useZoomPan.ts';
import { MapBoard } from './MapBoard.tsx';
import { MapProvider } from './MapContext.tsx';
import { useMapData } from './useMapData.ts';

// Fullscreen Deluxe-styled map backdrop for non-game pages (login, lobby, etc). Zoom + drag-pan
// via useZoomPan. Hidden on /game/* routes where MapCanvas takes over.
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
              hoveredId={hoveredId}
              onHoverEnter={setHoveredId}
              onHoverLeave={(id) => setHoveredId((current) => (current === id ? null : current))}
            />
          </MapProvider>
        </svg>
      </div>
    </div>
  );
}
