import { createContext, type ReactNode } from 'react';

import type { LayerToggles } from './hooks/useLayerToggles.ts';
import type { MapData } from './types.ts';

export type MapContextValue = {
  data: MapData;
  toggles: LayerToggles;
};

// eslint-disable-next-line react-refresh/only-export-components -- context + Provider ship together
export const MapContext = createContext<MapContextValue | null>(null);

export function MapProvider({
  data,
  toggles,
  children,
}: {
  data: MapData;
  toggles: LayerToggles;
  children: ReactNode;
}) {
  return <MapContext.Provider value={{ data, toggles }}>{children}</MapContext.Provider>;
}
