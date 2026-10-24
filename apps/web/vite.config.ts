/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { openDataPlugin } from './src/infrastructure/open-data/vitePlugin';

export default defineConfig({
  // W-16: CSV and JSON downloads derived from public/data (dist/data/descargas/).
  plugins: [react(), openDataPlugin(fileURLToPath(new URL('./public/data', import.meta.url)))],
  resolve: {
    // '@/domain', '@/application', '@/infrastructure', '@/presentation'
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    // RNF-01: la carga inicial debe quedar ≤ 500 KB; scripts/check-budget.mjs lo verifica en CI.
    reportCompressedSize: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
  },
});
