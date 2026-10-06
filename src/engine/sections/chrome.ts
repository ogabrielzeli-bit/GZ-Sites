import { z } from 'zod';
import { attrs, button, cx, defineSection, esc, icon, type RenderContext } from './types';

const SOCIAL: {
  key: 'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'tiktok';
  label: string;
  prefix: string;
}[] = [
  { key: 'instagram', label: 'Instagram', prefix: 'https://instagram.com/' },
  { key: 'facebook', label: 'Facebook', prefix: 'https://facebook.com/' },
  { key: 'linkedin', label: 'LinkedIn', prefix: 'https://linkedin.com/company/' },
  { key: 'youtube', label: 'YouTube', prefix: 'https://youtube.com/@' },
  { key: 'tiktok', label: 'TikTok', prefix: 'https://tiktok.com/@' },
];

export function socialLinks(
  contact: Record<string, string | undefined>,
): { label: string; href: string; icon: string }[] {
  const out: { label: string; href: string; icon: string }[] = [];
  for (const s of SOCIAL) {
    const v = contact[s.key];
    if (!v) continue;
    const href = /^https?:\/\//.test(v) ? v : s.prefix + v.replace(/^@/, '');
    out.push({ label: s.label, href, icon: s.key });
  }
  return out;
}

function logoHtml(ctx: RenderContext): string {
  const b = ctx.config.brand;
  if (b.logo?.src)
    return `<img src="${esc(ctx.assets.url(b.logo.src))}" alt="${esc(b.logo.alt || b.name)}" width="${b.logo.width ?? 160}" height="${b.logo.height ?? 40}">`;
  return `<span class="header__logo-mark" aria-hidden="true"></span><span>${esc(b.logoText ?? b.name)}</span>`;
}

export const header = defineSection({
  type: 'header',
  name: 'Cabeçalho',
  description: 'Logo, navegação por âncoras e CTA. Fixo no topo, vira sólido ao rolar.',
  variants: [
    { id: 'default', label: 'Padrão (sólido)' },
    { id: 'transparent', label: 'Transparente sobre o hero' },
  ],
  overlay: true,
  props: z.object({
    ctaLabel: z.string().optional(),
    ctaHref: z.string().optional(),
    nav: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
  }),
  render(p, ctx, variant) {
    const nav = p.nav.length ? p.nav : ctx.nav;
    const ctaHref = p.ctaHref ?? ctx.primaryCta.href;
    const ctaLabel = p.ctaLabel ?? ctx.primaryCta.label;
    const overlay = variant === 'transparent';
    const navHtml = nav.map((n) => `<a href="${esc(n.href)}">${esc(n.label)}</a>`).join('');
    return `<header class="${cx('header', overlay && 'header--transparent header--overlay')}" data-gz-header><div class="container header__inner"><a class="header__logo" href="${esc(
      ctx.base,
    )}" aria-label="${esc(ctx.config.brand.name)} — início">${logoHtml(ctx)}</a><nav class="nav" aria-label="Navegação principal">${navHtml}</nav><div class="flex" style="gap:.75rem"><span class="header__cta">${button(
      {
        label: ctaLabel,
        href: ctaHref,
        size: 'sm',
        variant: ctaHref.includes('wa.me') ? 'whatsapp' : 'primary',
        icon: ctaHref.includes('wa.me') ? 'whatsapp' : undefined,
      },
    )}</span><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Abrir menu" data-gz-menu-toggle><span></span></button></div></div></header><div class="mobile-menu" id="mobile-menu" data-gz-mobile-menu><nav aria-label="Menu">${navHtml}</nav>${button(
      {
        label: ctaLabel,
        href: ctaHref,
        size: 'lg',
        variant: ctaHref.includes('wa.me') ? 'whatsapp' : 'primary',
        icon: ctaHref.includes('wa.me') ? 'whatsapp' : undefined,
        magnetic: false,
      },
    )}</div>`;
  },
});

export const footer = defineSection({
  type: 'footer',
  name: 'Rodapé',
  description: 'Marca, links, contato e redes. Variante com nome gigante.',
  variants: [
    { id: 'columns', label: 'Colunas' },
    { id: 'big', label: 'Colunas + nome gigante' },
    { id: 'minimal', label: 'Minimal (uma linha)' },
  ],
  props: z.object({
    text: z.string().optional(),
    showSocial: z.boolean().default(true),
    credits: z.string().optional(),
    creditsUrl: z.string().optional(),
  }),
  render(p, ctx, variant) {
    const b = ctx.config.brand;
    const c = ctx.config.contact;
    const year = new Date().getFullYear();
    const social = p.showSocial ? socialLinks(c as Record<string, string | undefined>) : [];
    const socialHtml = social.length
      ? `<div class="social">${social.map((s) => `<a href="${esc(s.href)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(s.label)}">${icon(s.icon)}</a>`).join('')}</div>`
      : '';
    const credits = p.credits
      ? `<a href="${esc(p.creditsUrl ?? '#')}" ${p.creditsUrl ? 'target="_blank" rel="noopener noreferrer"' : ''}>${esc(p.credits)}</a>`
      : '';
    const bottom = `<div class="footer__bottom"><span>© ${year} ${esc(b.name)}. Todos os direitos reservados.</span>${credits ? `<span>Site por ${credits}</span>` : ''}</div>`;
    if (variant === 'minimal') {
      return `<footer class="footer"><div class="container"><div class="flex" style="justify-content:space-between"><a class="header__logo" href="${esc(ctx.base)}">${logoHtml(ctx)}</a>${socialHtml}</div>${bottom}</div></footer>`;
    }
    const contactItems = [
      ctx.contact.whatsappUrl
        ? `<li><a href="${esc(ctx.contact.whatsappUrl)}" target="_blank" rel="noopener noreferrer">WhatsApp: ${esc(ctx.contact.phoneDisplay ?? '')}</a></li>`
        : '',
      ctx.contact.phoneHref && !ctx.contact.whatsappUrl
        ? `<li><a href="${esc(ctx.contact.phoneHref)}">${esc(ctx.contact.phoneDisplay ?? c.phone ?? '')}</a></li>`
        : '',
      c.email ? `<li><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></li>` : '',
      c.address ? `<li>${esc(c.address)}</li>` : '',
    ].join('');
    const serviceItems = ctx.config.business.services
      .slice(0, 6)
      .map((s) => `<li><a href="#servicos">${esc(s.title)}</a></li>`)
      .join('');
    const navItems = ctx.nav.map((n) => `<li><a href="${esc(n.href)}">${esc(n.label)}</a></li>`).join('');
    const grid = `<div class="footer__grid"><div class="footer__brand"><a class="header__logo" href="${esc(ctx.base)}">${logoHtml(ctx)}</a><p>${esc(
      p.text ?? b.tagline ?? ctx.config.business.description ?? '',
    )}</p>${socialHtml}</div><div><h4>Navegação</h4><ul>${navItems}</ul></div><div><h4>Serviços</h4><ul>${serviceItems}</ul></div><div><h4>Contato</h4><ul>${contactItems}</ul></div></div>`;
    const big =
      variant === 'big' ? `<div class="footer__wordmark" aria-hidden="true">${esc(b.name)}</div>` : '';
    return `<footer class="${cx('footer', variant === 'big' && 'footer--big')}" ${attrs({ id: 'rodape' })}><div class="container">${grid}${big}${bottom}</div></footer>`;
  },
});

export const CHROME_SECTIONS = [header, footer];
