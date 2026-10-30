import { defineConfig } from '@kubb/core';
import { pluginClient } from '@kubb/plugin-client';
import { pluginOas } from '@kubb/plugin-oas';
import { pluginReactQuery } from '@kubb/plugin-react-query';
import { pluginTs } from '@kubb/plugin-ts';

export default defineConfig({
  root: '.',
  input: {
    path: './api/public/openapi.yaml',
  },
  output: {
    path: './src/generated',
    clean: true,
  },
  plugins: [
    pluginOas({ validate: true }),
    pluginTs({ output: { path: 'types' } }),
    pluginClient({
      output: { path: 'client' },
      baseURL: '/api',
      client: 'fetch',
    }),
    pluginReactQuery({
      output: { path: 'hooks' },
      client: {
        client: 'fetch',
        baseURL: '/api',
      },
    }),
  ],
});
