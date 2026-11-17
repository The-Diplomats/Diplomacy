import { useSyncExternalStore } from 'react';

import { ApiError } from '../../api/client';

let unavailable = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Wired into the QueryClient's caches so any 503 from the API switches the app to the maintenance screen. */
export function reportIfUnavailable(error: unknown): void {
  if (unavailable || !(error instanceof ApiError) || error.status !== 503) {
    return;
  }
  unavailable = true;
  listeners.forEach((listener) => listener());
}

export function useServiceUnavailable(): boolean {
  return useSyncExternalStore(subscribe, () => unavailable);
}
