import { useQuery } from '@tanstack/react-query';

import type { MapData } from './types.ts';

/**
 * Fetches the classical map data from the server instead of importing it directly,
 * mainly to keep bundle size small.
 */
export function useMapData() {
  return useQuery<MapData>({
    queryKey: ['map', 'classical'],
    queryFn: () => fetch('/maps/classical.json').then((response) => response.json()),
    staleTime: Infinity,
  });
}
