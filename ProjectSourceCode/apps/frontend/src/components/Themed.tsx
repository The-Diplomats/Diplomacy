import { useTheme } from 'next-themes';
import { type ReactNode, useState } from 'react';

import { ThemedPortalContext } from './themed-portal-context';

// Applies the `.dark` class to a localized wrapper instead of <html>, so the theme cascade
// only walks this subtree. Keeps heavy SVG / canvas siblings out of style invalidation.
// Also hosts a portal container so Base UI primitives (popovers, dropdowns, dialogs) mount
// inside the themed subtree.
export function Themed({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  const [portal, setPortal] = useState<HTMLElement | null>(null);
  return (
    <div className={`${dark ? 'dark' : ''} text-foreground ${className}`.trim()}>
      <ThemedPortalContext.Provider value={portal}>{children}</ThemedPortalContext.Provider>
      <div ref={setPortal} className="pointer-events-auto" />
    </div>
  );
}
