/**
 * Checks estáticos (sem navegador): valida o config, "linta" o HTML gerado e confere links internos.
 */
import fs from 'node:fs';
import path from 'node:path';
import { safeParseSiteConfig } from '@shared/site-config';
import type { QaCheck } from './types';
import { resolveStaticFile } from './static-server';

export function listHtmlFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.html')) out.push(p);
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return out;
}

export function checkConfig(config: unknown): QaCheck {
  if (config === undefined)
    return { id: 'config', group: 'build', status: 'warning', title: 'Sem site.config para validar' };
  const r = safeParseSiteConfig(config);
  return r.success
    ? { id: 'config', group: 'build', status: 'pass', title: 'site.config válido' }
    : {
        id: 'config',
        group: 'build',
        status: 'fail',
        title: 'site.config inválido',
        items: r.error.issues.slice(0, 10).map((i) => `${i.path.join('.')}: ${i.message}`),
      };
}

export function checkBuildOutput(distDir: string): QaCheck {
  const idx = path.join(distDir, 'index.html');
  if (!fs.existsSync(idx))
    return { id: 'build', group: 'build', status: 'fail', title: 'Build não encontrado (dist/index.html)' };
  const html = fs.readFileSync(idx, 'utf8');
  const css = fs.existsSync(path.join(distDir, 'assets', 'site.css'));
  const items: string[] = [];
  if (!css) items.push('assets/site.css ausente');
  if (html.length < 2000) items.push('index.html suspeitosamente pequeno');
  return items.length
    ? { id: 'build', group: 'build', status: 'fail', title: 'Build incompleto', items }
    : {
        id: 'build',
        group: 'build',
        status: 'pass',
        title: `Build OK (${listHtmlFiles(distDir).length} página(s))`,
      };
}

/** Lint determinístico do HTML gerado */
export function lintHtml(distDir: string): QaCheck[] {
  const checks: QaCheck[] = [];
  const files = listHtmlFiles(distDir);
  const noAlt: string[] = [];
  const blankNoRel: string[] = [];
  const dupIds: string[] = [];
  const missingMeta: string[] = [];
  const inlineHandlers: string[] = [];
  const httpRes: string[] = [];
  const noDims: string[] = [];
  const noLazy: string[] = [];
  for (const f of files) {
    const rel = path.relative(distDir, f);
    const html = fs.readFileSync(f, 'utf8');
    const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
    imgs.forEach((tag, i) => {
      if (!/\balt=/.test(tag)) noAlt.push(`${rel}: imagem #${i + 1}`);
      if (!/\bwidth=/.test(tag) || !/\bheight=/.test(tag))
        noDims.push(`${rel}: imagem #${i + 1} sem width/height`);
      if (i > 2 && !/loading="lazy"/.test(tag) && !/fetchpriority="high"/.test(tag))
        noLazy.push(`${rel}: imagem #${i + 1}`);
    });
    for (const a of html.match(/<a\b[^>]*target="_blank"[^>]*>/gi) ?? [])
      if (!/rel="[^"]*noopener/.test(a)) blankNoRel.push(`${rel}: ${a.slice(0, 80)}`);
    const ids = (html.match(/\sid="([^"]+)"/g) ?? []).map((m) => m.replace(/\sid="|"/g, ''));
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) dupIds.push(`${rel}: #${id}`);
      seen.add(id);
    }
    if (!/<title>[^<]{3,}<\/title>/.test(html)) missingMeta.push(`${rel}: sem <title>`);
    if (!/<meta name="description" content="[^"]{10,}"/.test(html))
      missingMeta.push(`${rel}: sem meta description`);
    if (!/<meta name="viewport"/.test(html)) missingMeta.push(`${rel}: sem meta viewport`);
    if (!/<html[^>]+lang=/.test(html)) missingMeta.push(`${rel}: sem lang`);
    if (!/<h1\b/.test(html)) missingMeta.push(`${rel}: sem H1`);
    for (const m of html.match(/\son(click|load|error|mouseover)="/gi) ?? [])
      inlineHandlers.push(`${rel}: ${m.trim()}`);
    for (const m of html.match(/(src|href)="http:\/\/[^"]+"/gi) ?? [])
      httpRes.push(`${rel}: ${m.slice(0, 80)}`);
  }
  checks.push(
    noAlt.length
      ? {
          id: 'img-alt',
          group: 'lint',
          status: 'fail',
          title: `${noAlt.length} imagem(ns) sem atributo alt`,
          items: noAlt.slice(0, 10),
          fix: 'alt',
        }
      : { id: 'img-alt', group: 'lint', status: 'pass', title: 'Todas as imagens têm alt' },
  );
  checks.push(
    blankNoRel.length
      ? {
          id: 'blank-rel',
          group: 'security',
          status: 'warning',
          title: `${blankNoRel.length} link(s) target=_blank sem rel="noopener"`,
          items: blankNoRel.slice(0, 10),
          fix: 'rel-noopener',
        }
      : { id: 'blank-rel', group: 'security', status: 'pass', title: 'Links externos com rel="noopener"' },
  );
  checks.push(
    dupIds.length
      ? {
          id: 'dup-ids',
          group: 'lint',
          status: 'warning',
          title: `${dupIds.length} id(s) duplicado(s)`,
          items: dupIds.slice(0, 10),
        }
      : { id: 'dup-ids', group: 'lint', status: 'pass', title: 'Sem ids duplicados' },
  );
  checks.push(
    missingMeta.length
      ? {
          id: 'meta',
          group: 'seo',
          status: 'fail',
          title: 'Metadados obrigatórios faltando',
          items: missingMeta.slice(0, 10),
          fix: 'meta',
        }
      : {
          id: 'meta',
          group: 'seo',
          status: 'pass',
          title: 'Title, description, viewport, lang e H1 presentes',
        },
  );
  checks.push(
    inlineHandlers.length
      ? {
          id: 'inline-js',
          group: 'security',
          status: 'warning',
          title: `${inlineHandlers.length} handler(s) inline (onclick…)`,
          items: inlineHandlers.slice(0, 10),
        }
      : { id: 'inline-js', group: 'security', status: 'pass', title: 'Sem handlers JS inline' },
  );
  checks.push(
    httpRes.length
      ? {
          id: 'http-res',
          group: 'security',
          status: 'warning',
          title: `${httpRes.length} recurso(s) em http:// (conteúdo misto)`,
          items: httpRes.slice(0, 10),
        }
      : { id: 'http-res', group: 'security', status: 'pass', title: 'Sem recursos http://' },
  );
  checks.push(
    noDims.length
      ? {
          id: 'img-dims',
          group: 'performance',
          status: 'warning',
          title: `${noDims.length} imagem(ns) sem width/height (causa CLS)`,
          items: noDims.slice(0, 10),
        }
      : { id: 'img-dims', group: 'performance', status: 'pass', title: 'Imagens com dimensões declaradas' },
  );
  checks.push(
    noLazy.length
      ? {
          id: 'img-lazy',
          group: 'performance',
          status: 'warning',
          title: `${noLazy.length} imagem(ns) abaixo da dobra sem lazy loading`,
          items: noLazy.slice(0, 10),
          fix: 'lazy',
        }
      : { id: 'img-lazy', group: 'performance', status: 'pass', title: 'Lazy loading aplicado' },
  );
  const hasHeaders = fs.existsSync(path.join(distDir, '_headers'));
  const headersTxt = hasHeaders ? fs.readFileSync(path.join(distDir, '_headers'), 'utf8') : '';
  const required = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Referrer-Policy',
    'Content-Security-Policy',
    'Strict-Transport-Security',
  ];
  const missingH = required.filter((h) => !headersTxt.includes(h));
  checks.push(
    missingH.length
      ? {
          id: 'headers',
          group: 'security',
          status: hasHeaders ? 'warning' : 'fail',
          title: hasHeaders
            ? `Headers de segurança faltando: ${missingH.join(', ')}`
            : 'Arquivo _headers ausente',
          fix: 'headers',
        }
      : {
          id: 'headers',
          group: 'security',
          status: 'pass',
          title: 'Headers de segurança configurados (_headers)',
        },
  );
  checks.push(
    fs.existsSync(path.join(distDir, 'robots.txt'))
      ? { id: 'robots', group: 'seo', status: 'pass', title: 'robots.txt presente' }
      : { id: 'robots', group: 'seo', status: 'warning', title: 'robots.txt ausente', fix: 'robots' },
  );
  checks.push(
    fs.existsSync(path.join(distDir, 'sitemap.xml'))
      ? { id: 'sitemap', group: 'seo', status: 'pass', title: 'sitemap.xml presente' }
      : { id: 'sitemap', group: 'seo', status: 'warning', title: 'sitemap.xml ausente (ok se noindex)' },
  );
  const idx = files.find((f) => f.endsWith('index.html'));
  if (idx) {
    const html = fs.readFileSync(idx, 'utf8');
    checks.push(
      /application\/ld\+json/.test(html)
        ? { id: 'ld', group: 'seo', status: 'pass', title: 'Dados estruturados (JSON-LD) presentes' }
        : { id: 'ld', group: 'seo', status: 'warning', title: 'Sem JSON-LD' },
    );
    checks.push(
      /property="og:title"/.test(html)
        ? { id: 'og', group: 'seo', status: 'pass', title: 'Open Graph presente' }
        : { id: 'og', group: 'seo', status: 'warning', title: 'Open Graph ausente' },
    );
    const secrets = /(sk_live_[0-9a-zA-Z]{16,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC )?PRIVATE KEY-----)/.test(
      html,
    );
    checks.push(
      secrets
        ? { id: 'secrets', group: 'security', status: 'fail', title: 'Possível credencial no HTML!' }
        : { id: 'secrets', group: 'security', status: 'pass', title: 'Nenhuma credencial no HTML' },
    );
  }
  return checks;
}

/** Links internos: arquivos e âncoras devem existir */
export function checkInternalLinks(distDir: string): QaCheck {
  const files = listHtmlFiles(distDir);
  const broken: string[] = [];
  let total = 0;
  for (const f of files) {
    const rel = path.relative(distDir, f);
    const html = fs.readFileSync(f, 'utf8');
    const ids = new Set((html.match(/\sid="([^"]+)"/g) ?? []).map((m) => m.replace(/\sid="|"/g, '')));
    const dirOfPage = path.dirname(f);
    for (const m of html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)) {
      const href = m[1];
      total++;
      if (/^(https?:|mailto:|tel:|whatsapp:|javascript:|data:)/i.test(href)) continue;
      if (href.startsWith('#')) {
        if (href.length > 1 && !ids.has(href.slice(1))) broken.push(`${rel}: âncora ${href} não existe`);
        continue;
      }
      const [p, hash] = href.split('#');
      const target = p.startsWith('/')
        ? resolveStaticFile(distDir, p)
        : resolveStaticFile(
            distDir,
            '/' +
              path.relative(distDir, path.resolve(dirOfPage, p)).replace(/\\/g, '/') +
              (p.endsWith('/') ? '/' : ''),
          );
      if (!target) broken.push(`${rel}: ${href} não encontrado`);
      else if (hash) {
        const h2 = fs.readFileSync(target, 'utf8');
        if (!h2.includes(`id="${hash}"`)) broken.push(`${rel}: âncora #${hash} não existe em ${href}`);
      }
    }
  }
  return broken.length
    ? {
        id: 'links-internal',
        group: 'links',
        status: 'fail',
        title: `${broken.length} link(s) interno(s) quebrado(s) de ${total}`,
        items: broken.slice(0, 15),
        fix: 'links',
      }
    : { id: 'links-internal', group: 'links', status: 'pass', title: `${total} links internos verificados` };
}
