import { defineConfig } from 'vitest/config';
import path from 'node:path';

// Testes de integração/E2E: sobem o servidor em memória, usam Playwright e o engine real.
export default defineConfig({
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@engine': path.resolve(__dirname, 'src/engine'),
      '@server': path.resolve(__dirname, 'src/server'),
    },
  },
  test: {
    include: ['tests/e2e/**/*.test.ts'],
    environment: 'node',
    testTimeout: 180000,
    hookTimeout: 180000,
    fileParallelism: false,
  },
});
