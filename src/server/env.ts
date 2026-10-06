/**
 * Carrega variáveis de ambiente (.env opcional, sem dependência externa) e expõe caminhos de dados.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../..');

function loadDotEnv(file: string) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadDotEnv(path.join(ROOT, '.env'));

const dataDir = path.resolve(ROOT, process.env.GZ_DATA_DIR || './data');

export const env = {
  root: ROOT,
  port: Number(process.env.PORT || 4800),
  host: process.env.HOST || '127.0.0.1',
  isProd: process.env.NODE_ENV === 'production',
  accessToken: process.env.GZ_ACCESS_TOKEN || '',
  dataDir,
  dbPath: path.join(dataDir, 'gz.db'),
  uploadsDir: path.join(dataDir, 'uploads'),
  auditsDir: path.join(dataDir, 'audits'),
  previewsDir: path.join(dataDir, 'previews'),
  projectsDir: path.join(dataDir, 'projects'),
  exportsDir: path.join(dataDir, 'exports'),
  backupsDir: path.join(dataDir, 'backups'),
  tmpDir: path.join(dataDir, 'tmp'),
  ai: {
    provider: (process.env.AI_PROVIDER || 'none') as 'none' | 'openai' | 'anthropic' | 'openai-compatible',
    openaiKey: process.env.OPENAI_API_KEY || '',
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    anthropicKey: process.env.ANTHROPIC_API_KEY || '',
    anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001',
    compatBaseUrl: process.env.OPENAI_COMPATIBLE_BASE_URL || '',
    compatKey: process.env.OPENAI_COMPATIBLE_API_KEY || '',
    compatModel: process.env.OPENAI_COMPATIBLE_MODEL || '',
  },
  netlifyToken: process.env.NETLIFY_AUTH_TOKEN || '',
  audit: {
    timeoutMs: Number(process.env.AUDIT_TIMEOUT_MS || 45000),
    lighthouse: (process.env.AUDIT_LIGHTHOUSE ?? 'true') !== 'false',
  },
};

export function ensureDataDirs() {
  for (const d of [
    env.dataDir,
    env.uploadsDir,
    env.auditsDir,
    env.previewsDir,
    env.projectsDir,
    env.exportsDir,
    env.backupsDir,
    env.tmpDir,
  ]) {
    fs.mkdirSync(d, { recursive: true });
  }
}
