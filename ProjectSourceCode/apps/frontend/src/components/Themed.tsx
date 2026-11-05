import { useTheme } from 'next-themes';
import type { ReactNode } from 'react';

// Applies the `.dark` class to a localized wrapper instead of <html>, so the theme cascade
// only walks this subtree. Keeps heavy SVG / canvas siblings out of style invalidation.
export function Themed({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return (
    <div className={`${dark ? 'dark' : ''} text-foreground ${className}`.trim()}>{children}</div>
  );
}
