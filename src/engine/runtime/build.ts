/**
 * Compila o runtime do cliente (GSAP + interações) com esbuild para um único arquivo.
 * Chamado no `npm run build:runtime`, no boot do servidor e nos testes (ensureRuntime).
 */
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { RUNTIME_DIST, RUNTIME_SRC } from './paths';

export async function buildRuntime(opts: { minify?: boolean } = {}): Promise<string> {
  fs.mkdirSync(path.dirname(RUNTIME_DIST), { recursive: true });
  await build({
    entryPoints: [RUNTIME_SRC],
    bundle: true,
    minify: opts.minify ?? true,
    format: 'iife',
    target: ['es2019'],
    outfile: RUNTIME_DIST,
    legalComments: 'none',
    logLevel: 'silent',
  });
  return RUNTIME_DIST;
}

function newestMtime(dir: string): number {
  let m = 0;
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const st = fs.statSync(p);
    m = Math.max(m, st.isDirectory() ? newestMtime(p) : st.mtimeMs);
  }
  return m;
}

/** Compila só se o dist não existir ou estiver mais velho que as fontes. */
export async function ensureRuntime(): Promise<string> {
  const srcDir = path.dirname(RUNTIME_SRC);
  if (fs.existsSync(RUNTIME_DIST)) {
    const distTime = fs.statSync(RUNTIME_DIST).mtimeMs;
    if (distTime >= newestMtime(srcDir)) return RUNTIME_DIST;
  }
  return buildRuntime();
}
