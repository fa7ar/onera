import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  root: 'apps/web',
  envDir: fileURLToPath(new URL('.', import.meta.url)),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./apps/web/src', import.meta.url)),
      '@onera/core': fileURLToPath(new URL('./packages/core/src', import.meta.url)),
      '@onera/domain': fileURLToPath(new URL('./packages/domain/src', import.meta.url)),
      '@onera/application': fileURLToPath(new URL('./packages/application/src', import.meta.url)),
      '@onera/ui': fileURLToPath(new URL('./packages/ui/src', import.meta.url)),
      '@onera/config': fileURLToPath(new URL('./packages/config/src', import.meta.url)),
      '@onera/events': fileURLToPath(new URL('./packages/events/src', import.meta.url)),
      '@onera/permissions': fileURLToPath(new URL('./packages/permissions/src', import.meta.url)),
      '@onera/sdk': fileURLToPath(new URL('./packages/sdk/src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
  },
});
