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
  resolveCta,
  accentText,
  splitWords,
} from './types';

const HeroBase = z.object({
  eyebrow: z.string().optional(),
  headline: z.string(),
  subheadline: z.string().optional(),
  primaryCta: CtaProp,
  secondaryCta: CtaProp,
  image: ImageProp,
  badges: z.array(z.string()).default([]),
  stats: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
  navLabel: z.string().optional(),
});

function ctas(ctx: Parameters<typeof resolveCta>[0], p: z.infer<typeof HeroBase>) {
  const primary = resolveCta(ctx, p.primaryCta, ctx.primaryCta.label);
  const secondary = p.secondaryCta
    ? { label: p.secondaryCta.label, href: p.secondaryCta.href ?? '#servicos', variant: 'secondary' as const }
    : null;
  if (!primary && !secondary) return '';
  return `<div class="btn-group" data-gz="reveal">${primary ? button({ ...primary, size: 'lg' }) : ''}${
    secondary ? button(secondary) : ''
  }</div>`;
}

function badges(list: string[], cls = '') {
  if (!list.length) return '';
  return `<ul class="${cx('hero__badges', cls)}" data-gz="stagger">${list
    .map((b) => `<li>${icon('check-circle')}<span>${esc(b)}</span></li>`)
    .join('')}</ul>`;
}

function stats(list: { value: string; label: string }[]) {
  if (!list.length) return '';
  return `<div class="hero__stats" data-gz="stagger">${list
    .map((s) => `<div><strong data-gz-counter>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`)
    .join('')}</div>`;
}

/** Hero padrão: texto + imagem lateral, ou centralizado */
export const hero = defineSection({
  type: 'hero',
  name: 'Hero',
  description: 'Título forte, subtítulo, CTAs e imagem lateral ou centralizado.',
  variants: [
    { id: 'split', label: 'Texto + imagem' },
    { id: 'center', label: 'Centralizado' },
    { id: 'stacked', label: 'Texto e imagem larga abaixo' },
  ],
  props: HeroBase,
  render(p, ctx, variant) {
    const im = ctx.assets.image(p.image, { key: 'hero', w: 1200, h: 1400, label: 'Foto principal' });
    const title = `<h1 class="hero__title" ${attrs({ 'data-gz': ctx.config.animations.textReveal ? 'text' : 'reveal' })}>${
      ctx.config.animations.textReveal ? splitWords(accentText(p.headline)) : accentText(p.headline)
    }</h1>`;
    const text = `${p.eyebrow ? `<p class="eyebrow" data-gz="reveal">${esc(p.eyebrow)}</p>` : ''}${title}${
      p.subheadline ? `<p class="lead" data-gz="reveal">${esc(p.subheadline)}</p>` : ''
    }${ctas(ctx, p)}${badges(p.badges)}${stats(p.stats)}`;
    if (variant === 'center') {
      return `<section class="hero hero--center" id="inicio"><div class="container">${text}</div><div class="container container--wide mt-5"><div class="media media--16x9" data-gz="image" data-gz-parallax="0.12">${img(im, { priority: true })}</div></div></section>`;
    }
    if (variant === 'stacked') {
      return `<section class="hero" id="inicio"><div class="container">${text}</div><div class="container container--wide mt-5"><div class="media media--16x9" data-gz="image" data-gz-parallax="0.12">${img(
        im,
        { priority: true },
      )}</div></div></section>`;
    }
    const caption =
      p.stats.length === 0 && ctx.config.business.yearsExperience
        ? `<div class="hero__media-caption" data-gz="reveal"><strong>${ctx.config.business.yearsExperience}+</strong> anos de experiência</div>`
        : '';
    return `<section class="hero" id="inicio"><div class="container"><div class="split split--wide-media"><div>${text}</div><div class="hero__media" data-gz-parallax="0.08"><div class="media media--zoom" data-gz="image">${img(
      im,
      { priority: true },
    )}</div>${caption}</div></div></div></section>`;
  },
});

/** Hero fullscreen: imagem de fundo, overlay, título gigante, parallax */
export const heroFullscreen = defineSection({
  type: 'hero-fullscreen',
  name: 'Hero Fullscreen',
  description: 'Imagem de fundo em tela cheia com overlay, título no rodapé e indicador de scroll.',
  variants: [
    { id: 'bottom', label: 'Título embaixo' },
    { id: 'center', label: 'Título centralizado' },
  ],
  props: HeroBase,
  render(p, ctx, variant) {
    const im = ctx.assets.image(p.image, { key: 'hero-bg', w: 1920, h: 1200, label: 'Foto de fundo' });
    const title = `<h1 class="hero__title" ${attrs({ 'data-gz': ctx.config.animations.textReveal ? 'text' : 'reveal' })}>${
      ctx.config.animations.textReveal ? splitWords(accentText(p.headline)) : accentText(p.headline)
    }</h1>`;
    const content = `${p.eyebrow ? `<p class="eyebrow" data-gz="reveal">${esc(p.eyebrow)}</p>` : ''}${title}${
      p.subheadline ? `<p class="lead" data-gz="reveal">${esc(p.subheadline)}</p>` : ''
    }${ctas(ctx, p)}${badges(p.badges)}`;
    const side = p.stats.length ? stats(p.stats) : '';
    return `<section class="${cx('hero hero--full', variant === 'center' && 'hero--center')}" id="inicio"><div class="hero__bg" data-gz-parallax="0.25" data-gz-parallax-bg>${img(
      im,
      { priority: true },
    )}</div><div class="container"><div class="${variant === 'center' ? '' : 'hero__grid'}"><div>${content}</div>${
      variant === 'center' ? '' : `<div>${side}</div>`
    }</div></div><span class="hero__scroll" aria-hidden="true">scroll</span></section>`;
  },
});

/** Hero split: metade texto, metade imagem até a borda */
export const heroSplit = defineSection({
  type: 'hero-split',
  name: 'Hero Split',
  description: 'Metade texto, metade imagem sangrando até a borda da tela.',
  variants: [
    { id: 'image-right', label: 'Imagem à direita' },
    { id: 'image-left', label: 'Imagem à esquerda' },
  ],
  props: HeroBase,
  render(p, ctx, variant) {
    const im = ctx.assets.image(p.image, { key: 'hero-split', w: 1200, h: 1500, label: 'Foto principal' });
    const title = `<h1 class="hero__title" ${attrs({ 'data-gz': ctx.config.animations.textReveal ? 'text' : 'reveal' })}>${
      ctx.config.animations.textReveal ? splitWords(accentText(p.headline)) : accentText(p.headline)
    }</h1>`;
    const content = `<div class="hero__content"><div>${p.eyebrow ? `<p class="eyebrow" data-gz="reveal">${esc(p.eyebrow)}</p>` : ''}${title}${
      p.subheadline ? `<p class="lead" data-gz="reveal">${esc(p.subheadline)}</p>` : ''
    }${ctas(ctx, p)}${badges(p.badges)}${stats(p.stats)}</div></div>`;
    const image = `<div class="hero__image"><div class="media" data-gz="image" data-gz-parallax="0.1">${img(im, { priority: true })}</div></div>`;
    return `<section class="hero hero--split" id="inicio"><div class="hero__split">${
      variant === 'image-left' ? image + content : content + image
    }</div></section>`;
  },
});

/** Hero com vídeo de fundo (fallback para imagem/poster) */
export const heroVideo = defineSection({
  type: 'hero-video',
  name: 'Hero Vídeo',
  description: 'Vídeo de fundo em loop silencioso com poster e overlay; cai para imagem se não houver vídeo.',
  variants: [{ id: 'default', label: 'Padrão' }],
  props: HeroBase.extend({ videoSrc: z.string().optional(), poster: ImageProp }),
  render(p, ctx) {
    const poster = ctx.assets.image(p.poster ?? p.image, {
      key: 'hero-video-poster',
      w: 1920,
      h: 1200,
      label: 'Poster do vídeo',
    });
    const title = `<h1 class="hero__title" ${attrs({ 'data-gz': ctx.config.animations.textReveal ? 'text' : 'reveal' })}>${
      ctx.config.animations.textReveal ? splitWords(accentText(p.headline)) : accentText(p.headline)
    }</h1>`;
    const media = p.videoSrc
      ? `<video autoplay muted loop playsinline preload="metadata" poster="${esc(poster.src)}" aria-hidden="true"><source src="${esc(
          p.videoSrc,
        )}" type="video/mp4"></video>`
      : img(poster, { priority: true });
    return `<section class="hero hero--full hero--center" id="inicio"><div class="hero__bg" data-gz-parallax="0.2" data-gz-parallax-bg>${media}</div><div class="container">${
      p.eyebrow ? `<p class="eyebrow" data-gz="reveal">${esc(p.eyebrow)}</p>` : ''
    }${title}${p.subheadline ? `<p class="lead" data-gz="reveal">${esc(p.subheadline)}</p>` : ''}${ctas(ctx, p)}${badges(
      p.badges,
    )}</div></section>`;
  },
});

export const HERO_SECTIONS = [hero, heroFullscreen, heroSplit, heroVideo];
