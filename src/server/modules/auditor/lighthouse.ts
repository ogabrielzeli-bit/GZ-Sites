/**
 * Lighthouse (mobile) usando o Chromium do Playwright. Falha de forma graciosa: o auditor
 * continua com heurísticas se o Lighthouse não rodar.
 */
import { chromium } from 'playwright';
import type { AuditReport } from '@shared/schemas';

export async function runLighthouse(url: string, timeoutMs = 90000): Promise<AuditReport['lighthouse']> {
  let chrome: any = null;
  try {
    const [{ default: lighthouse }, chromeLauncher] = await Promise.all([
      import('lighthouse'),
      import('chrome-launcher'),
    ]);
    chrome = await chromeLauncher.launch({
      chromePath: chromium.executablePath(),
      chromeFlags: [
        '--headless=new',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--ignore-certificate-errors',
      ],
    });
    const result = await Promise.race([
      lighthouse(url, {
        port: chrome.port,
        output: 'json',
        logLevel: 'silent',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
        formFactor: 'mobile',
        screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 2.625, disabled: false },
        throttlingMethod: 'simulate',
        maxWaitForLoad: Math.min(timeoutMs, 45000),
      } as any),
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error('Lighthouse excedeu o tempo limite')), timeoutMs),
      ),
    ]);
    const lhr = (result as any)?.lhr;
    if (!lhr) return { ran: false, error: 'Sem resultado' };
    const cat = (k: string) =>
      lhr.categories?.[k]?.score != null ? Math.round(lhr.categories[k].score * 100) : undefined;
    const audit = (k: string) => lhr.audits?.[k]?.numericValue as number | undefined;
    return {
      ran: true,
      performance: cat('performance'),
      accessibility: cat('accessibility'),
      bestPractices: cat('best-practices'),
      seo: cat('seo'),
      lcp: audit('largest-contentful-paint'),
      cls: audit('cumulative-layout-shift'),
      tbt: audit('total-blocking-time'),
      inp: audit('interaction-to-next-paint'),
      fcp: audit('first-contentful-paint'),
      speedIndex: audit('speed-index'),
      ttfb: audit('server-response-time'),
    };
  } catch (e) {
    return { ran: false, error: (e as Error).message.slice(0, 300) };
  } finally {
    try {
      await chrome?.kill();
    } catch {}
  }
}
