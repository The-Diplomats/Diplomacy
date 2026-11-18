import { expect, test } from '@playwright/test';

import { apiUrl } from './env';

test('the API answers its health check', { tag: '@smoke' }, async ({ request }) => {
  const response = await request.get(`${apiUrl}/health`);

  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ status: 'ok' });
});

test('a deep link loads the app', { tag: '@smoke' }, async ({ page }) => {
  await page.goto('/auth/login');

  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
});
