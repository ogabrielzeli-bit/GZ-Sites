/**
 * GZ QA — roda todos os checks sobre uma pasta dist/ e produz o GZ Quality Report.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium, type Browser, type Page } from 'playwright';
import sharp from 'sharp';
import type { QaCheck, QaReport, QaScreenshot, QaStatus } from './types';
import { serveStatic } from './static-server';
import { checkBuildOutput, checkConfig, checkInternalLinks, lintHtml, listHtmlFiles } from './static-checks';
import { renderQaReportHtml } from './report';

const BROWSER_SRC = fs.readFileSync(path.join(import.meta.dirname, 'qa.browser.js'), 'utf8');
type BrowserFn =
  | 'overflowInfo'
  | 'mobileChecks'
  | 'imagesCheck'
  | 'buttonsCheck'
  | 'a11yCheck'
  | 'focusedInfo'
  | 'externalHrefs'
  | 'stubWindowOpen'
  | 'openedUrls'
  | 'scrollThrough';
const inPage = <T>(page: Page, fn: BrowserFn): Promise<T> =>
  page.evaluate<T>(`(() => { ${BROWSER_SRC}; return window.__gzQa.${fn}(); })()`);

export interface RunQaOptions {
  distDir: string;
  outDir: string;
  config?: unknown;
  lighthouse?: boolean;
  checkExternalLinks?: boolean;
  onProgress?: (msg: string) => void;
}

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'tablet-820', width: 820, height: 1180 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-430', width: 430, height: 932 },
];

export async function runQa(o: RunQaOptions): Promise<QaReport> {
  const started = Date.now();
  const progress = o.onProgress ?? (() => {});
  fs.mkdirSync(o.outDir, { recursive: true });
  const checks: QaCheck[] = [];
  const screenshots: QaScreenshot[] = [];

  progress('Validando build e config…');
  checks.push(checkConfig(o.config));
  const build = checkBuildOutput(o.distDir);
  checks.push(build);
  let lighthouse: QaReport['lighthouse'] = { ran: false, error: 'não executado' };
  const pages = listHtmlFiles(o.distDir).map(
    (f) =>
      '/' +
      path
        .relative(o.distDir, f)
        .replace(/\\/g, '/')
        .replace(/index\.html$/, ''),
  );
  let url = '';

  if (build.status !== 'fail') {
    progress('Lint do HTML e links internos…');
    checks.push(...lintHtml(o.distDir));
    checks.push(checkInternalLinks(o.distDir));

    progress('Subindo preview local…');
    const server = await serveStatic(o.distDir);
    url = server.url;
    let browser: Browser | null = null;
    try {
      browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
      const consoleErrors = new Set<string>();
      const externalFailures = new Set<string>();
      const failedRequests = new Set<string>();
      const overflowIssues: string[] = [];
      const tapIssues: string[] = [];
      const fontIssues: string[] = [];
      let imgCheck: QaCheck | null = null;
      let btnCheck: QaCheck | null = null;
      let formCheck: QaCheck | null = null;
      let a11yCheck: QaCheck | null = null;
      let extCheck: QaCheck | null = null;

      for (const vp of VIEWPORTS) {
        progress(`Testando ${vp.name} (${vp.width}×${vp.height})…`);
        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
          isMobile: vp.width < 500,
          hasTouch: vp.width < 500,
        });
        const page = await ctx.newPage();
        page.on('console', (m) => {
          if (m.type() !== 'error') return;
          const loc = m.location()?.url || '';
          // falha de recurso externo (fonte, CDN) não é erro do site: vira aviso separado
          if (/Failed to load resource/.test(m.text()) && loc && !loc.startsWith(url))
            externalFailures.add(`[${vp.name}] ${loc.slice(0, 120)}`);
          else consoleErrors.add(`[${vp.name}] ${m.text().slice(0, 200)}`);
        });
        page.on('pageerror', (e) => consoleErrors.add(`[${vp.name}] ${e.message.slice(0, 200)}`));
        page.on('requestfailed', (r) => {
          const u = r.url();
          if (u.startsWith(url)) failedRequests.add(`${u.replace(url, '')} (${r.failure()?.errorText})`);
        });
        await page.goto(url + '/', { waitUntil: 'load', timeout: 30000 });
        await scrollThrough(page);
        const info = await inPage<{ overflow: number; culprits: string[] }>(page, 'overflowInfo');
        const ov = info.overflow;
        if (ov > 4) overflowIssues.push(`${vp.name}: +${ov}px (${info.culprits.join(', ')})`);
        const file = path.join(o.outDir, `${vp.name}.png`);
        await page.screenshot({ path: file, fullPage: true, timeout: 30000 }).catch(() => {});
        if (fs.existsSync(file)) {
          const webp = file.replace(/\.png$/, '.webp');
          try {
            const meta = await sharp(file).metadata();
            const h = Math.min(meta.height ?? 0, 16000);
            await sharp(file)
              .extract({ left: 0, top: 0, width: meta.width ?? vp.width, height: h })
              .webp({ quality: 75 })
              .toFile(webp);
            fs.unlinkSync(file);
            screenshots.push({ viewport: vp.name, width: vp.width, height: h, path: webp, overflow: ov });
          } catch {
            screenshots.push({
              viewport: vp.name,
              width: vp.width,
              height: vp.height,
              path: file,
              overflow: ov,
            });
          }
        }
        if (vp.name === 'mobile-390') {
          const mob = await inPage<{ small: string[]; tiny: number }>(page, 'mobileChecks');
          if (mob.small.length) tapIssues.push(...mob.small);
          if (mob.tiny > 3) fontIssues.push(`${mob.tiny} textos < 12px`);
          formCheck = await testForm(page);
        }
        if (vp.name === 'desktop-1440') {
          imgCheck = await testImages(page);
          btnCheck = await testButtons(page, url);
          a11yCheck = await testA11y(page);
          if (o.checkExternalLinks) extCheck = await testExternalLinks(page);
        }
        await ctx.close();
      }

      checks.push(
        consoleErrors.size
          ? {
              id: 'console',
              group: 'console',
              status: 'fail',
              title: `${consoleErrors.size} erro(s) de JavaScript/console`,
              items: Array.from(consoleErrors).slice(0, 10),
            }
          : {
              id: 'console',
              group: 'console',
              status: 'pass',
              title: 'Sem erros de JavaScript em 5 viewports',
            },
      );
      if (externalFailures.size)
        checks.push({
          id: 'external-resources',
          group: 'links',
          status: 'warning',
          title: `${externalFailures.size} recurso(s) externo(s) não carregaram (rede/proxy?)`,
          items: Array.from(externalFailures).slice(0, 6),
        });
      checks.push(
        failedRequests.size
          ? {
              id: 'requests',
              group: 'links',
              status: 'fail',
              title: `${failedRequests.size} recurso(s) local(is) falharam ao carregar`,
              items: Array.from(failedRequests).slice(0, 10),
            }
          : { id: 'requests', group: 'links', status: 'pass', title: 'Todos os recursos locais carregaram' },
      );
      checks.push(
        overflowIssues.length
          ? {
              id: 'overflow',
              group: 'mobile',
              status: 'fail',
              title: 'Overflow horizontal detectado',
              items: overflowIssues,
            }
          : {
              id: 'overflow',
              group: 'mobile',
              status: 'pass',
              title: 'Sem overflow horizontal (1440, 1920, 820, 390, 430)',
            },
      );
      checks.push(
        tapIssues.length
          ? {
              id: 'tap',
              group: 'mobile',
              status: 'warning',
              title: `${tapIssues.length} alvo(s) de toque pequenos no mobile`,
              items: tapIssues,
            }
          : { id: 'tap', group: 'mobile', status: 'pass', title: 'Botões com tamanho adequado no mobile' },
      );
      checks.push(
        fontIssues.length
          ? {
              id: 'font',
              group: 'mobile',
              status: 'warning',
              title: 'Textos pequenos no mobile',
              items: fontIssues,
            }
          : { id: 'font', group: 'mobile', status: 'pass', title: 'Fontes legíveis no mobile' },
      );
      if (imgCheck) checks.push(imgCheck);
      if (btnCheck) checks.push(btnCheck);
      if (formCheck) checks.push(formCheck);
      if (a11yCheck) checks.push(a11yCheck);
      if (extCheck) checks.push(extCheck);

      if (o.lighthouse !== false) {
        progress('Rodando Lighthouse…');
        const { runLighthouse } = await import('../server/modules/auditor/lighthouse');
        const lh = await runLighthouse(url + '/', 90000);
        lighthouse = lh;
        if (lh.ran) {
          const sc = (
            k: 'performance' | 'accessibility' | 'bestPractices' | 'seo',
            label: string,
            min: number,
            warn: number,
          ) => {
            const v = lh[k];
            if (v == null) return;
            checks.push({
              id: `lh-${k}`,
              group: k === 'performance' ? 'performance' : k === 'accessibility' ? 'a11y' : 'seo',
              status: v >= min ? 'pass' : v >= warn ? 'warning' : 'fail',
              title: `Lighthouse ${label}: ${v}`,
            });
          };
          sc('performance', 'Performance', 85, 60);
          sc('accessibility', 'Acessibilidade', 90, 75);
          sc('bestPractices', 'Best Practices', 90, 75);
          sc('seo', 'SEO', 90, 75);
        } else
          checks.push({
            id: 'lh',
            group: 'performance',
            status: 'warning',
            title: 'Lighthouse não rodou',
            detail: lh.error,
          });
      }
    } finally {
      await browser?.close().catch(() => {});
      await server.close();
    }
  }

  const counts = { pass: 0, warning: 0, fail: 0 };
  for (const c of checks) counts[c.status]++;
  const status: QaStatus = counts.fail ? 'fail' : counts.warning ? 'warning' : 'pass';
  const report: QaReport = {
    status,
    ranAt: new Date().toISOString(),
    durationMs: Date.now() - started,
    target: { distDir: o.distDir, url },
    counts,
    checks,
    screenshots,
    lighthouse,
    pages,
  };
  fs.writeFileSync(path.join(o.outDir, 'report.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(o.outDir, 'report.html'), renderQaReportHtml(report, o.outDir));
  return report;
}

async function scrollThrough(page: Page) {
  await inPage(page, 'scrollThrough');
}

async function testImages(page: Page): Promise<QaCheck> {
  const r = await inPage<{ total: number; broken: string[]; notLoaded: number }>(page, 'imagesCheck');
  if (r.broken.length)
    return {
      id: 'images',
      group: 'images',
      status: 'fail',
      title: `${r.broken.length} imagem(ns) quebrada(s)`,
      items: r.broken.slice(0, 10),
    };
  return {
    id: 'images',
    group: 'images',
    status: 'pass',
    title: `${r.total} imagens carregaram corretamente`,
  };
}

async function testButtons(page: Page, base: string): Promise<QaCheck> {
  void base;
  const r = await inPage<{ count: number; problems: string[] }>(page, 'buttonsCheck');
  // clica no menu mobile toggle e no FAQ para garantir que não quebram
  try {
    const toggle = page.locator('[data-gz-menu-toggle]');
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(200);
      await toggle.click();
    }
    const summary = page.locator('.faq summary').first();
    if ((await summary.count()) && (await summary.isVisible())) await summary.click();
  } catch (e) {
    r.problems.push('Interação falhou: ' + (e as Error).message.slice(0, 100));
  }
  return r.problems.length
    ? {
        id: 'buttons',
        group: 'buttons',
        status: 'warning',
        title: `${r.problems.length} problema(s) em botões/links`,
        items: r.problems.slice(0, 10),
      }
    : { id: 'buttons', group: 'buttons', status: 'pass', title: `${r.count} botões e links verificados` };
}

async function testForm(page: Page): Promise<QaCheck> {
  const form = page.locator('form[data-gz-form]').first();
  if (!(await form.count()))
    return { id: 'form', group: 'form', status: 'warning', title: 'Nenhum formulário encontrado' };
  try {
    await inPage(page, 'stubWindowOpen');
    await form.scrollIntoViewIfNeeded();
    // 1) envio vazio deve ser bloqueado pela validação
    await form.locator('button[type=submit]').click();
    await page.waitForTimeout(200);
    const invalid = await form.locator('.field--error').count();
    // 2) preenche e envia
    for (const f of await form
      .locator('input:not([type=hidden]):not([name="empresa-site"]), textarea')
      .all()) {
      const type = (await f.getAttribute('type')) || 'text';
      const name = (await f.getAttribute('name')) || '';
      if (type === 'email') await f.fill('teste@gzsites.com.br');
      else if (type === 'tel') await f.fill('41999998888');
      else if (name === 'empresa-site') continue;
      else await f.fill('Teste de QA');
    }
    await form.locator('button[type=submit]').click();
    await page.waitForTimeout(900);
    const state = await form.locator('button[type=submit]').getAttribute('data-state');
    const opened = (await inPage<string[]>(page, 'openedUrls')) ?? [];
    const mode = await form.getAttribute('data-gz-form');
    const items: string[] = [];
    if (!invalid) items.push('Validação não bloqueou envio vazio');
    if (state !== 'sent') items.push(`Estado final: ${state} (esperado: sent)`);
    if (mode === 'whatsapp' && !opened.some((u) => u.includes('wa.me')))
      items.push('Não abriu o WhatsApp com os dados');
    if (items.length && mode === 'netlify' && invalid)
      return {
        id: 'form',
        group: 'form',
        status: 'warning',
        title: 'Formulário Netlify Forms: validação OK; o envio só funciona publicado na Netlify',
        items,
      };
    return items.length
      ? { id: 'form', group: 'form', status: 'fail', title: 'Formulário com problemas', items }
      : { id: 'form', group: 'form', status: 'pass', title: `Formulário OK (validação + envio ${mode})` };
  } catch (e) {
    return {
      id: 'form',
      group: 'form',
      status: 'fail',
      title: 'Erro ao testar formulário',
      detail: (e as Error).message.slice(0, 200),
    };
  }
}

async function testA11y(page: Page): Promise<QaCheck> {
  const r = await inPage<string[]>(page, 'a11yCheck');
  // navegação por teclado: Tab deve focar um link visível com outline
  try {
    await page.keyboard.press('Tab');
    const focused = await inPage<{ tag: string; outline: boolean } | null>(page, 'focusedInfo');
    if (!focused) r.push('Tab não focou nenhum elemento');
  } catch {}
  return r.length
    ? {
        id: 'a11y',
        group: 'a11y',
        status: 'warning',
        title: `${r.length} alerta(s) de acessibilidade`,
        items: r.slice(0, 10),
      }
    : { id: 'a11y', group: 'a11y', status: 'pass', title: 'Semântica, labels, foco e H1 OK' };
}

async function testExternalLinks(page: Page): Promise<QaCheck> {
  const hrefs = await inPage<string[]>(page, 'externalHrefs');
  const broken: string[] = [];
  for (const h of hrefs.slice(0, 20)) {
    try {
      const res = await fetch(h, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(6000) });
      if (res.status >= 400) broken.push(`${h} → ${res.status}`);
    } catch {
      broken.push(`${h} → sem resposta`);
    }
  }
  return broken.length
    ? {
        id: 'links-external',
        group: 'links',
        status: 'warning',
        title: `${broken.length} link(s) externo(s) com problema`,
        items: broken,
      }
    : {
        id: 'links-external',
        group: 'links',
        status: 'pass',
        title: `${hrefs.length} links externos verificados`,
      };
}

export { renderQaReportHtml } from './report';
export * from './types';
export { applyAutofix, listAutofixes } from './autofix';
