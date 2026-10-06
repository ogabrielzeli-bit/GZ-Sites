import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

import fs from 'node:fs';

/** Porta da API: variável de ambiente > .env do projeto (mesmo arquivo que o servidor lê) > 4800 */
function apiPortFromEnv(): number {
  if (process.env.PORT) return Number(process.env.PORT);
  try {
    const m = fs.readFileSync(path.resolve(__dirname, '.env'), 'utf8').match(/^\s*PORT\s*=\s*"?(\d+)"?\s*$/m);
    if (m) return Number(m[1]);
  } catch {
    /* sem .env */
  }
  return 4800;
}
const apiPort = apiPortFromEnv();

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
