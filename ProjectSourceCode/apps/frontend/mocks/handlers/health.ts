import { http, HttpResponse } from 'msw';

const startedAt = Date.now();

export const healthHandler = http.get('/api/health', () =>
  HttpResponse.json({
    status: 'ok',
    uptime: Math.floor((Date.now() - startedAt) / 1000),
  }),
);
