import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const apiPort = Number(process.env.PORT || 4800);
const apiTarget = `http://127.0.0.1:${apiPort}`;

// The dev root is src/web, so src/web/api.ts is requested as /api.ts.
// A prefix proxy of `/api` would send that module to Express and return HTML.
function apiProxy(): ProxyOptions {
  return {
    target: apiTarget,
    bypass(req) {
      const url = req.url ?? '';
      if (/\.(?:[cm]?[jt]sx?|css|map|svg|png|jpe?g|gif|webp|woff2?)(?:\?|#|$)/.test(url)) return url;
    },
  };
}

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
    proxy: {
      '/api': apiProxy(),
      '/previews': apiProxy(),
      '/files': apiProxy(),
      '/projects-preview': apiProxy(),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-web'),
    emptyOutDir: true,
    sourcemap: false,
  },
});
