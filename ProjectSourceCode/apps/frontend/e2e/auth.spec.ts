import { expect, test } from '@playwright/test';

import { credentials } from './env';

test(
  'signs in, stays signed in across a reload, and signs out',
  { tag: '@smoke' },
  async ({ page }) => {
    const { identifier, password } = credentials();

    await page.goto('/auth/login');
    await page.getByLabel('Email or username').fill(identifier);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible();

    await page.goto('/auth/login');
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

    await page.goto('/lobby');
    await expect(page).toHaveURL(/\/auth\/login/);
  },
);
