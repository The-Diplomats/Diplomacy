import { createContext, useContext } from 'react';

export const ThemedPortalContext = createContext<HTMLElement | null>(null);

export function useThemedPortalContainer() {
  return useContext(ThemedPortalContext);
}
