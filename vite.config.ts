import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // 'server-only' is a Next.js build-time marker that throws
      // unconditionally when required outside webpack's bundling context
      // (webpack aliases it to a no-op for server bundles; Vitest doesn't).
      // Server-side code under test imports it at module scope, so tests
      // need the same no-op here.
      'server-only': resolve(__dirname, 'test/server-only-stub.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
