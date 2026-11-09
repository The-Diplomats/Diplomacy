// Loads .env into process.env before vitest starts (dev uses `tsx --env-file`;
// tests go through vitest's own runner so we load it here explicitly).
import 'dotenv/config';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['./src/**/*.test.{ts,tsx}'],
  },
});
