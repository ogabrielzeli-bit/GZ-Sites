/**
 * Auto-fix: correções seguras e determinísticas. Nunca altera design.
 * Opera no site.config (fonte da verdade) e, para ajustes de HTML, no dist/ gerado.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { SiteConfig } from '@shared/site-config';
import { parseSiteConfig } from '@shared/site-config';
import { normalizeWhatsapp } from '@shared/utils';
import { getSection } from '../engine/sections';
import { netlifyHeaders } from '../engine/render/site';
import { listHtmlFiles } from './static-checks';

export interface AutofixResult {
  config: SiteConfig;
  applied: { id: string; description: string }[];
  needsRebuild: boolean;
}

export const AUTOFIXES: { id: string; description: string }[] = [
  { id: 'alt', description: 'Preenche alt em imagens sem texto alternativo' },
  { id: 'meta', description: 'Preenche title/description de SEO faltantes' },
  { id: 'rel-noopener', description: 'Adiciona rel="noopener noreferrer" em links target=_blank' },
  { id: 'lazy', description: 'Adiciona loading="lazy" em imagens abaixo da dobra' },
  { id: 'headers', description: 'Regera o arquivo _headers com headers de segurança' },
  { id: 'robots', description: 'Cria robots.txt' },
  { id: 'links', description: 'Aponta âncoras internas inexistentes para #contato' },
  { id: 'variants', description: 'Corrige variantes de seção inválidas' },
  { id: 'whatsapp', description: 'Normaliza o número de WhatsApp (DDI 55, só dígitos)' },
  { id: 'sections', description: 'Remove seções de tipo desconhecido' },
];

export function listAutofixes() {
  return AUTOFIXES;
}

export function applyAutofix(configInput: unknown, distDir: string | null, only?: string[]): AutofixResult {
  const applied: AutofixResult['applied'] = [];
  const want = (id: string) => !only || only.includes(id);
  const raw = JSON.parse(JSON.stringify(configInput ?? {})) as any;
  let needsRebuild = false;

  // --- correções no config (antes de validar) ---
  if (want('sections') && Array.isArray(raw.pages)) {
    for (const page of raw.pages) {
      if (!Array.isArray(page.sections)) continue;
      const before = page.sections.length;
      page.sections = page.sections.filter((s: any) => s && getSection(s.type));
      if (page.sections.length !== before) {
        applied.push({
          id: 'sections',
          description: `${before - page.sections.length} seção(ões) desconhecida(s) removida(s) em ${page.path}`,
        });
        needsRebuild = true;
      }
    }
  }
  if (want('variants') && Array.isArray(raw.pages)) {
    for (const page of raw.pages) {
      for (const s of page.sections ?? []) {
        const def = getSection(s.type);
        if (def && s.variant && !def.variants.some((v) => v.id === s.variant)) {
          applied.push({
            id: 'variants',
            description: `Seção ${s.type}: variante "${s.variant}" → "${def.variants[0].id}"`,
          });
          s.variant = def.variants[0].id;
          needsRebuild = true;
        }
      }
    }
  }
  if (want('whatsapp') && raw.contact?.whatsapp) {
    const n = normalizeWhatsapp(raw.contact.whatsapp);
    if (n && n !== raw.contact.whatsapp) {
      applied.push({ id: 'whatsapp', description: `WhatsApp normalizado: ${raw.contact.whatsapp} → ${n}` });
      raw.contact.whatsapp = n;
      needsRebuild = true;
    }
  }
  if (want('meta')) {
    raw.seo = raw.seo ?? {};
    if (!raw.seo.title && raw.brand?.name) {
      raw.seo.title = `${raw.brand.name}${raw.business?.city ? ' · ' + raw.business.city : ''}`;
      applied.push({ id: 'meta', description: 'Title de SEO preenchido' });
      needsRebuild = true;
    }
    if (!raw.seo.description && (raw.brand?.tagline || raw.business?.description)) {
      raw.seo.description = String(raw.brand?.tagline || raw.business?.description).slice(0, 158);
      applied.push({ id: 'meta', description: 'Meta description preenchida' });
      needsRebuild = true;
    }
  }
  if (want('alt')) {
    let count = 0;
    const brand = raw.brand?.name ?? 'Imagem';
    const walk = (v: any, label: string) => {
      if (Array.isArray(v)) return v.forEach((x) => walk(x, label));
      if (v && typeof v === 'object') {
        if (typeof v.src === 'string' && (v.alt === undefined || v.alt === '')) {
          v.alt = `${brand} — ${label}`;
          count++;
        }
        for (const [k, val] of Object.entries(v))
          walk(val, typeof v.title === 'string' ? v.title : k === 'image' || k === 'logo' ? label : k);
      }
    };
    walk(raw, 'foto');
    if (count) {
      applied.push({ id: 'alt', description: `${count} imagem(ns) receberam alt` });
      needsRebuild = true;
    }
  }
  if (want('links') && Array.isArray(raw.pages)) {
    const ids = new Set<string>(['contato', 'inicio', 'conteudo', 'rodape']);
    for (const page of raw.pages)
      for (const s of page.sections ?? []) {
        if (s.id) ids.add(s.id);
        if (s.props?.id) ids.add(s.props.id);
        const def = getSection(s.type);
        if (def && !s.props?.id) {
          const map: Record<string, string> = {
            services: 'servicos',
            about: 'sobre',
            faq: 'faq',
            testimonials: 'depoimentos',
            projects: 'projetos',
            gallery: 'galeria',
            process: 'processo',
            benefits: 'diferenciais',
            products: 'produtos',
            catalog: 'catalogo',
            cta: 'cta',
            form: 'formulario',
            map: 'mapa',
          };
          if (map[s.type]) ids.add(map[s.type]);
        }
      }
    let fixed = 0;
    const walk = (v: any) => {
      if (Array.isArray(v)) return v.forEach(walk);
      if (v && typeof v === 'object') {
        if (
          typeof v.href === 'string' &&
          v.href.startsWith('#') &&
          v.href.length > 1 &&
          !ids.has(v.href.slice(1))
        ) {
          v.href = '#contato';
          fixed++;
        }
        Object.values(v).forEach(walk);
      }
    };
    walk(raw.pages);
    if (fixed) {
      applied.push({
        id: 'links',
        description: `${fixed} âncora(s) inválida(s) redirecionadas para #contato`,
      });
      needsRebuild = true;
    }
  }

  const config = parseSiteConfig(raw);

  // --- correções diretas no dist (quando não vai rebuildar, ou além dele) ---
  if (distDir && fs.existsSync(distDir)) {
    for (const f of listHtmlFiles(distDir)) {
      let html = fs.readFileSync(f, 'utf8');
      const orig = html;
      if (want('rel-noopener'))
        html = html.replace(/<a\b([^>]*target="_blank"[^>]*)>/gi, (m, attrs: string) =>
          /rel="/.test(attrs)
            ? /noopener/.test(attrs)
              ? m
              : m.replace(/rel="([^"]*)"/, 'rel="$1 noopener noreferrer"')
            : `<a${attrs} rel="noopener noreferrer">`,
        );
      if (want('lazy')) {
        let i = 0;
        html = html.replace(/<img\b[^>]*>/gi, (tag) =>
          ++i > 3 && !/loading=/.test(tag) && !/fetchpriority="high"/.test(tag)
            ? tag.replace(/<img\b/, '<img loading="lazy"')
            : tag,
        );
      }
      if (want('alt')) html = html.replace(/<img\b(?![^>]*\balt=)([^>]*)>/gi, `<img alt=""$1>`);
      if (html !== orig) {
        fs.writeFileSync(f, html);
        applied.push({ id: 'html', description: `HTML ajustado: ${path.relative(distDir, f)}` });
      }
    }
    if (want('headers')) {
      const hf = path.join(distDir, '_headers');
      const expected = netlifyHeaders(config);
      if (!fs.existsSync(hf) || fs.readFileSync(hf, 'utf8') !== expected) {
        fs.writeFileSync(hf, expected);
        applied.push({ id: 'headers', description: '_headers regerado com headers de segurança' });
      }
    }
    if (want('robots') && !fs.existsSync(path.join(distDir, 'robots.txt'))) {
      fs.writeFileSync(
        path.join(distDir, 'robots.txt'),
        config.seo.noindex ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n',
      );
      applied.push({ id: 'robots', description: 'robots.txt criado' });
    }
  }
  return { config, applied, needsRebuild };
}
