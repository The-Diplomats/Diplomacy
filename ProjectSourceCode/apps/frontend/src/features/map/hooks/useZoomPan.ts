import { useEffect, useRef, useState } from 'react';

import { KEY_ZOOM_STEP, MAX_ZOOM, MIN_ZOOM, WHEEL_ZOOM_SPEED } from '../constants.ts';

export type ZoomPan = {
  zoom: number;
  pan: { x: number; y: number };
  isDragging: boolean;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  onWheel: (e: React.WheelEvent) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
};

// Wheel + Ctrl/Cmd keys zoom the map; drag pans when zoomed in. Pan is clamped so the transformed
// map's edges can't go inside the viewport — the frame + black bars stay at the bounds.
export function useZoomPan(): ZoomPan {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  const clampPan = (p: { x: number; y: number }, z: number) => {
    const el = viewportRef.current;
    if (!el) {
      return p;
    }
    const maxX = (el.clientWidth * (z - 1)) / 2;
    const maxY = (el.clientHeight * (z - 1)) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, p.x)),
      y: Math.max(-maxY, Math.min(maxY, p.y)),
    };
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) {
        return;
      }
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        setZoom((z) => {
          const next = Math.min(MAX_ZOOM, z * KEY_ZOOM_STEP);
          setPan((p) => clampPan(p, next));
          return next;
        });
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        setZoom((z) => {
          const next = Math.max(MIN_ZOOM, z / KEY_ZOOM_STEP);
          setPan((p) => clampPan(p, next));
          return next;
        });
      } else if (e.key === '0') {
        e.preventDefault();
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const el = viewportRef.current;
    if (!el) {
      return;
    }
    const rect = el.getBoundingClientRect();
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;
    const factor = Math.exp(-e.deltaY * WHEEL_ZOOM_SPEED);
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * factor));
    const ratio = nextZoom / zoom;
    const nextPan = { x: cx - (cx - pan.x) * ratio, y: cy - (cy - pan.y) * ratio };
    setZoom(nextZoom);
    setPan(clampPan(nextPan, nextZoom));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) {
      return;
    }
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    viewportRef.current?.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging) {
      return;
    }
    const next = {
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    };
    setPan(clampPan(next, zoom));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    viewportRef.current?.releasePointerCapture(e.pointerId);
  };

  return { zoom, pan, isDragging, viewportRef, onWheel, onPointerDown, onPointerMove, onPointerUp };
}
