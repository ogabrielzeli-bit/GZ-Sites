import { z } from 'zod';
import {
  accentText,
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
  splitWords,
  wrap,
} from './types';
import type { RenderContext } from './types';
import { hasIcon } from '../icons';

const Tone = z.enum(['default', 'alt', 'surface', 'accent', 'dark']).default('default');
const Head = {
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  intro: z.string().optional(),
  navLabel: z.string().optional(),
  tone: Tone,
};

const Item = z.object({
  title: z.string(),
  description: z.string().default(''),
  icon: z.string().optional(),
  image: ImageProp,
  price: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

function pickIcon(name: string | undefined, fallback: string[], i: number) {
  if (name && hasIcon(name)) return name;
  return fallback[i % fallback.length];
}

const SEGMENT_ICONS: Record<string, string[]> = {
  serralheria: ['hammer', 'tool', 'ruler', 'shield', 'home', 'layers'],
  arquitetura: ['compass', 'ruler', 'pen-tool', 'building', 'layers', 'home'],
  restaurante: ['chef-hat', 'utensils', 'glass-wine', 'coffee', 'star', 'heart'],
  buffet: ['cake', 'glass-wine', 'users', 'calendar', 'star', 'utensils'],
  oficina: ['wrench', 'car', 'gauge', 'cog', 'shield', 'clock'],
  'loja-automotiva': ['car', 'package', 'tag', 'truck', 'shield', 'cog'],
  concessionaria: ['car', 'key', 'handshake', 'shield', 'gauge', 'star'],
  clinica: ['stethoscope', 'heart', 'activity', 'shield', 'calendar', 'users'],
  medico: ['stethoscope', 'heart', 'activity', 'calendar', 'shield', 'user'],
  advogado: ['scale', 'briefcase', 'file-text', 'shield', 'handshake', 'users'],
  imobiliaria: ['home', 'key', 'building', 'map', 'handshake', 'file-text'],
  construcao: ['building', 'hammer', 'ruler', 'layers', 'shield', 'home'],
  academia: ['dumbbell', 'activity', 'heart', 'target', 'users', 'zap'],
  estetica: ['sparkles', 'heart', 'droplet', 'sun', 'star', 'smile'],
  barbearia: ['scissors', 'star', 'calendar', 'sparkles', 'user', 'coffee'],
  loja: ['shopping-bag', 'tag', 'package', 'truck', 'star', 'heart'],
  ecommerce: ['shopping-bag', 'truck', 'lock', 'package', 'tag', 'thumbs'],
  servicos: ['tool', 'check-circle', 'clock', 'shield', 'users', 'star'],
  b2b: ['briefcase', 'trending-up', 'handshake', 'bar-chart', 'globe', 'layers'],
  industria: ['factory', 'cog', 'layers', 'truck', 'shield', 'bar-chart'],
};
export function segmentIcons(segment: string) {
  return SEGMENT_ICONS[segment] ?? SEGMENT_ICONS.servicos;
}

function cardGrid(
  items: z.infer<typeof Item>[],
  ctx: RenderContext,
  o: { numbered?: boolean; icons?: boolean; cols?: 2 | 3 | 4 } = {},
) {
  const fall = segmentIcons(ctx.config.business.segment);
  return `<div class="grid grid-${o.cols ?? 3}" data-gz="stagger">${items
    .map(
      (it, i) =>
        `<article class="${cx('card', o.numbered && 'card--numbered')}">${
          o.numbered ? `<div class="card__num">${String(i + 1).padStart(2, '0')}</div>` : ''
        }${o.icons !== false && !o.numbered ? `<div class="card__icon">${icon(pickIcon(it.icon, fall, i))}</div>` : ''}<h3>${esc(
          it.title,
        )}</h3>${it.description ? `<p>${esc(it.description)}</p>` : ''}${
          it.price ? `<p class="mt-2"><strong>${esc(it.price)}</strong></p>` : ''
        }</article>`,
    )
    .join('')}</div>`;
}

// ---------------- Manifesto ----------------
export const manifesto = defineSection({
  type: 'manifesto',
  name: 'Manifesto',
  description: 'Uma frase grande, revelada palavra por palavra. Posicionamento em uma linha.',
  variants: [
    { id: 'left', label: 'Alinhado à esquerda' },
    { id: 'center', label: 'Centralizado' },
  ],
  props: z.object({
    eyebrow: z.string().optional(),
    text: z.string(),
    tone: Tone,
    navLabel: z.string().optional(),
  }),
  render(p, ctx, variant) {
    const inner = `${p.eyebrow ? `<p class="eyebrow" data-gz="reveal">${esc(p.eyebrow)}</p>` : ''}<p class="manifesto__text" data-gz="text" data-gz-scrub>${splitWords(
      accentText(p.text),
    )}</p>`;
    return wrap(ctx, inner, {
      cls: cx('manifesto', variant === 'center' && 'manifesto--center'),
      tone: p.tone,
      container: 'text',
    });
  },
});

// ---------------- Benefícios ----------------
export const benefits = defineSection({
  type: 'benefits',
  name: 'Benefícios',
  description: 'Por que escolher: diferenciais em grid, lista ou numerados.',
  variants: [
    { id: 'grid', label: 'Grid com ícones' },
    { id: 'list', label: 'Lista em linhas' },
    { id: 'numbered', label: 'Numerados' },
  ],
  props: z.object({ ...Head, items: z.array(Item).default([]), id: z.string().optional() }),
  render(p, ctx, variant) {
    const items: z.infer<typeof Item>[] = p.items.length
      ? p.items
      : ctx.config.business.differentials.map((d) => ({ title: d, description: '' }));
    if (!items.length) return '';
    const fall = segmentIcons(ctx.config.business.segment);
    let body: string;
    if (variant === 'list') {
      body = `<div class="benefits-list" data-gz="stagger">${items
        .map(
          (it, i) =>
            `<div class="item">${icon(pickIcon(it.icon, fall, i))}<h3>${esc(it.title)}</h3><p>${esc(it.description)}</p></div>`,
        )
        .join('')}</div>`;
    } else body = cardGrid(items, ctx, { numbered: variant === 'numbered' });
    return wrap(
      ctx,
      sectionHead({
        eyebrow: p.eyebrow,
        title: p.title,
        intro: p.intro,
        align: variant === 'list' ? 'split' : 'left',
      }) + body,
      {
        id: p.id ?? 'diferenciais',
        tone: p.tone,
      },
    );
  },
});

// ---------------- Serviços ----------------
export const services = defineSection({
  type: 'services',
  name: 'Serviços',
  description: 'O que a empresa faz. Cards, linhas numeradas, alternado com imagens ou minimalista.',
  variants: [
    { id: 'cards', label: 'Cards' },
    { id: 'rows', label: 'Linhas numeradas' },
    { id: 'alternating', label: 'Alternado com imagens' },
    { id: 'minimal', label: 'Minimal (4 colunas)' },
  ],
  props: z.object({ ...Head, items: z.array(Item).default([]), cta: CtaProp, id: z.string().optional() }),
  render(p, ctx, variant) {
    const items = p.items.length ? p.items : ctx.config.business.services;
    if (!items.length) return '';
    const fall = segmentIcons(ctx.config.business.segment);
    let body = '';
    if (variant === 'rows') {
      body = `<div class="services-rows" data-gz="stagger">${items
        .map(
          (it, i) =>
            `<a class="row" href="${esc(ctx.primaryCta.href)}" ${ctx.primaryCta.href.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}><span class="row__num">${String(i + 1).padStart(2, '0')}</span><h3>${esc(
              it.title,
            )}</h3><p>${esc(it.description)}</p><span class="row__arrow">${icon('arrow-up-right')}</span></a>`,
        )
        .join('')}</div>`;
    } else if (variant === 'alternating') {
      body = `<div class="alt-rows">${items
        .slice(0, 6)
        .map((it, i) => {
          const im = ctx.assets.image(it.image, {
            key: `service-${i}`,
            w: 1200,
            h: 900,
            label: `Foto: ${it.title}`,
          });
          return `<div class="${cx('split', i % 2 === 1 && 'split--reverse')}"><div class="media media--zoom" data-gz="image">${img(im)}</div><div data-gz="reveal"><p class="eyebrow">${String(
            i + 1,
          ).padStart(2, '0')}</p><h3>${esc(it.title)}</h3><p>${esc(it.description)}</p>${
            it.tags?.length
              ? `<ul class="feature-list">${it.tags.map((t) => `<li>${icon('check')}<span>${esc(t)}</span></li>`).join('')}</ul>`
              : ''
          }</div></div>`;
        })
        .join('')}</div>`;
    } else if (variant === 'minimal') {
      body = `<div class="grid grid-4" data-gz="stagger">${items
        .map(
          (it, i) =>
            `<div><div class="card__icon">${icon(pickIcon(it.icon, fall, i))}</div><h4>${esc(it.title)}</h4><p class="text-muted mt-1">${esc(it.description)}</p></div>`,
        )
        .join('')}</div>`;
    } else body = cardGrid(items, ctx, { cols: items.length === 4 || items.length > 6 ? 4 : 3 });
    const cta = resolveCta(ctx, p.cta);
    const ctaHtml = cta ? `<div class="mt-4" data-gz="reveal">${button(cta)}</div>` : '';
    return wrap(
      ctx,
      sectionHead({
        eyebrow: p.eyebrow,
        title: p.title,
        intro: p.intro,
        align: variant === 'rows' ? 'split' : 'left',
      }) +
        body +
        ctaHtml,
      {
        id: p.id ?? 'servicos',
        tone: p.tone,
      },
    );
  },
});

// ---------------- Sobre ----------------
export const about = defineSection({
  type: 'about',
  name: 'Sobre',
  description: 'História, missão e destaques, com imagem.',
  variants: [
    { id: 'split', label: 'Texto + imagem' },
    { id: 'image-left', label: 'Imagem + texto' },
    { id: 'stacked', label: 'Empilhado com imagem larga' },
    { id: 'stack-media', label: 'Duas imagens sobrepostas' },
  ],
  props: z.object({
    ...Head,
    text: z.string().optional(),
    paragraphs: z.array(z.string()).default([]),
    image: ImageProp,
    image2: ImageProp,
    highlights: z.array(z.object({ title: z.string(), text: z.string().optional() })).default([]),
    cta: CtaProp,
    showYears: z.boolean().default(true),
    id: z.string().optional(),
  }),
  render(p, ctx, variant) {
    const paras = p.paragraphs.length
      ? p.paragraphs
      : p.text
        ? [p.text]
        : ctx.config.business.description
          ? [ctx.config.business.description]
          : [];
    const im = ctx.assets.image(p.image, { key: 'about', w: 1200, h: 1400, label: 'Foto: equipe / espaço' });
    const im2 = ctx.assets.image(p.image2, { key: 'about-2', w: 800, h: 800, label: 'Foto: detalhe' });
    const years = ctx.config.business.yearsExperience;
    const cta = resolveCta(ctx, p.cta);
    const text = `<div data-gz="reveal">${p.eyebrow ? `<p class="eyebrow">${esc(p.eyebrow)}</p>` : ''}${
      p.title ? `<h2 class="h2">${accentText(p.title)}</h2>` : ''
    }<div class="prose mt-3">${paras.map((t) => `<p>${esc(t)}</p>`).join('')}</div>${
      p.highlights.length
        ? `<div class="about__highlights">${p.highlights.map((h) => `<div><strong>${esc(h.title)}</strong>${h.text ? `<span>${esc(h.text)}</span>` : ''}</div>`).join('')}</div>`
        : ''
    }${cta ? `<div class="mt-4">${button(cta)}</div>` : ''}</div>`;
    let media: string;
    if (variant === 'stack-media') {
      media = `<div class="about__media-stack" data-gz-parallax="0.06">${
        years && p.showYears
          ? `<div class="about__years" data-gz="reveal"><strong>${years}</strong><span>anos</span></div>`
          : ''
      }<div class="media media--tall" data-gz="image">${img(im)}</div><div class="media" data-gz="image">${img(im2)}</div></div>`;
    } else {
      media = `<div data-gz-parallax="0.06" style="position:relative">${
        years && p.showYears && variant !== 'stacked'
          ? `<div class="about__years" data-gz="reveal"><strong>${years}</strong><span>anos</span></div>`
          : ''
      }<div class="${cx('media media--zoom', variant === 'stacked' ? 'media--16x9' : 'media--tall')}" data-gz="image">${img(im)}</div></div>`;
    }
    const inner =
      variant === 'stacked'
        ? `${text}<div class="mt-5">${media}</div>`
        : `<div class="${cx('split', variant === 'image-left' && 'split--reverse')}">${text}${media}</div>`;
    return wrap(ctx, inner, {
      id: p.id ?? 'sobre',
      tone: p.tone,
      container: variant === 'stacked' ? 'text' : 'default',
    });
  },
});

// ---------------- Números ----------------
const StatsProps = z.object({
  ...Head,
  items: z
    .array(z.object({ value: z.string(), label: z.string(), suffix: z.string().optional() }))
    .default([]),
  id: z.string().optional(),
});
function renderStats(p: z.infer<typeof StatsProps>, ctx: RenderContext, variant: string) {
  const items = p.items.length ? p.items : ctx.config.business.stats;
  if (!items.length) return '';
  const body = `<div class="${cx('stats', variant !== 'grid' && `stats--${variant}`)}" data-gz="stagger">${items
    .map(
      (s) =>
        `<div class="stat"><strong><span data-gz-counter>${esc(s.value)}</span>${s.suffix ? `<span class="suffix">${esc(s.suffix)}</span>` : ''}</strong><span>${esc(
          s.label,
        )}</span></div>`,
    )
    .join('')}</div>`;
  return wrap(ctx, sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro }) + body, {
    id: p.id ?? 'numeros',
    tone: p.tone,
    tight: variant === 'inline',
  });
}
export const numbers = defineSection({
  type: 'numbers',
  name: 'Números',
  description: 'Resultados em números grandes, com contador animado.',
  variants: [
    { id: 'grid', label: 'Grid' },
    { id: 'inline', label: 'Faixa compacta' },
    { id: 'cards', label: 'Cards' },
    { id: 'big', label: 'Gigante em linhas' },
  ],
  props: StatsProps,
  render: renderStats,
});
export const statistics = defineSection({
  type: 'statistics',
  name: 'Estatísticas',
  description: 'Alias de Números com layout gigante.',
  variants: [
    { id: 'big', label: 'Gigante em linhas' },
    { id: 'grid', label: 'Grid' },
  ],
  props: StatsProps,
  render: renderStats,
});

// ---------------- Processo / Timeline ----------------
const StepsProps = z.object({
  ...Head,
  items: z.array(z.object({ title: z.string(), description: z.string().default('') })).default([]),
  id: z.string().optional(),
});
export const process = defineSection({
  type: 'process',
  name: 'Processo',
  description: 'Como funciona, em passos numerados.',
  variants: [
    { id: 'columns', label: 'Colunas' },
    { id: 'timeline', label: 'Linha do tempo' },
  ],
  props: StepsProps,
  render(p, ctx, variant) {
    const items = p.items.length ? p.items : ctx.config.business.steps;
    if (!items.length) return '';
    const body =
      variant === 'timeline'
        ? `<div class="timeline" data-gz="stagger" data-gz-timeline><div class="timeline__line"></div>${items
            .map((s) => `<div class="step"><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></div>`)
            .join('')}</div>`
        : `<div class="process" data-gz="stagger">${items.map((s) => `<div class="step"><h3>${esc(s.title)}</h3><p>${esc(s.description)}</p></div>`).join('')}</div>`;
    const inner =
      variant === 'timeline'
        ? `<div class="faq-split">${sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro })}${body}</div>`
        : sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro, align: 'split' }) + body;
    return wrap(ctx, inner, { id: p.id ?? 'processo', tone: p.tone });
  },
});
export const timeline = defineSection({
  type: 'timeline',
  name: 'Timeline',
  description: 'História ou etapas em linha do tempo vertical com progresso no scroll.',
  variants: [{ id: 'timeline', label: 'Vertical' }],
  props: StepsProps,
  render: (p, ctx) => process.render(p, ctx, 'timeline'),
});

// ---------------- Equipe ----------------
export const team = defineSection({
  type: 'team',
  name: 'Equipe',
  description: 'Pessoas por trás do negócio.',
  variants: [
    { id: 'grid', label: 'Grid' },
    { id: 'compact', label: 'Compacto' },
  ],
  props: z.object({
    ...Head,
    items: z
      .array(
        z.object({
          name: z.string(),
          role: z.string().optional(),
          bio: z.string().optional(),
          image: ImageProp,
        }),
      )
      .default([]),
    id: z.string().optional(),
  }),
  render(p, ctx, variant) {
    const items = p.items.length ? p.items : ctx.config.business.team;
    if (!items.length) return '';
    const body = `<div class="${cx('grid', variant === 'compact' ? 'grid-4' : 'grid-3')}" data-gz="stagger">${items
      .map((m, i) => {
        const im = ctx.assets.image(m.image, { key: `team-${i}`, w: 900, h: 1200, label: `Foto: ${m.name}` });
        return `<article class="member"><div class="media media--zoom media--3x4" data-gz="image">${img(im)}</div><div><h3>${esc(m.name)}</h3>${
          m.role ? `<span>${esc(m.role)}</span>` : ''
        }</div>${m.bio && variant !== 'compact' ? `<p>${esc(m.bio)}</p>` : ''}</article>`;
      })
      .join('')}</div>`;
    return wrap(ctx, sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro }) + body, {
      id: p.id ?? 'equipe',
      tone: p.tone,
    });
  },
});

// ---------------- FAQ ----------------
export const faq = defineSection({
  type: 'faq',
  name: 'FAQ',
  description: 'Perguntas frequentes em acordeão acessível.',
  variants: [
    { id: 'split', label: 'Título fixo + perguntas' },
    { id: 'stacked', label: 'Empilhado' },
  ],
  props: z.object({
    ...Head,
    items: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
    id: z.string().optional(),
  }),
  render(p, ctx, variant) {
    const items = p.items.length ? p.items : ctx.config.business.faqs;
    if (!items.length) return '';
    const list = `<div class="faq" data-gz="stagger" data-gz-accordion>${items
      .map(
        (f, i) =>
          `<details ${i === 0 ? 'open' : ''}><summary><span>${esc(f.question)}</span><span class="faq__icon">${icon('plus')}</span></summary><div class="faq__answer"><p>${esc(
            f.answer,
          )}</p></div></details>`,
      )
      .join('')}</div>`;
    const inner =
      variant === 'split'
        ? `<div class="faq-split">${sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro })}${list}</div>`
        : sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro }) + list;
    return wrap(ctx, inner, { id: p.id ?? 'faq', tone: p.tone });
  },
});

// ---------------- Comparação ----------------
export const comparison = defineSection({
  type: 'comparison',
  name: 'Comparação',
  description: 'Antes vs. depois / nós vs. outros, em duas colunas.',
  variants: [{ id: 'two-col', label: 'Duas colunas' }],
  props: z.object({
    ...Head,
    left: z.object({ title: z.string(), items: z.array(z.string()) }),
    right: z.object({ title: z.string(), items: z.array(z.string()) }),
    id: z.string().optional(),
  }),
  render(p, ctx) {
    const col = (c: { title: string; items: string[] }, good: boolean) =>
      `<div class="${cx('col', good ? 'col--good' : 'col--bad')}"><h3>${esc(c.title)}</h3><ul>${c.items
        .map((i) => `<li>${icon(good ? 'check-circle' : 'x')}<span>${esc(i)}</span></li>`)
        .join('')}</ul></div>`;
    return wrap(
      ctx,
      sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro, align: 'center' }) +
        `<div class="comparison" data-gz="stagger">${col(p.left, false)}${col(p.right, true)}</div>`,
      {
        id: p.id ?? 'comparacao',
        tone: p.tone,
        container: 'text',
      },
    );
  },
});

// ---------------- Pricing ----------------
export const pricing = defineSection({
  type: 'pricing',
  name: 'Planos / Preços',
  description: 'Tabela de planos com destaque.',
  variants: [{ id: 'cards', label: 'Cards' }],
  props: z.object({
    ...Head,
    items: z
      .array(
        z.object({
          name: z.string(),
          price: z.string(),
          period: z.string().optional(),
          description: z.string().optional(),
          features: z.array(z.string()).default([]),
          featured: z.boolean().default(false),
          cta: CtaProp,
        }),
      )
      .default([]),
    id: z.string().optional(),
  }),
  render(p, ctx) {
    if (!p.items.length) return '';
    const body = `<div class="grid grid-3" data-gz="stagger">${p.items
      .map((pl) => {
        const cta = resolveCta(ctx, pl.cta, 'Quero este plano');
        return `<article class="${cx('card plan', pl.featured && 'plan--featured')}">${pl.featured ? `<span class="plan__badge">Mais escolhido</span>` : ''}<h3>${esc(pl.name)}</h3>${
          pl.description ? `<p>${esc(pl.description)}</p>` : ''
        }<div class="plan__price">${esc(pl.price)}${pl.period ? `<small>/${esc(pl.period)}</small>` : ''}</div><ul class="feature-list">${pl.features
          .map((f) => `<li>${icon('check')}<span>${esc(f)}</span></li>`)
          .join(
            '',
          )}</ul>${cta ? button({ ...cta, variant: pl.featured ? cta.variant : 'secondary' }) : ''}</article>`;
      })
      .join('')}</div>`;
    return wrap(
      ctx,
      sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro, align: 'center' }) + body,
      { id: p.id ?? 'planos', tone: p.tone },
    );
  },
});

// ---------------- Horários ----------------
export const hours = defineSection({
  type: 'hours',
  name: 'Horários',
  description: 'Horário de funcionamento + endereço.',
  variants: [{ id: 'table', label: 'Tabela' }],
  props: z.object({
    ...Head,
    items: z.array(z.object({ days: z.string(), hours: z.string() })).default([]),
    id: z.string().optional(),
  }),
  render(p, ctx) {
    const items = p.items.length ? p.items : ctx.config.business.hours;
    if (!items.length) return '';
    const table = `<table class="hours-table" data-gz="reveal"><tbody>${items.map((h) => `<tr><td>${esc(h.days)}</td><td>${esc(h.hours)}</td></tr>`).join('')}</tbody></table>`;
    return wrap(
      ctx,
      `<div class="split">${sectionHead({ eyebrow: p.eyebrow ?? 'Horários', title: p.title ?? 'Quando estamos abertos', intro: p.intro ?? ctx.config.contact.address })}${table}</div>`,
      {
        id: p.id ?? 'horarios',
        tone: p.tone,
      },
    );
  },
});

export const CONTENT_SECTIONS = [
  manifesto,
  benefits,
  services,
  about,
  numbers,
  statistics,
  process,
  timeline,
  team,
  faq,
  comparison,
  pricing,
  hours,
];
export { initials, attrs };
