/** Servidor estático mínimo e seguro (sem path traversal) para preview/QA de pastas dist. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import type { AddressInfo } from 'node:net';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
};

export interface StaticServer {
  url: string;
  port: number;
  close: () => Promise<void>;
}

export function resolveStaticFile(root: string, urlPath: string): string | null {
  let p: string;
  try {
    p = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  } catch {
    return null;
  }
  if (p.includes('\0')) return null;
  if (p.endsWith('/')) p += 'index.html';
  const abs = path.resolve(root, '.' + p);
  const base = path.resolve(root);
  if (abs !== base && !abs.startsWith(base + path.sep)) return null;
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
    const idx = path.join(abs, 'index.html');
    return fs.existsSync(idx) ? idx : null;
  }
  return fs.existsSync(abs) ? abs : null;
}

export function serveStatic(root: string, port = 0): Promise<StaticServer> {
  const server = http.createServer((req, res) => {
    const file = resolveStaticFile(root, req.url || '/');
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('404');
      return;
    }
    const headers: Record<string, string> = {
      'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-cache',
      'x-content-type-options': 'nosniff',
    };
    // aplica _headers simples (só os globais) para o QA testar os headers de segurança
    const hf = path.join(root, '_headers');
    if (fs.existsSync(hf)) {
      const lines = fs.readFileSync(hf, 'utf8').split('\n');
      let inGlobal = false;
      for (const l of lines) {
        if (/^\S/.test(l)) inGlobal = l.trim() === '/*';
        else if (inGlobal) {
          const m = l.trim().match(/^([A-Za-z-]+):\s*(.+)$/);
          if (m) headers[m[1].toLowerCase()] = m[2];
        }
      }
    }
    res.writeHead(200, headers);
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const p = (server.address() as AddressInfo).port;
      resolve({
        url: `http://127.0.0.1:${p}`,
        port: p,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}
