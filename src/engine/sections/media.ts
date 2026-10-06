import { z } from 'zod';
import {
  attrs,
  button,
  CtaProp,
  cx,
  defineSection,
  esc,
  icon,
  ImageProp,
  img,
  initials,
  resolveCta,
  sectionHead,
  wrap,
} from './types';
import type { RenderContext } from './types';

const Tone = z.enum(['default', 'alt', 'surface', 'accent', 'dark']).default('default');
const Head = {
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  intro: z.string().optional(),
  navLabel: z.string().optional(),
  tone: Tone,
  id: z.string().optional(),
};
const ProductItem = z.object({
  title: z.string(),
  description: z.string().default(''),
  image: ImageProp,
  price: z.string().optional(),
  tags: z.array(z.string()).optional(),
  icon: z.string().optional(),
});
const ProjectItem = z.object({
  title: z.string(),
  category: z.string().optional(),
  description: z.string().optional(),
  image: ImageProp,
  images: z.array(ImageProp.unwrap()).optional(),
  year: z.string().optional(),
});

// ---------------- Produtos / Catálogo ----------------
function productCard(it: z.infer<typeof ProductItem>, i: number, ctx: RenderContext) {
  const im = ctx.assets.image(it.image, { key: `product-${i}`, w: 900, h: 900, label: `Foto: ${it.title}` });
  const tag = it.tags?.[0];
  return `<article class="product"><a class="media media--zoom media--1x1" href="${esc(ctx.primaryCta.href)}" ${ctx.primaryCta.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''} data-gz="image">${
    tag ? `<span class="product__tag">${esc(tag)}</span>` : ''
  }${img(im)}</a><div class="product__meta"><h3>${esc(it.title)}</h3>${it.price ? `<span class="product__price">${esc(it.price)}</span>` : ''}</div>${
    it.description ? `<p>${esc(it.description)}</p>` : ''
  }</article>`;
}
export const products = defineSection({
  type: 'products',
  name: 'Produtos',
  description: 'Grade de produtos com imagem, preço e etiqueta.',
  variants: [
    { id: 'grid', label: 'Grade 3' },
    { id: 'grid-4', label: 'Grade 4' },
  ],
  props: z.object({ ...Head, items: z.array(ProductItem).default([]), cta: CtaProp }),
  render(p, ctx, variant) {
    const items = p.items.length ? p.items : ctx.config.business.products;
    if (!items.length) return '';
    const cta = resolveCta(ctx, p.cta, 'Ver catálogo completo');
    const body = `<div class="${cx('grid', variant === 'grid-4' ? 'grid-4' : 'grid-3')}" data-gz="stagger">${items.map((it, i) => productCard(it, i, ctx)).join('')}</div>${
      cta ? `<div class="mt-4 text-center" data-gz="reveal">${button(cta)}</div>` : ''
    }`;
    return wrap(
      ctx,
      sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro, align: 'split' }) + body,
      { id: p.id ?? 'produtos', tone: p.tone },
    );
  },
});
export const catalog = defineSection({
  type: 'catalog',
  name: 'Catálogo',
  description: 'Catálogo com item em destaque + grade.',
  variants: [{ id: 'featured', label: 'Destaque + grade' }],
  props: z.object({ ...Head, items: z.array(ProductItem).default([]), cta: CtaProp }),
  render(p, ctx) {
    const items = p.items.length
      ? p.items
      : ctx.config.business.products.length
        ? ctx.config.business.products
        : ctx.config.business.services;
    if (!items.length) return '';
    const cta = resolveCta(ctx, p.cta, 'Solicitar catálogo');
    const body = `<div class="catalog-featured" data-gz="stagger">${items
      .slice(0, 5)
      .map((it, i) => productCard(it, i, ctx))
      .join('')}</div>${cta ? `<div class="mt-4" data-gz="reveal">${button(cta)}</div>` : ''}`;
    return wrap(
      ctx,
      sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro, align: 'split' }) + body,
      { id: p.id ?? 'catalogo', tone: p.tone },
    );
  },
});

// ---------------- Projetos / Galeria / Masonry ----------------
function projectItems(p: { items: z.infer<typeof ProjectItem>[] }, ctx: RenderContext) {
  return p.items.length ? p.items : ctx.config.business.projects;
}
export const projects = defineSection({
  type: 'projects',
  name: 'Projetos',
  description: 'Trabalhos realizados: grade de cards ou lista editorial.',
  variants: [
    { id: 'grid', label: 'Grade' },
    { id: 'list', label: 'Lista editorial' },
  ],
  props: z.object({ ...Head, items: z.array(ProjectItem).default([]), cta: CtaProp }),
  render(p, ctx, variant) {
    const items = projectItems(p, ctx);
    if (!items.length) return '';
    const cta = resolveCta(ctx, p.cta);
    let body: string;
    if (variant === 'list') {
      body = `<div class="projects-list">${items
        .map((it, i) => {
          const im = ctx.assets.image(it.image, {
            key: `project-${i}`,
            w: 1200,
            h: 900,
            label: `Foto: ${it.title}`,
          });
          return `<div class="project-row" data-gz="reveal"><div class="media media--zoom" data-gz="image">${img(im)}</div><div><p class="eyebrow">${esc(it.category ?? 'Projeto')}${
            it.year ? ` · ${esc(it.year)}` : ''
          }</p><h3>${esc(it.title)}</h3></div><p>${esc(it.description ?? '')}</p></div>`;
        })
        .join('')}</div>`;
    } else {
      body = `<div class="grid grid-3" data-gz="stagger">${items
        .map((it, i) => {
          const im = ctx.assets.image(it.image, {
            key: `project-${i}`,
            w: 1200,
            h: 900,
            label: `Foto: ${it.title}`,
          });
          return `<article class="project"><div class="media media--zoom" data-gz="image">${img(im)}</div><div class="project__meta"><h3>${esc(it.title)}</h3><span>${esc(
            it.category ?? '',
          )}</span></div></article>`;
        })
        .join('')}</div>`;
    }
    return wrap(
      ctx,
      sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro, align: 'split' }) +
        body +
        (cta ? `<div class="mt-4" data-gz="reveal">${button(cta)}</div>` : ''),
      {
        id: p.id ?? 'projetos',
        tone: p.tone,
      },
    );
  },
});
export const gallery = defineSection({
  type: 'gallery',
  name: 'Galeria',
  description: 'Mosaico de fotos.',
  variants: [
    { id: 'editorial', label: 'Mosaico editorial' },
    { id: 'uniform', label: 'Grade uniforme' },
    { id: 'filmstrip', label: 'Faixa horizontal (filmstrip)' },
    { id: 'stacked', label: 'Empilhada (fotos grandes)' },
  ],
  props: z.object({
    ...Head,
    items: z.array(ImageProp.unwrap()).default([]),
    count: z.number().int().min(2).max(12).default(6),
  }),
  render(p, ctx, variant) {
    const fromAssets = ctx.config.assets.images;
    const items: Array<z.infer<typeof ImageProp> | undefined> = p.items.length
      ? p.items
      : fromAssets.length
        ? fromAssets
        : Array.from({ length: p.count }, () => undefined);
    const cls =
      variant === 'filmstrip' ? 'filmstrip' : variant === 'stacked' ? 'gallery-stacked' : cx('gallery', variant === 'editorial' && 'gallery--editorial');
    const limit = variant === 'stacked' ? 4 : 12;
    const body = `<div class="${cls}" data-gz="${variant === 'filmstrip' ? 'stagger' : variant === 'stacked' ? '' : 'stagger'}"${
      variant === 'filmstrip' ? ' data-gz-slider' : ''
    }>${items
      .slice(0, limit)
      .map((it, i) => {
        const im = ctx.assets.image(it ?? undefined, {
          key: `gallery-${i}`,
          w: variant === 'stacked' ? 1800 : variant === 'filmstrip' ? 900 : 1000,
          h: variant === 'stacked' ? 1000 : variant === 'filmstrip' ? 1100 : 1000,
          label: `Foto ${i + 1}`,
        });
        return `<div class="media media--zoom${variant === 'stacked' ? ' media--16x9' : ''}" data-gz="image"${variant === 'stacked' ? ` data-gz-parallax="${(0.05 + (i % 2) * 0.05).toFixed(2)}"` : ''}>${img(im)}</div>`;
      })
      .join('')}</div>`;
    return wrap(ctx, sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro }) + body, {
      id: p.id ?? 'galeria',
      tone: p.tone,
      container: 'wide',
    });
  },
});
export const portfolioMasonry = defineSection({
  type: 'portfolio-masonry',
  name: 'Portfólio Masonry',
  description: 'Portfólio em colunas com alturas variadas.',
  variants: [{ id: 'masonry', label: 'Masonry' }],
  props: z.object({ ...Head, items: z.array(ProjectItem).default([]) }),
  render(p, ctx) {
    const items = projectItems(p, ctx);
    if (!items.length) return '';
    const ratios = ['4/5', '1/1', '3/4', '4/3', '1/1', '3/4'];
    const body = `<div class="masonry" data-gz="stagger">${items
      .map((it, i) => {
        const [rw, rh] = ratios[i % ratios.length].split('/').map(Number);
        const im = ctx.assets.image(it.image, {
          key: `masonry-${i}`,
          w: 900,
          h: Math.round((900 * rh) / rw),
          label: `Foto: ${it.title}`,
        });
        return `<article class="project"><div class="media media--zoom" data-gz="image" style="--ar:${rw}/${rh}">${img(im)}</div><div class="project__meta"><h3>${esc(it.title)}</h3><span>${esc(
          it.category ?? '',
        )}</span></div></article>`;
      })
      .join('')}</div>`;
    return wrap(
      ctx,
      sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro, align: 'split' }) + body,
      { id: p.id ?? 'portfolio', tone: p.tone },
    );
  },
});

// ---------------- Antes / Depois ----------------
export const beforeAfter = defineSection({
  type: 'before-after',
  name: 'Antes / Depois',
  description: 'Comparador de imagens arrastável.',
  variants: [{ id: 'slider', label: 'Slider' }],
  props: z.object({
    ...Head,
    before: ImageProp,
    after: ImageProp,
    beforeLabel: z.string().default('Antes'),
    afterLabel: z.string().default('Depois'),
  }),
  render(p, ctx) {
    const b = ctx.assets.image(p.before, { key: 'before', w: 1400, h: 900, label: 'Foto: antes' });
    const a = ctx.assets.image(p.after, { key: 'after', w: 1400, h: 900, label: 'Foto: depois' });
    const body = `<div class="compare" data-gz-compare data-gz="reveal"><img src="${esc(b.src)}" alt="${esc(b.alt || p.beforeLabel)}" width="${b.width}" height="${b.height}" loading="lazy"><img class="compare__after" src="${esc(
      a.src,
    )}" alt="${esc(a.alt || p.afterLabel)}" width="${a.width}" height="${a.height}" loading="lazy"><span class="compare__label compare__label--before">${esc(p.beforeLabel)}</span><span class="compare__label compare__label--after">${esc(
      p.afterLabel,
    )}</span><div class="compare__handle" aria-hidden="true"></div><input type="range" min="0" max="100" value="50" aria-label="Comparar antes e depois"></div>`;
    return wrap(
      ctx,
      sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro, align: 'center' }) + body,
      { id: p.id ?? 'antes-depois', tone: p.tone, container: 'text' },
    );
  },
});

// ---------------- Horizontal scroll ----------------
export const horizontalScroll = defineSection({
  type: 'horizontal-scroll',
  name: 'Scroll Horizontal',
  description: 'Painéis que rolam horizontalmente com a seção fixa (pin) no desktop.',
  variants: [{ id: 'pinned', label: 'Pinado' }],
  props: z.object({
    ...Head,
    items: z
      .array(z.object({ title: z.string(), description: z.string().default(''), image: ImageProp }))
      .default([]),
  }),
  render(p, ctx) {
    const items = p.items.length
      ? p.items
      : ctx.config.business.services
          .slice(0, 5)
          .map((s) => ({ title: s.title, description: s.description, image: s.image }));
    if (!items.length) return '';
    const track = `<div class="hscroll" data-gz-hscroll><div class="hscroll__track">${items
      .map((it, i) => {
        const im = ctx.assets.image(it.image, {
          key: `hscroll-${i}`,
          w: 1200,
          h: 900,
          label: `Foto: ${it.title}`,
        });
        return `<article class="hscroll__panel"><div class="media media--zoom">${img(im)}</div><span class="hscroll__num">${String(i + 1).padStart(2, '0')} / ${String(
          items.length,
        ).padStart(2, '0')}</span><h3>${esc(it.title)}</h3><p>${esc(it.description)}</p></article>`;
      })
      .join('')}</div></div>`;
    return wrap(
      ctx,
      sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro, align: 'split' }) + track,
      { id: p.id ?? 'destaques', tone: p.tone, attrs: { 'data-gz-hscroll-section': '' } },
    );
  },
});

// ---------------- Marquee / Logos ----------------
export const marquee = defineSection({
  type: 'marquee',
  name: 'Marquee',
  description: 'Faixa de texto em movimento contínuo.',
  variants: [
    { id: 'text', label: 'Texto grande' },
    { id: 'band', label: 'Faixa colorida' },
    { id: 'outline', label: 'Contorno gigante' },
  ],
  props: z.object({
    items: z.array(z.string()).default([]),
    speed: z.number().min(5).max(120).default(30),
    tone: Tone,
  }),
  render(p, ctx, variant) {
    const items = p.items.length ? p.items : ctx.config.business.services.map((s) => s.title);
    if (!items.length) return '';
    const seq = items
      .map((t) => `<span class="marquee__item"><span>${esc(t)}</span><span class="dot"></span></span>`)
      .join('');
    return `<div class="${cx('marquee', variant === 'band' && 'marquee--band', variant === 'outline' && 'marquee--outline')}" style="--marquee-dur:${p.speed}s" aria-hidden="true" data-gz-marquee><div class="marquee__track">${seq}${seq}</div></div>`;
  },
});
export const logos = defineSection({
  type: 'logos',
  name: 'Logos / Marcas',
  description: 'Clientes, parceiros ou marcas atendidas.',
  variants: [
    { id: 'row', label: 'Linha' },
    { id: 'marquee', label: 'Marquee' },
  ],
  props: z.object({ ...Head, items: z.array(z.object({ name: z.string(), image: ImageProp })).default([]) }),
  render(p, ctx, variant) {
    if (!p.items.length) return '';
    const item = (l: { name: string; image?: z.infer<typeof ImageProp> }) =>
      `<span class="logos__item">${l.image ? `<img src="${esc(l.image.src)}" alt="${esc(l.image.alt || l.name)}" loading="lazy" height="32">` : esc(l.name)}</span>`;
    const body =
      variant === 'marquee'
        ? `<div class="marquee" aria-hidden="true" style="--marquee-dur:40s"><div class="marquee__track">${p.items.map(item).join('')}${p.items.map(item).join('')}</div></div>`
        : `<div class="logos" data-gz="stagger">${p.items.map(item).join('')}</div>`;
    return wrap(
      ctx,
      sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro, align: 'center' }) + body,
      {
        id: p.id ?? 'clientes',
        tone: p.tone,
        tight: true,
        container: variant === 'marquee' ? 'none' : 'default',
      },
    );
  },
});

// ---------------- Depoimentos ----------------
export const testimonials = defineSection({
  type: 'testimonials',
  name: 'Depoimentos',
  description: 'Prova social: cards, slider ou citação gigante.',
  variants: [
    { id: 'cards', label: 'Cards' },
    { id: 'slider', label: 'Slider' },
    { id: 'big', label: 'Citação gigante' },
  ],
  props: z.object({
    ...Head,
    items: z
      .array(
        z.object({
          quote: z.string(),
          author: z.string(),
          role: z.string().optional(),
          rating: z.number().optional(),
          image: ImageProp,
        }),
      )
      .default([]),
  }),
  render(p, ctx, variant) {
    const items = p.items.length ? p.items : ctx.config.business.testimonials;
    if (!items.length) return '';
    const stars = (n?: number) =>
      n
        ? `<div class="testimonial__stars" aria-label="${n} de 5 estrelas">${Array.from({ length: 5 }, (_, i) => icon(i < n ? 'star-filled' : 'star')).join('')}</div>`
        : '';
    const author = (t: (typeof items)[number]) =>
      `<div class="testimonial__author"><span class="avatar">${t.image ? `<img src="${esc(t.image.src)}" alt="" width="44" height="44" loading="lazy">` : esc(initials(t.author))}</span><div><strong>${esc(
        t.author,
      )}</strong>${t.role ? `<span>${esc(t.role)}</span>` : ''}</div></div>`;
    let body: string;
    if (variant === 'big') {
      const t = items[0];
      body = `<figure class="testimonial testimonial--big" data-gz="reveal"><span class="testimonial__mark" aria-hidden="true">“</span><blockquote>${esc(t.quote)}</blockquote><figcaption>${author(
        t,
      )}</figcaption></figure>${
        items.length > 1
          ? `<div class="grid grid-3 mt-5" data-gz="stagger">${items
              .slice(1, 4)
              .map(
                (t) =>
                  `<figure class="card testimonial">${stars(t.rating)}<blockquote>${esc(t.quote)}</blockquote><figcaption>${author(t)}</figcaption></figure>`,
              )
              .join('')}</div>`
          : ''
      }`;
    } else if (variant === 'slider') {
      body = `<div class="slider" data-gz-slider>${items
        .map(
          (t) =>
            `<figure class="card testimonial">${stars(t.rating)}<blockquote>${esc(t.quote)}</blockquote><figcaption>${author(t)}</figcaption></figure>`,
        )
        .join(
          '',
        )}</div><div class="slider-nav"><button type="button" data-slider-prev aria-label="Anterior">${icon('chevron-left')}</button><button type="button" data-slider-next aria-label="Próximo">${icon(
        'chevron-right',
      )}</button></div>`;
    } else {
      body = `<div class="grid grid-3" data-gz="stagger">${items
        .map(
          (t) =>
            `<figure class="card testimonial">${stars(t.rating)}<blockquote>${esc(t.quote)}</blockquote><figcaption>${author(t)}</figcaption></figure>`,
        )
        .join('')}</div>`;
    }
    return wrap(
      ctx,
      sectionHead({
        eyebrow: p.eyebrow,
        title: p.title,
        intro: p.intro,
        align: variant === 'big' ? 'left' : 'split',
      }) + body,
      { id: p.id ?? 'depoimentos', tone: p.tone },
    );
  },
});

export const MEDIA_SECTIONS = [
  products,
  catalog,
  projects,
  gallery,
  portfolioMasonry,
  beforeAfter,
  horizontalScroll,
  marquee,
  logos,
  testimonials,
];
export { attrs };
