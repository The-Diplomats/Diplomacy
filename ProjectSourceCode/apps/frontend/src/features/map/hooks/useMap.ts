import { useContext } from 'react';

import { MapContext, type MapContextValue } from '../MapContext.tsx';

export function useMap(): MapContextValue {
  const ctx = useContext(MapContext);
  if (!ctx) {
    throw new Error('useMap must be called inside a <MapProvider>');
  }
  return ctx;
}
