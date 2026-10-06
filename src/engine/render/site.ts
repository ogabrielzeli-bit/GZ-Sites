/**
 * Renderizador: SiteConfig → arquivos estáticos (HTML, CSS, JS, SVGs, robots, sitemap, headers Netlify).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { ImageRef, PageConfig, SiteConfig } from '@shared/site-config';
import { parseSiteConfig } from '@shared/site-config';
import { VIDEO_EXT_RE } from '@shared/v2';
import { escapeHtml, formatPhoneBR, instagramUrl, whatsappLink } from '@shared/utils';
import { getTheme, googleFontsUrl, type Theme } from '../themes';
import { buildCss } from '../css';
import {
  getSection,
  type AssetResolver,
  type NavItem,
  type RenderContext,
  type ResolvedImage,
} from '../sections';
import { placeholderSvg } from '../placeholders';
import { getCopy } from '../copy';
import { RUNTIME_DIST } from '../runtime/paths';

export interface RenderOptions {
  /** resolve uma src de imagem do config para um arquivo local (absoluto) para ser copiado ao site */
  localFile?: (src: string) => string | null;
  /** inclui o runtime JS (gsap) — default true */
  includeRuntime?: boolean;
  /** base pública (ex.: "/previews/abc/") — usada para links absolutos quando necessário */
  publicBase?: string;
}

export interface RenderedFile {
  path: string;
  content: string | Buffer;
}

export interface RenderedSite {
  files: RenderedFile[];
  pages: { path: string; file: string; title: string }[];
  warnings: string[];
  config: SiteConfig;
}

const PLACEHOLDER_LABELS = true;

function pagePathToFile(p: string): string {
  if (p === '/' || p === '') return 'index.html';
  return `${p.replace(/^\/|\/$/g, '')}/index.html`;
}

function relBase(pagePath: string): string {
  if (pagePath === '/' || pagePath === '') return './';
  const depth = pagePath.replace(/^\/|\/$/g, '').split('/').length;
  return '../'.repeat(depth);
}

export function renderSite(input: SiteConfig | unknown, opts: RenderOptions = {}): RenderedSite {
  const config = parseSiteConfig(input);
  const theme = getTheme(config.theme.id);
  const copy = getCopy(config.business.segment);
  const files = new Map<string, string | Buffer>();
  const warnings: string[] = [];
  const emitted = new Set<string>();

  // --- assets ---
  const localFile = opts.localFile ?? (() => null);
  const assetFor = (src: string): string => {
    // já é URL absoluta ou data URI
    if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src;
    const abs = localFile(src);
    if (abs && fs.existsSync(abs)) {
      const name = path.basename(abs);
      const out = `assets/${VIDEO_EXT_RE.test(name) ? 'video' : 'img'}/${name}`;
      if (!emitted.has(out)) {
        files.set(out, fs.readFileSync(abs));
        emitted.add(out);
      }
      // URL segura mesmo com espaços/acentos no nome do arquivo
      return out.split('/').map(encodeURIComponent).join('/');
    }
    if (src.startsWith('assets/')) return src;
    warnings.push(`Imagem não encontrada: ${src}`);
    return src;
  };

  function makeAssets(base: string): AssetResolver {
    return {
      image(ref: ImageRef | undefined | null, o): ResolvedImage {
        if (ref?.src && VIDEO_EXT_RE.test(ref.src)) {
          // um vídeo nunca pode ser renderizado como <img>: cai para placeholder e avisa
          warnings.push(
            `Vídeo usado como imagem (${ref.src}) em "${o.key}" — ignorado; use o hero em vídeo.`,
          );
          ref = null;
        }
        if (ref?.src && !ref.placeholder) {
          const rel = assetFor(ref.src);
          const isLocal = !/^(https?:)?\/\//.test(rel) && !rel.startsWith('data:');
          return {
            src: isLocal ? base + rel : rel,
            alt: ref.alt || o.label,
            width: ref.width ?? o.w,
            height: ref.height ?? o.h,
            placeholder: false,
          };
        }
        const file = `assets/placeholders/${o.key}.svg`;
        if (!emitted.has(file)) {
          files.set(
            file,
            placeholderSvg({
              width: o.w,
              height: o.h,
              seed: `${config.brand.name}:${o.key}`,
              palette: theme.placeholderPalette,
              style: copy.placeholderStyle,
              label: o.label,
              showLabel: PLACEHOLDER_LABELS && config.previewMode,
            }),
          );
          emitted.add(file);
        }
        return { src: base + file, alt: ref?.alt || o.label, width: o.w, height: o.h, placeholder: true };
      },
      url(p: string) {
        const rel = assetFor(p);
        return /^(https?:)?\/\//.test(rel) || rel.startsWith('data:') ? rel : base + rel;
      },
    };
  }

  // --- contato ---
  const waUrl = whatsappLink(config.contact.whatsapp, config.contact.whatsappMessage);
  const phoneRaw = config.contact.phone ?? config.contact.whatsapp;
  const phoneDigits = phoneRaw ? phoneRaw.replace(/\D/g, '') : '';
  const contact: RenderContext['contact'] = {
    whatsappUrl: waUrl,
    phoneHref: phoneDigits ? `tel:+${phoneDigits.startsWith('55') ? phoneDigits : '55' + phoneDigits}` : null,
    phoneDisplay: phoneRaw ? formatPhoneBR(phoneRaw) : null,
    emailHref: config.contact.email ? `mailto:${config.contact.email}` : null,
    instagramUrl: instagramUrl(config.contact.instagram),
  };
  const primaryCta: RenderContext['primaryCta'] = waUrl
    ? { label: 'Falar no WhatsApp', href: waUrl, kind: 'whatsapp' }
    : contact.phoneHref
      ? { label: 'Ligar agora', href: contact.phoneHref, kind: 'phone' }
      : { label: 'Fale conosco', href: '#contato', kind: 'form' };

  // --- navegação (home: âncoras; outras páginas: links) ---
  const home = config.pages.find((p) => p.path === '/') ?? config.pages[0];
  const nav: NavItem[] = [];
  for (const s of home.sections) {
    if (!s.enabled) continue;
    const def = getSection(s.type);
    if (!def || def.overlay) continue;
    const label = (s.props as any).navLabel as string | undefined;
    const id = ((s.props as any).id as string | undefined) ?? defaultIdFor(s.type);
    if (label && id) nav.push({ label, href: `#${id}` });
  }
  for (const p of config.pages)
    if (p.path !== '/' && !p.hidden) nav.push({ label: p.title, href: p.path.replace(/\/$/, '') + '/' });

  // --- CSS ---
  files.set('assets/site.css', buildCss(theme, config));

  // --- runtime ---
  const includeRuntime = opts.includeRuntime !== false && config.animations.enabled !== false;
  let runtimeOk = false;
  if (includeRuntime) {
    if (fs.existsSync(RUNTIME_DIST)) {
      files.set('assets/gz-runtime.js', fs.readFileSync(RUNTIME_DIST, 'utf8'));
      runtimeOk = true;
    } else
      warnings.push('Runtime JS não encontrado (rode `npm run build:runtime`). Site gerado sem animações.');
  }

  // --- páginas ---
  const pages: RenderedSite['pages'] = [];
  for (const page of config.pages) {
    const base = relBase(page.path);
    const assets = makeAssets(base);
    const ctx: RenderContext = {
      config,
      theme,
      page,
      index: 0,
      assets,
      nav: nav.map((n) =>
        n.href.startsWith('#')
          ? { ...n, href: page.path === '/' ? n.href : base + n.href }
          : { ...n, href: base + n.href.replace(/^\//, '') },
      ),
      contact,
      primaryCta,
      base,
    };
    const html = renderPage(page, ctx, { runtime: runtimeOk, warnings, base });
    const file = pagePathToFile(page.path);
    files.set(file, html);
    pages.push({ path: page.path, file, title: page.title });
  }

  // --- favicon ---
  if (!config.brand.favicon) files.set('assets/favicon.svg', faviconSvg(config.brand.name, theme));

  // --- SEO / Netlify ---
  const siteUrl = config.seo.siteUrl?.replace(/\/$/, '');
  files.set(
    'robots.txt',
    config.seo.noindex
      ? 'User-agent: *\nDisallow: /\n'
      : `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`,
  );
  if (!config.seo.noindex) {
    const urls = pages
      .map(
        (p) =>
          `  <url><loc>${escapeHtml((siteUrl ?? '') + (p.path === '/' ? '/' : p.path.replace(/\/$/, '') + '/'))}</loc></url>`,
      )
      .join('\n');
    files.set(
      'sitemap.xml',
      `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    );
  }
  files.set('_headers', netlifyHeaders(config));
  files.set('_redirects', `/index.html / 301\n`);

  return {
    files: Array.from(files.entries()).map(([p, content]) => ({ path: p, content })),
    pages,
    warnings,
    config,
  };
}

function defaultIdFor(type: string): string | undefined {
  const map: Record<string, string> = {
    services: 'servicos',
    about: 'sobre',
    contact: 'contato',
    faq: 'faq',
    testimonials: 'depoimentos',
    projects: 'projetos',
    'portfolio-masonry': 'portfolio',
    gallery: 'galeria',
    process: 'processo',
    timeline: 'processo',
    benefits: 'diferenciais',
    products: 'produtos',
    catalog: 'catalogo',
    'horizontal-scroll': 'destaques',
    pricing: 'planos',
    team: 'equipe',
  };
  return map[type];
}

function renderPage(
  page: PageConfig,
  ctx: RenderContext,
  o: { runtime: boolean; warnings: string[]; base: string },
): string {
  const { config, theme } = ctx;
  const body: string[] = [];
  const overlays: string[] = [];
  let headerHtml = '';
  let footerHtml = '';
  let idx = 0;
  for (const s of page.sections) {
    if (!s.enabled) continue;
    const def = getSection(s.type);
    if (!def) {
      o.warnings.push(`Seção desconhecida: ${s.type}`);
      continue;
    }
    const variant =
      s.variant && def.variants.some((v) => v.id === s.variant) ? s.variant : def.variants[0].id;
    const parsed = def.props.safeParse({ ...s.props, ...(s.id ? { id: s.id } : {}) });
    if (!parsed.success) {
      o.warnings.push(
        `Props inválidas em ${s.type}: ${parsed.error.issues.map((i) => i.path.join('.') + ' ' + i.message).join('; ')}`,
      );
      continue;
    }
    let html = '';
    try {
      html = def.render(parsed.data, { ...ctx, index: idx++ }, variant);
    } catch (e) {
      o.warnings.push(`Erro ao renderizar ${s.type}: ${(e as Error).message}`);
      continue;
    }
    if (s.type === 'header') headerHtml = html;
    else if (s.type === 'footer') footerHtml = html;
    else if (def.overlay) overlays.push(html);
    else body.push(html);
  }
  if (!headerHtml) headerHtml = getSection('header')!.render({ nav: [] }, ctx, 'default');
  if (!footerHtml) footerHtml = getSection('footer')!.render({ showSocial: true }, ctx, 'columns');

  const title =
    page.path === '/' ? config.seo.title || config.brand.name : `${page.title} · ${config.brand.name}`;
  const description = page.description || config.seo.description || config.brand.tagline || '';
  const siteUrl = config.seo.siteUrl?.replace(/\/$/, '');
  const canonical = siteUrl
    ? `${siteUrl}${page.path === '/' ? '/' : page.path.replace(/\/$/, '') + '/'}`
    : null;
  const ogImage = config.seo.ogImage
    ? siteUrl
      ? siteUrl + '/' + config.seo.ogImage.replace(/^\//, '')
      : config.seo.ogImage
    : null;
  const fav = config.brand.favicon ? ctx.assets.url(config.brand.favicon) : `${o.base}assets/favicon.svg`;
  const htmlClasses = [
    'gz',
    `theme-${theme.id}`,
    `texture-${theme.texture}`,
    `img-treat-${theme.imageTreatment}`,
    `btn-style-${theme.button}`,
    `card-style-${theme.card}`,
    `anim-${config.animations.intensity}`,
  ].join(' ');
  const hasSticky = page.sections.some((s) => s.type === 'sticky-cta' && s.enabled);
  const bodyClasses = [hasSticky && 'has-sticky-cta', config.previewMode && 'has-preview-bar']
    .filter(Boolean)
    .join(' ');
  const jsonLd = localBusinessJsonLd(config, siteUrl);
  const fonts = googleFontsUrl(theme, config.theme.overrides?.fonts);
  const analytics = analyticsSnippet(config);
  const previewBar = config.previewMode
    ? `<div class="gz-preview-bar">Prévia criada por <strong>GZ Sites</strong> · Sua loja fecha. Seu site não.</div>`
    : '';

  return `<!doctype html>
<html lang="${escapeHtml(config.seo.lang)}" class="${htmlClasses}" data-anim-intensity="${config.animations.intensity}" data-motion="${config.animations.profile}" data-parallax="${config.animations.parallax ? '1' : '0'}" data-magnetic="${config.animations.magnetic ? '1' : '0'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
${config.seo.noindex ? '<meta name="robots" content="noindex, nofollow">' : ''}
${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:site_name" content="${escapeHtml(config.brand.name)}">
<meta property="og:locale" content="pt_BR">
${canonical ? `<meta property="og:url" content="${escapeHtml(canonical)}">` : ''}
${ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}">` : ''}
<meta name="twitter:card" content="${ogImage ? 'summary_large_image' : 'summary'}">
<meta name="theme-color" content="${escapeHtml(theme.colors.bg)}">
<link rel="icon" href="${escapeHtml(fav)}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${escapeHtml(fonts)}">
<link rel="stylesheet" href="${o.base}assets/site.css">
<script>document.documentElement.classList.add('gz-js');if(matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('gz-reduced');</script>
<script type="application/ld+json">${jsonLd}</script>
${analytics}
</head>
<body class="${bodyClasses}">
${previewBar}
<a class="skip-link" href="#conteudo">Pular para o conteúdo</a>
${headerHtml}
<main id="conteudo">
${body.join('\n')}
</main>
${footerHtml}
${overlays.join('\n')}
${o.runtime ? `<script src="${o.base}assets/gz-runtime.js" defer></script>` : ''}
</body>
</html>`;
}

function localBusinessJsonLd(config: SiteConfig, siteUrl?: string): string {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: config.brand.name,
    description: config.seo.description,
    url: siteUrl ?? undefined,
    telephone: config.contact.phone ?? config.contact.whatsapp ?? undefined,
    email: config.contact.email ?? undefined,
    address:
      config.contact.address || config.business.city
        ? {
            '@type': 'PostalAddress',
            streetAddress: config.contact.address ?? undefined,
            addressLocality: config.business.city ?? undefined,
            addressRegion: config.business.state ?? undefined,
            addressCountry: 'BR',
          }
        : undefined,
    sameAs: [
      config.contact.instagram ? instagramUrl(config.contact.instagram) : null,
      config.contact.facebook ?? null,
    ].filter(Boolean),
    openingHours: config.business.hours.length
      ? config.business.hours.map((h) => `${h.days} ${h.hours}`)
      : undefined,
    areaServed: config.business.serviceAreas.length ? config.business.serviceAreas : undefined,
  };
  return JSON.stringify(data, (_k, v) =>
    v === undefined || (Array.isArray(v) && !v.length) ? undefined : v,
  ).replace(/</g, '\\u003c');
}

function analyticsSnippet(config: SiteConfig): string {
  const a = config.integrations.analytics;
  if (a.provider === 'plausible' && a.id)
    return `<script defer data-domain="${escapeHtml(a.id)}" src="https://plausible.io/js/script.js"></script>`;
  if (a.provider === 'ga4' && a.id)
    return `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(a.id)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${escapeHtml(a.id)}');</script>`;
  return '';
}

function faviconSvg(name: string, theme: Theme): string {
  const letter = (name.trim()[0] ?? 'G').toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="${theme.radius === 'none' ? 0 : 14}" fill="${theme.colors.accent}"/><text x="32" y="43" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-weight="800" font-size="34" fill="${theme.colors.accentContrast}">${escapeHtml(letter)}</text></svg>`;
}

export function netlifyHeaders(config: SiteConfig): string {
  const a = config.integrations.analytics;
  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    a.provider === 'plausible' ? 'https://plausible.io' : '',
    a.provider === 'ga4' ? 'https://www.googletagmanager.com https://www.google-analytics.com' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const connectSrc = [
    "'self'",
    a.provider === 'plausible' ? 'https://plausible.io' : '',
    a.provider === 'ga4' ? 'https://www.google-analytics.com https://analytics.google.com' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const csp = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    `font-src 'self' https://fonts.gstatic.com data:`,
    `img-src 'self' data: https:`,
    `frame-src https://www.google.com https://maps.google.com`,
    `connect-src ${connectSrc}`,
    `form-action 'self' https://wa.me https://api.whatsapp.com`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');
  return `/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains
  Content-Security-Policy: ${csp}
/assets/*
  Cache-Control: public, max-age=31536000, immutable
`;
}

/** Escreve os arquivos renderizados em disco */
export function writeRenderedSite(site: RenderedSite, outDir: string) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of site.files) {
    const target = path.join(outDir, f.path);
    if (!path.resolve(target).startsWith(path.resolve(outDir)))
      throw new Error('Caminho inválido: ' + f.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, f.content);
  }
}
