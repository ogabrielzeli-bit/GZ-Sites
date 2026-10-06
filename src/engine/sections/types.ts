/**
 * Infra das seções: contexto de render, helpers de HTML seguros e definição de seção.
 */
import { z } from 'zod';
import type { ImageRef, PageConfig, SectionType, SiteConfig } from '@shared/site-config';
import type { Theme } from '../themes';
import { escapeHtml } from '@shared/utils';
import { icon } from '../icons';

export interface ResolvedImage {
  src: string;
  alt: string;
  width: number;
  height: number;
  placeholder: boolean;
}

export interface AssetResolver {
  /** resolve uma imagem: se ref ausente ou placeholder, gera SVG determinístico */
  image(
    ref: ImageRef | undefined | null,
    opts: { key: string; w: number; h: number; label: string },
  ): ResolvedImage;
  /** URL pública relativa de um asset */
  url(p: string): string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface RenderContext {
  config: SiteConfig;
  theme: Theme;
  page: PageConfig;
  index: number;
  assets: AssetResolver;
  nav: NavItem[];
  contact: {
    whatsappUrl: string | null;
    phoneHref: string | null;
    phoneDisplay: string | null;
    emailHref: string | null;
    instagramUrl: string | null;
  };
  /** CTA principal padrão do site (WhatsApp > formulário > telefone) */
  primaryCta: { label: string; href: string; kind: 'whatsapp' | 'form' | 'phone' | 'link' };
  /** caminho base relativo (para páginas internas) */
  base: string;
}

export interface SectionDef<P extends z.ZodTypeAny = z.ZodTypeAny> {
  type: SectionType;
  name: string;
  description: string;
  variants: { id: string; label: string }[];
  props: P;
  /** se true, a seção fica fora do fluxo (float/sticky) e não entra no menu */
  overlay?: boolean;
  render: (props: z.infer<P>, ctx: RenderContext, variant: string) => string;
}

export function defineSection<P extends z.ZodTypeAny>(def: SectionDef<P>): SectionDef<P> {
  return def;
}

// ---------------- helpers ----------------
export const esc = escapeHtml;

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function attrs(obj: Record<string, string | number | boolean | null | undefined>): string {
  return Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== false)
    .map(([k, v]) => (v === true ? k : `${k}="${esc(String(v))}"`))
    .join(' ');
}

/** Destaca a última palavra (ou texto entre *asteriscos*) com <em class="accent"> */
export function accentText(text: string, mode: 'last' | 'marks' | 'none' = 'marks'): string {
  if (mode === 'none') return esc(text);
  if (text.includes('*')) {
    return esc(text).replace(/\*([^*]+)\*/g, '<em class="accent">$1</em>');
  }
  if (mode === 'last') {
    const words = text.trim().split(' ');
    if (words.length < 2) return esc(text);
    const last = words.pop()!;
    return `${esc(words.join(' '))} <em class="accent">${esc(last)}</em>`;
  }
  return esc(text);
}

/**
 * Divide um HTML já escapado (saída de accentText) em palavras com spans (para text reveal).
 * Mantém o <em class="accent"> ao redor das palavras destacadas.
 */
export function splitWords(html: string): string {
  const OPEN = '\u0001';
  const CLOSE = '\u0002';
  const marked = html.replace(/<em class="accent">/g, OPEN).replace(/<\/em>/g, CLOSE);
  let inside = false;
  return marked
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => {
      let word = w;
      const opens = word.includes(OPEN);
      const closes = word.includes(CLOSE);
      word = word.replace(new RegExp(OPEN, 'g'), '').replace(new RegExp(CLOSE, 'g'), '');
      const accent = inside || opens;
      if (opens) inside = true;
      if (closes) inside = false;
      return `<span class="word">${accent ? `<em class="accent">${word}</em>` : word}</span>`;
    })
    .join(' ');
}

export function img(
  im: ResolvedImage,
  opts: { cls?: string; lazy?: boolean; sizes?: string; priority?: boolean } = {},
): string {
  const lazy = opts.priority ? false : opts.lazy !== false;
  return `<img ${attrs({
    src: im.src,
    alt: im.alt,
    width: im.width,
    height: im.height,
    loading: lazy ? 'lazy' : 'eager',
    decoding: lazy ? 'async' : 'sync',
    fetchpriority: opts.priority ? 'high' : undefined,
    class: opts.cls,
    sizes: opts.sizes,
  })}>`;
}

export interface ButtonSpec {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'whatsapp';
  size?: 'sm' | 'lg';
  icon?: string;
  arrow?: boolean;
  magnetic?: boolean;
  external?: boolean;
}

export function button(b: ButtonSpec): string {
  const cls = cx(
    'btn',
    b.variant === 'secondary' && 'btn--secondary',
    b.variant === 'ghost' && 'btn--ghost',
    b.variant === 'whatsapp' && 'btn--whatsapp',
    b.size === 'lg' && 'btn--lg',
    b.size === 'sm' && 'btn--sm',
  );
  const isExternal = b.external ?? /^https?:\/\//.test(b.href);
  const ic = b.icon ? icon(b.icon) : '';
  const arrow = b.arrow ? icon('arrow', 'btn__arrow') : '';
  return `<a ${attrs({
    class: cls,
    href: b.href,
    target: isExternal ? '_blank' : undefined,
    rel: isExternal ? 'noopener noreferrer' : undefined,
    'data-gz-magnetic': b.magnetic !== false ? '' : undefined,
  })}>${ic}<span>${esc(b.label)}</span>${arrow}</a>`;
}

export function sectionHead(o: {
  eyebrow?: string;
  title?: string;
  intro?: string;
  align?: 'left' | 'center' | 'split';
  accent?: 'last' | 'marks' | 'none';
  tag?: 'h2' | 'h1';
}): string {
  if (!o.title && !o.eyebrow && !o.intro) return '';
  const tag = o.tag ?? 'h2';
  const cls = cx(
    'section-head',
    o.align === 'center' && 'section-head--center',
    o.align === 'split' && 'section-head--split',
  );
  const left = `<div data-gz="reveal">${o.eyebrow ? `<p class="eyebrow">${esc(o.eyebrow)}</p>` : ''}${
    o.title
      ? `<${tag} class="h2" ${o.align !== 'split' ? '' : ''}>${accentText(o.title, o.accent ?? 'marks')}</${tag}>`
      : ''
  }${o.align !== 'split' && o.intro ? `<p class="lead">${esc(o.intro)}</p>` : ''}</div>`;
  const right = o.align === 'split' && o.intro ? `<p class="lead" data-gz="reveal">${esc(o.intro)}</p>` : '';
  return `<div class="${cls}">${left}${right}</div>`;
}

export function wrap(
  ctx: RenderContext,
  inner: string,
  o: {
    cls?: string;
    id?: string;
    tone?: 'default' | 'alt' | 'surface' | 'accent' | 'dark';
    container?: 'default' | 'wide' | 'text' | 'narrow' | 'none';
    tight?: boolean;
    attrs?: Record<string, string>;
  } = {},
): string {
  const tone = o.tone ?? 'default';
  const containerCls =
    o.container === 'none'
      ? ''
      : cx(
          'container',
          o.container === 'wide' && 'container--wide',
          o.container === 'text' && 'container--text',
          o.container === 'narrow' && 'container--narrow',
        );
  const body = o.container === 'none' ? inner : `<div class="${containerCls}">${inner}</div>`;
  return `<section ${attrs({
    id: o.id,
    class: cx('section', tone !== 'default' && `section--${tone}`, o.tight && 'section--tight', o.cls),
    ...(o.attrs ?? {}),
  })}>${body}</section>`;
}

export const ImageProp = z
  .object({
    src: z.string(),
    alt: z.string().default(''),
    width: z.number().optional(),
    height: z.number().optional(),
    placeholder: z.boolean().optional(),
  })
  .optional();

export const CtaProp = z.object({ label: z.string(), href: z.string().optional() }).optional();

export function resolveCta(
  ctx: RenderContext,
  cta: { label: string; href?: string } | undefined,
  fallbackLabel?: string,
): ButtonSpec | null {
  if (!cta && !fallbackLabel) return null;
  const label = cta?.label ?? fallbackLabel!;
  const href = cta?.href ?? ctx.primaryCta.href;
  const variant: ButtonSpec['variant'] = href.includes('wa.me') ? 'whatsapp' : 'primary';
  return { label, href, variant, arrow: true, icon: variant === 'whatsapp' ? 'whatsapp' : undefined };
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export { icon };
