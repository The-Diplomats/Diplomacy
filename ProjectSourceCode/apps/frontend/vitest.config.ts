import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
});
