/**
 * Seções V2: famílias de hero estruturalmente diferentes, unidades e galeria em filmstrip/stacked.
 */
import { z } from 'zod';
import { accentText, attrs, button, CtaProp, cx, defineSection, esc, icon, ImageProp, img, resolveCta, sectionHead, splitWords, wrap } from './types';

const HeroBase = z.object({
  eyebrow: z.string().optional(),
  headline: z.string(),
  subheadline: z.string().optional(),
  primaryCta: CtaProp,
  secondaryCta: CtaProp,
  image: ImageProp,
  images: z.array(ImageProp.unwrap()).default([]),
  badges: z.array(z.string()).default([]),
  services: z.array(z.string()).default([]),
  stats: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
});

function title(ctx: Parameters<typeof resolveCta>[0], text: string, cls = 'hero__title') {
  const reveal = ctx.config.animations.textReveal;
  return `<h1 class="${cls}" ${attrs({ 'data-gz': reveal ? 'text' : 'reveal' })}>${reveal ? splitWords(accentText(text)) : accentText(text)}</h1>`;
}
function ctas(ctx: Parameters<typeof resolveCta>[0], p: z.infer<typeof HeroBase>) {
  const primary = resolveCta(ctx, p.primaryCta, ctx.primaryCta.label);
  const secondary = p.secondaryCta ? button({ label: p.secondaryCta.label, href: p.secondaryCta.href ?? '#servicos', variant: 'secondary' }) : '';
  return `<div class="btn-group" data-gz="reveal">${primary ? button({ ...primary, size: 'lg' }) : ''}${secondary}</div>`;
}

/** Hero editorial: tipografia gigante, pouca imagem, muito espaço. */
export const heroEditorial = defineSection({
  type: 'hero-editorial',
  name: 'Hero Editorial',
  description: 'Tipografia gigante como protagonista; imagem pequena em faixa ou deslocada.',
  variants: [
    { id: 'statement', label: 'Declaração (texto + faixa de imagens)' },
    { id: 'offset', label: 'Assimétrico (texto + imagem deslocada)' },
  ],
  props: HeroBase,
  render(p, ctx, variant) {
    const imgs = p.images.length ? p.images : p.image ? [p.image] : [];
    const strip = imgs.slice(0, 3).map((im, i) => `<div class="media media--zoom" data-gz="image" data-gz-parallax="${(0.04 + i * 0.03).toFixed(2)}">${img(ctx.assets.image(im, { key: `hero-ed-${i}`, w: 900, h: 1100, label: 'Foto' }), { priority: i === 0 })}</div>`).join('');
    const svc = p.services.length ? `<ul class="hero-ed__services" data-gz="stagger">${p.services.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : '';
    if (variant === 'offset') {
      const im = ctx.assets.image(imgs[0], { key: 'hero-ed-offset', w: 1100, h: 1300, label: 'Foto principal' });
      return `<section class="hero hero-ed hero-ed--offset" id="inicio"><div class="container container--wide"><div class="hero-ed__grid"><div class="hero-ed__text">${p.eyebrow ? `<p class="eyebrow" data-gz="reveal">${esc(p.eyebrow)}</p>` : ''}${title(ctx, p.headline, 'hero__title hero-ed__title')}${p.subheadline ? `<p class="lead" data-gz="reveal">${esc(p.subheadline)}</p>` : ''}${ctas(ctx, p)}</div><div class="hero-ed__media" data-gz-parallax="0.1"><div class="media media--tall media--zoom" data-gz="image">${img(im, { priority: true })}</div>${svc}</div></div></div></section>`;
    }
    return `<section class="hero hero-ed" id="inicio"><div class="container container--wide">${p.eyebrow ? `<p class="eyebrow" data-gz="reveal">${esc(p.eyebrow)}</p>` : ''}${title(ctx, p.headline, 'hero__title hero-ed__title hero-ed__title--xl')}<div class="hero-ed__row"><div>${p.subheadline ? `<p class="lead" data-gz="reveal">${esc(p.subheadline)}</p>` : ''}${ctas(ctx, p)}</div>${svc}</div>${strip ? `<div class="hero-ed__strip">${strip}</div>` : ''}</div></section>`;
  },
});

/** Hero showcase: serviços/produtos em destaque ao lado da mídia. */
export const heroShowcase = defineSection({
  type: 'hero-showcase',
  name: 'Hero Showcase',
  description: 'Hero com os serviços mais procurados em destaque (cards) e mídia grande.',
  variants: [
    { id: 'services', label: 'Serviços em destaque' },
    { id: 'media', label: 'Mídia grande + lista' },
  ],
  props: HeroBase,
  render(p, ctx, variant) {
    const im = ctx.assets.image(p.image, { key: 'hero-show', w: 1400, h: 1000, label: 'Foto principal' });
    const services = p.services.length ? p.services : ctx.config.business.services.slice(0, 4).map((s) => s.title);
    const cards = `<ul class="hero-show__list" data-gz="stagger">${services.slice(0, 4).map((s, i) => `<li><span class="hero-show__num">${String(i + 1).padStart(2, '0')}</span><span>${esc(s)}</span>${icon('arrow-up-right')}</li>`).join('')}</ul>`;
    const text = `${p.eyebrow ? `<p class="eyebrow" data-gz="reveal">${esc(p.eyebrow)}</p>` : ''}${title(ctx, p.headline)}${p.subheadline ? `<p class="lead" data-gz="reveal">${esc(p.subheadline)}</p>` : ''}${ctas(ctx, p)}`;
    if (variant === 'media') return `<section class="hero hero-show hero-show--media" id="inicio"><div class="container container--wide"><div class="media media--16x9 media--zoom" data-gz="image" data-gz-parallax="0.08">${img(im, { priority: true })}</div><div class="hero-show__under"><div>${text}</div>${cards}</div></div></section>`;
    return `<section class="hero hero-show" id="inicio"><div class="container container--wide"><div class="hero-show__grid"><div>${text}</div><div class="hero-show__side"><div class="media media--4x3 media--zoom" data-gz="image">${img(im, { priority: true })}</div>${cards}</div></div></div></section>`;
  },
});

/** Hero layered: fotografias sobrepostas em camadas com parallax. */
export const heroLayered = defineSection({
  type: 'hero-layered',
  name: 'Hero em camadas',
  description: 'Duas ou três fotos sobrepostas com parallax independente e texto à esquerda.',
  variants: [{ id: 'default', label: 'Padrão' }],
  props: HeroBase,
  render(p, ctx) {
    const imgs = p.images.length ? p.images : p.image ? [p.image] : [];
    const layers = [0, 1, 2].map((i) => ctx.assets.image(imgs[i], { key: `hero-layer-${i}`, w: i === 0 ? 1000 : 700, h: i === 0 ? 1250 : 700, label: `Foto ${i + 1}` }));
    return `<section class="hero hero-layer" id="inicio"><div class="container container--wide"><div class="split split--wide-media"><div>${p.eyebrow ? `<p class="eyebrow" data-gz="reveal">${esc(p.eyebrow)}</p>` : ''}${title(ctx, p.headline)}${p.subheadline ? `<p class="lead" data-gz="reveal">${esc(p.subheadline)}</p>` : ''}${ctas(ctx, p)}</div><div class="hero-layer__stack"><div class="media hero-layer__a" data-gz="image" data-gz-parallax="0.06">${img(layers[0], { priority: true })}</div><div class="media hero-layer__b" data-gz="image" data-gz-parallax="0.16">${img(layers[1])}</div><div class="media hero-layer__c" data-gz="image" data-gz-parallax="0.26">${img(layers[2])}</div></div></div></div></section>`;
  },
});

/** Unidades / endereços */
export const locations = defineSection({
  type: 'locations',
  name: 'Unidades',
  description: 'Lista de unidades com endereço, WhatsApp, telefone, horário e link do Maps.',
  variants: [
    { id: 'cards', label: 'Cards' },
    { id: 'list', label: 'Lista' },
  ],
  props: z.object({
    eyebrow: z.string().optional(),
    title: z.string().optional(),
    intro: z.string().optional(),
    navLabel: z.string().optional(),
    id: z.string().optional(),
    tone: z.enum(['default', 'alt', 'surface', 'accent', 'dark']).default('default'),
    items: z.array(z.object({ name: z.string().default(''), address: z.string().default(''), city: z.string().default(''), state: z.string().default(''), phone: z.string().default(''), whatsapp: z.string().default(''), mapsUrl: z.string().default(''), openingHours: z.string().default('') })).default([]),
  }),
  render(p, ctx, variant) {
    const items = p.items.length ? p.items : (ctx.config.business as any).locations ?? [];
    if (!items.length) return '';
    const card = (l: (typeof items)[number], i: number) => {
      const wa = l.whatsapp ? `https://wa.me/${l.whatsapp.replace(/\D/g, '').replace(/^(?!55)/, '55')}` : '';
      const maps = l.mapsUrl || (l.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([l.address, l.city, l.state].filter(Boolean).join(', '))}` : '');
      return `<article class="card loc"><p class="eyebrow eyebrow--plain">${esc(l.name || `Unidade ${i + 1}`)}</p>${l.address ? `<h3>${esc(l.address)}</h3>` : ''}${l.city ? `<p>${esc([l.city, l.state].filter(Boolean).join('/'))}</p>` : ''}${l.openingHours ? `<p class="loc__hours">${icon('clock')} ${esc(l.openingHours)}</p>` : ''}<div class="btn-group mt-3">${wa ? button({ label: 'WhatsApp', href: wa, variant: 'whatsapp', size: 'sm', icon: 'whatsapp', magnetic: false }) : ''}${l.phone ? button({ label: esc(l.phone), href: `tel:${l.phone.replace(/\D/g, '')}`, variant: 'secondary', size: 'sm', icon: 'phone', magnetic: false }) : ''}${maps ? button({ label: 'Como chegar', href: maps, variant: 'ghost', size: 'sm', icon: 'pin', magnetic: false }) : ''}</div></article>`;
    };
    const body = `<div class="${cx(variant === 'list' ? 'grid' : 'grid grid-3')}" data-gz="stagger">${items.map(card).join('')}</div>`;
    return wrap(ctx, sectionHead({ eyebrow: p.eyebrow ?? 'Onde estamos', title: p.title ?? 'Nossas *unidades*', intro: p.intro }) + body, { id: p.id ?? 'unidades', tone: p.tone });
  },
});

export const V2_SECTIONS = [heroEditorial, heroShowcase, heroLayered, locations];
