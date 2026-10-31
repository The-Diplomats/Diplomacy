import supertest from 'supertest';
import { describe, expect, test } from 'vitest';

import { createApp } from './app.js';

describe('backend app', () => {
  test('GET /api/health returns ok', async () => {
    const app = createApp();
    const response = await supertest(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.uptime).toBe('number');
  });
});
