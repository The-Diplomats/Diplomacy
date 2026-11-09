import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { useSession } from './useSession';

export function AuthGate({ children }: { children: ReactNode }) {
  const session = useSession();
  const location = useLocation();

  if (session.isPending) {
    return null;
  }

  if (!session.data) {
    const target = location.pathname + location.search + location.hash;
    return <Navigate to={`/auth/login?next=${encodeURIComponent(target)}`} replace />;
  }

  return <>{children}</>;
}
