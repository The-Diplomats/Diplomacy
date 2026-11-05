import { playwright } from '@vitest/browser-playwright';
import { defineConfig, mergeConfig } from 'vitest/config';

import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ['./src/**/*.test.{ts,tsx}', './mocks/**/*.test.{ts,tsx}'],
      browser: {
        enabled: true,
        provider: playwright(),
        instances: [{ browser: 'chromium' }],
        viewport: { width: 1920, height: 1080 },
        headless: true,
      },
      expect: {
        poll: {
          timeout: 10_000,
        },
      },
    },
  }),
);
