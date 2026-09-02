import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@onera/core': fileURLToPath(new URL('./packages/core/src', import.meta.url)),
      '@onera/domain': fileURLToPath(new URL('./packages/domain/src', import.meta.url)),
      '@onera/application': fileURLToPath(new URL('./packages/application/src', import.meta.url)),
      '@onera/config': fileURLToPath(new URL('./packages/config/src', import.meta.url)),
      '@onera/events': fileURLToPath(new URL('./packages/events/src', import.meta.url)),
      '@onera/permissions': fileURLToPath(new URL('./packages/permissions/src', import.meta.url)),
      '@onera/sdk': fileURLToPath(new URL('./packages/sdk/src', import.meta.url)),
      '@onera/adapter-dev': fileURLToPath(new URL('./adapters/dev/src', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
