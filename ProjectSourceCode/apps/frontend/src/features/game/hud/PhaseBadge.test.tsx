import { describe, expect, test } from 'vitest';
import { render } from 'vitest-browser-react';

import { PhaseBadge } from './PhaseBadge';

describe('PhaseBadge', () => {
  test('renders the current season, phase kind, and deadline', async () => {
    const view = await render(<PhaseBadge />);

    await expect.element(view.getByText('Fall 1904')).toBeVisible();
    await expect.element(view.getByText('Movement')).toBeVisible();
    await expect.element(view.getByText('04:32')).toBeVisible();
  });
});
