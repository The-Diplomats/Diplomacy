import { useLocation, useSearchParams } from 'react-router';

/** Post-auth redirect target read from `?next=`, defaulting to the lobby. */
export function useNextPath(): string {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const next = searchParams.get('next');
  if (next?.startsWith('/') && !next.startsWith('//')) {
    return next;
  }
  return '/lobby' + (location.hash ?? '');
}
