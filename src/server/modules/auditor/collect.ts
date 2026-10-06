/**
 * Coleta de dados do site auditado com Playwright (não destrutiva: só navega, lê DOM e respostas).
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser, type Page, type Response } from 'playwright';
import type { AuditReport } from '@shared/schemas';

/** Código avaliado dentro da página (JS puro, sem helpers do bundler) */
const BROWSER_SRC = fs.readFileSync(path.join(import.meta.dirname, 'collect.browser.js'), 'utf8');
const inPage = <T>(page: Page, fn: 'analyzeDom' | 'analyzeAboveFold' | 'analyzeMobile'): Promise<T> =>
  page.evaluate<T>(`(() => { ${BROWSER_SRC}; return window.__gzAudit.${fn}(); })()`);

export interface CollectOptions {
  url: string;
  outDir: string;
  timeoutMs: number;
}

export interface CollectResult {
  finalUrl: string;
  httpStatus: number | null;
  headers: Record<string, string>;
  page: AuditReport['page'];
  mobile: AuditReport['mobile'];
  network: AuditReport['network'];
  console: AuditReport['console'];
  seoFiles: AuditReport['seoFiles'];
  screenshots: { device: string; path: string; width: number; height: number }[];
  html: string;
}

const VIEWPORTS = [
  { device: 'desktop', width: 1440, height: 900 },
  { device: 'tablet', width: 820, height: 1180 },
  { device: 'mobile', width: 390, height: 844 },
];

const SECRET_PATTERNS: { name: string; re: RegExp }[] = [
  { name: 'Chave AWS', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'Chave Stripe live', re: /sk_live_[0-9a-zA-Z]{16,}/ },
  { name: 'Chave privada', re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/ },
  { name: 'Token Slack', re: /xox[baprs]-[0-9A-Za-z-]{10,}/ },
  { name: 'Chave Google API exposta', re: /AIza[0-9A-Za-z\-_]{35}/ },
  { name: 'Senha em texto', re: /(password|senha)\s*[:=]\s*["'][^"']{4,}["']/i },
  { name: 'Credencial de banco', re: /(mysql|postgres|mongodb(\+srv)?):\/\/[^\s"'<]+:[^\s"'<]+@/i },
];

async function scrollThrough(page: Page) {
  await page.evaluate(`(async () => {
    const total = document.documentElement.scrollHeight;
    const step = Math.max(400, window.innerHeight * 0.8);
    for (let y = 0; y < total; y += step) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 300));
  })()`);
}

export async function collect(o: CollectOptions): Promise<CollectResult> {
  fs.mkdirSync(o.outDir, { recursive: true });
  const browser: Browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
  try {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36 GZ-Auditor/1.0',
      locale: 'pt-BR',
      ignoreHTTPSErrors: true,
    });
    const page = await ctx.newPage();
    const consoleErrors: string[] = [];
    let consoleWarnings = 0;
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
      if (m.type() === 'warning') consoleWarnings++;
    });
    page.on('pageerror', (e) => consoleErrors.push('Exceção: ' + e.message.slice(0, 300)));

    const responses: { url: string; status: number; type: string; bytes: number; contentType: string }[] = [];
    page.on('response', async (res: Response) => {
      try {
        const req = res.request();
        const headers = res.headers();
        const len = Number(headers['content-length'] || 0);
        let bytes = len;
        if (
          !bytes &&
          res.ok() &&
          ['image', 'script', 'stylesheet', 'font', 'document'].includes(req.resourceType())
        ) {
          try {
            const body = await res.body();
            bytes = body.length;
          } catch {}
        }
        responses.push({
          url: res.url(),
          status: res.status(),
          type: req.resourceType(),
          bytes,
          contentType: headers['content-type'] || '',
        });
      } catch {}
    });

    let mainResponse: Response | null = null;
    try {
      mainResponse = await page.goto(o.url, { waitUntil: 'load', timeout: o.timeoutMs });
    } catch (e) {
      // tenta domcontentloaded como fallback para sites lentos
      mainResponse = await page
        .goto(o.url, { waitUntil: 'domcontentloaded', timeout: o.timeoutMs })
        .catch(() => null);
      if (!mainResponse) throw new Error(`Não foi possível carregar ${o.url}: ${(e as Error).message}`);
    }
    await page.waitForTimeout(1500);
    await scrollThrough(page);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

    const finalUrl = page.url();
    const headers: Record<string, string> = {};
    if (mainResponse)
      for (const [k, v] of Object.entries(mainResponse.headers())) headers[k.toLowerCase()] = v;
    const httpStatus = mainResponse?.status() ?? null;
    const html = await page.content();

    const pageData = await inPage<AuditReport['page']>(page, 'analyzeDom');
    // sinais extras do HTML bruto
    const exposed: string[] = [];
    for (const sp of SECRET_PATTERNS) if (sp.re.test(html)) exposed.push(sp.name);
    (pageData as any).__exposed = exposed;

    // screenshots (desktop já carregado)
    const screenshots: CollectResult['screenshots'] = [];
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(400);
      await scrollThrough(page);
      const file = path.join(o.outDir, `${vp.device}.png`);
      await page.screenshot({ path: file, fullPage: true, timeout: 30000 }).catch(async () => {
        await page.screenshot({ path: file, fullPage: false, timeout: 15000 }).catch(() => {});
      });
      if (fs.existsSync(file))
        screenshots.push({ device: vp.device, path: file, width: vp.width, height: vp.height });
      if (vp.device === 'desktop') {
        const aboveFold = await inPage<Partial<AuditReport['page']>>(page, 'analyzeAboveFold');
        Object.assign(pageData, aboveFold);
      }
    }
    // análise mobile (viewport atual = mobile)
    const mobile = await inPage<AuditReport['mobile']>(page, 'analyzeMobile');

    // robots / sitemap
    const origin = new URL(finalUrl).origin;
    const fetchOk = async (u: string) => {
      try {
        const r = await ctx.request.get(u, { timeout: 8000, maxRedirects: 3 });
        const ct = r.headers()['content-type'] || '';
        const text = r.ok() && !ct.includes('text/html') ? await r.text() : r.ok() ? await r.text() : '';
        return { ok: r.ok() && !/<html/i.test(text.slice(0, 500)), text };
      } catch {
        return { ok: false, text: '' };
      }
    };
    const robots = await fetchOk(origin + '/robots.txt');
    let sitemapOk = (await fetchOk(origin + '/sitemap.xml')).ok;
    if (!sitemapOk && robots.ok) {
      const m = robots.text.match(/sitemap:\s*(\S+)/i);
      if (m) sitemapOk = (await fetchOk(m[1])).ok;
    }
    const robotsBlocksAll =
      robots.ok && /user-agent:\s*\*\s*[\r\n]+\s*disallow:\s*\/\s*$/im.test(robots.text);

    // rede
    const byType: Record<string, { count: number; bytes: number }> = {};
    let transferBytes = 0;
    const thirdParty = new Set<string>();
    const mixed: string[] = [];
    const host = new URL(finalUrl).hostname.replace(/^www\./, '');
    const isHttps = finalUrl.startsWith('https://');
    const heaviestImages = responses
      .filter((r) => r.type === 'image' && r.bytes > 0)
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 8)
      .map((r) => ({ url: r.url, bytes: r.bytes, type: r.contentType.split(';')[0] }));
    for (const r of responses) {
      const t = r.type || 'other';
      byType[t] = byType[t] || { count: 0, bytes: 0 };
      byType[t].count++;
      byType[t].bytes += r.bytes;
      transferBytes += r.bytes;
      try {
        const u = new URL(r.url);
        const h = u.hostname.replace(/^www\./, '');
        if (h !== host && !h.endsWith('.' + host) && u.protocol.startsWith('http')) thirdParty.add(h);
        if (isHttps && u.protocol === 'http:') mixed.push(r.url);
      } catch {}
    }
    const unoptimizedImages = responses.filter(
      (r) => r.type === 'image' && r.bytes > 300_000 && !/webp|avif|svg/.test(r.contentType),
    ).length;

    const { __exposed, ...pd } = pageData as any;
    return {
      finalUrl,
      httpStatus,
      headers,
      page: { ...(pd as AuditReport['page']) },
      mobile,
      network: {
        requests: responses.length,
        transferBytes,
        byType,
        heaviestImages,
        mixedContent: mixed.slice(0, 20),
        thirdPartyDomains: Array.from(thirdParty).slice(0, 30),
        unoptimizedImages,
      },
      console: { errors: consoleErrors.slice(0, 20), warnings: consoleWarnings },
      seoFiles: { robots: robots.ok, sitemap: sitemapOk, robotsBlocksAll },
      screenshots,
      html: html.length > 2_000_000 ? html.slice(0, 2_000_000) : html,
      ...({ exposedSecrets: __exposed } as any),
    };
  } finally {
    await browser.close().catch(() => {});
  }
}
