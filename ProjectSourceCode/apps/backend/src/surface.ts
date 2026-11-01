export type DiplomacySurface = 'api' | 'admin' | 'dev' | 'unknown';

export function classifySurface(host: string | undefined): DiplomacySurface {
  if (!host) return 'unknown';
  const hostname = (host.split(':')[0] ?? '').toLowerCase();

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'dev';
  }

  if (!hostname.endsWith('.diplomacy.gg')) {
    return 'unknown';
  }

  const firstLabel = hostname.split('.')[0];
  if (firstLabel === 'api') return 'api';
  if (firstLabel === 'admin') return 'admin';
  return 'unknown';
}

export function extractForwardedHost(headers: {
  host?: string;
  'x-forwarded-host'?: string | string[];
}): string | undefined {
  const forwarded = headers['x-forwarded-host'];
  if (Array.isArray(forwarded)) return forwarded[0];
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim();
  return headers.host;
}
