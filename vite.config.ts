import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const apiPort = Number(process.env.PORT || 4800);

export default defineConfig({
  root: path.resolve(__dirname, 'src/web'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@web': path.resolve(__dirname, 'src/web'),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    // IMPORTANTE: prefixos com barra final — '/api' capturaria '/api.ts' (módulo do dashboard)
    proxy: {
      '/published/': `http://127.0.0.1:${apiPort}`,
      '/api/': `http://127.0.0.1:${apiPort}`,
      '/previews/': `http://127.0.0.1:${apiPort}`,
      '/files/': `http://127.0.0.1:${apiPort}`,
      '/projects-preview/': `http://127.0.0.1:${apiPort}`,
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-web'),
    emptyOutDir: true,
    sourcemap: false,
  },
});
