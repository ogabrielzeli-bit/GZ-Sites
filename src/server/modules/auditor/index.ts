/**
 * GZ Prospect Auditor — orquestra coleta (Playwright), Lighthouse e pontuação.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { AuditReport } from '@shared/schemas';
import { normalizeUrl } from '@shared/utils';
import { collect } from './collect';
import { runLighthouse } from './lighthouse';
import { scoreReport } from './score';

export interface RunAuditOptions {
  url: string;
  outDir: string;
  timeoutMs?: number;
  lighthouse?: boolean;
  onProgress?: (step: string) => void;
}

export interface RunAuditResult {
  report: AuditReport;
  screenshots: { device: string; path: string; width: number; height: number }[];
}

export async function runAudit(o: RunAuditOptions): Promise<RunAuditResult> {
  const url = normalizeUrl(o.url);
  if (!url) throw new Error('URL inválida');
  const started = Date.now();
  o.onProgress?.('Carregando o site e analisando o DOM…');
  const c = await collect({ url, outDir: o.outDir, timeoutMs: o.timeoutMs ?? 45000 });

  let lighthouse: AuditReport['lighthouse'] = { ran: false, error: 'desligado' };
  if (o.lighthouse !== false) {
    o.onProgress?.('Rodando Lighthouse (mobile)…');
    lighthouse = await runLighthouse(c.finalUrl);
  }

  // comprime screenshots (PNG → WebP) para a ficha não ficar pesada
  o.onProgress?.('Otimizando screenshots…');
  const screenshots: RunAuditResult['screenshots'] = [];
  for (const s of c.screenshots) {
    const webp = s.path.replace(/\.png$/, '.webp');
    try {
      const meta = await sharp(s.path).metadata();
      // WebP tem limite de 16383px: corta se precisar
      const h = Math.min(meta.height ?? 0, 16000);
      await sharp(s.path)
        .extract({ left: 0, top: 0, width: meta.width ?? s.width, height: h })
        .webp({ quality: 78 })
        .toFile(webp);
      fs.unlinkSync(s.path);
      screenshots.push({ ...s, path: webp, height: h });
    } catch {
      screenshots.push(s);
    }
  }
  // thumbnail do desktop (para cards)
  const desk = screenshots.find((s) => s.device === 'desktop');
  if (desk) {
    try {
      await sharp(desk.path)
        .resize({ width: 640, height: 400, fit: 'cover', position: 'top' })
        .webp({ quality: 70 })
        .toFile(path.join(o.outDir, 'thumb.webp'));
      screenshots.push({ device: 'thumb', path: path.join(o.outDir, 'thumb.webp'), width: 640, height: 400 });
    } catch {}
  }

  const h = c.headers;
  const https = c.finalUrl.startsWith('https://');
  const exposed = ((c as any).exposedSecrets as string[]) ?? [];
  const partial: Omit<AuditReport, 'findings' | 'scores' | 'opportunities'> = {
    url,
    finalUrl: c.finalUrl,
    fetchedAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    httpStatus: c.httpStatus,
    https,
    redirectedToHttps: !url.startsWith('https://') && https,
    headers: pickHeaders(h),
    page: c.page,
    mobile: c.mobile,
    network: c.network,
    console: c.console,
    security: {
      https,
      hsts: !!h['strict-transport-security'],
      csp: !!h['content-security-policy'] || /<meta[^>]+content-security-policy/i.test(c.html),
      xFrameOptions: !!h['x-frame-options'] || /frame-ancestors/i.test(h['content-security-policy'] || ''),
      xContentTypeOptions: (h['x-content-type-options'] || '').toLowerCase().includes('nosniff'),
      referrerPolicy: !!h['referrer-policy'] || /<meta[^>]+name=["']referrer/i.test(c.html),
      permissionsPolicy: !!h['permissions-policy'] || !!h['feature-policy'],
      mixedContent: c.network.mixedContent.length,
      exposedSecrets: exposed,
      serverHeader: h['server'] ?? null,
      poweredBy: h['x-powered-by'] ?? null,
    },
    seoFiles: c.seoFiles,
    lighthouse,
  };
  const scored = scoreReport(partial);
  const report: AuditReport = { ...partial, ...scored };
  fs.writeFileSync(path.join(o.outDir, 'report.json'), JSON.stringify(report, null, 2));
  return { report, screenshots };
}

function pickHeaders(h: Record<string, string>): Record<string, string> {
  const keep = [
    'server',
    'x-powered-by',
    'content-security-policy',
    'strict-transport-security',
    'x-frame-options',
    'x-content-type-options',
    'referrer-policy',
    'permissions-policy',
    'cache-control',
    'content-type',
    'content-encoding',
  ];
  const out: Record<string, string> = {};
  for (const k of keep) if (h[k]) out[k] = h[k].slice(0, 300);
  return out;
}

export { scoreReport } from './score';
