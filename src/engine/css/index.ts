/**
 * Monta o CSS final de um site: variáveis do tema + base.css + ajustes específicos do tema.
 */
import fs from 'node:fs';
import path from 'node:path';
import { tokens } from '../tokens';
import type { Theme } from '../themes';
import type { SiteConfig } from '@shared/site-config';

const BASE_CSS = fs.readFileSync(path.join(import.meta.dirname, 'base.css'), 'utf8');

function fontStack(family: string, fallback: string) {
  return `"${family}", ${fallback}`;
}

export function themeVariables(theme: Theme, overrides: SiteConfig['theme']['overrides']): string {
  const c = { ...theme.colors, ...(overrides?.colors ?? {}) };
  const radiusKey = overrides?.radius ?? theme.radius;
  const r = tokens.radius;
  const radiusMap: Record<string, { sm: string; md: string; lg: string; xl: string; btn: string }> = {
    none: { sm: r.none, md: r.none, lg: r.none, xl: r.none, btn: r.none },
    sm: { sm: r.sm, md: r.sm, lg: '6px', xl: '8px', btn: r.sm },
    md: { sm: r.sm, md: r.md, lg: r.lg, xl: r.xl, btn: '10px' },
    lg: { sm: '6px', md: r.lg, lg: '28px', xl: '40px', btn: r.lg },
    xl: { sm: r.md, md: r.xl, lg: '40px', xl: '48px', btn: r.pill },
    pill: { sm: r.md, md: r.lg, lg: r.xl, xl: '48px', btn: r.pill },
  };
  const rad = radiusMap[radiusKey] ?? radiusMap.md;
  const display = overrides?.fonts?.display || theme.fonts.display.family;
  const body = overrides?.fonts?.body || theme.fonts.body.family;
  const t = tokens.typography;
  const mapFilter = theme.mode === 'dark' ? 'invert(0.92) hue-rotate(180deg) saturate(0.6)' : 'none';
  return `:root{
  --c-bg:${c.bg};--c-bg-alt:${c.bgAlt};--c-surface:${c.surface};--c-text:${c.text};--c-muted:${c.muted};--c-border:${c.border};
  --c-accent:${c.accent};--c-accent-contrast:${c.accentContrast};--c-accent-2:${c.accent2};
  --f-display:${fontStack(display, theme.fonts.display.fallback)};--f-body:${fontStack(body, theme.fonts.body.fallback)};
  --h-weight:${theme.heading.weight};--h-transform:${theme.heading.transform};--h-tracking:${t.tracking[theme.heading.tracking]};--h-lh:${t.lineHeight[theme.heading.lineHeight]};--h-italic:${theme.heading.italicAccent ? 'italic' : 'normal'};
  --t-display:${t.scale.display};--t-h1:${t.scale.h1};--t-h2:${t.scale.h2};--t-h3:${t.scale.h3};--t-h4:${t.scale.h4};--t-lead:${t.scale.lead};--t-body:${t.scale.body};--t-small:${t.scale.small};--t-caption:${t.scale.caption};
  --lh-normal:${t.lineHeight.normal};--lh-relaxed:${t.lineHeight.relaxed};
  --r-sm:${rad.sm};--r-md:${rad.md};--r-lg:${rad.lg};--r-xl:${rad.xl};--r-btn:${rad.btn};
  --shadow-soft:${tokens.shadows.soft};--shadow-medium:${tokens.shadows.medium};--shadow-hard:${tokens.shadows.hard};--shadow-glow:${tokens.shadows.glowAccent};
  --s-section:${tokens.spacing.section[theme.sectionSpacing]};--gutter:${tokens.spacing.gutter};
  --gap-sm:${tokens.spacing.gap.sm};--gap-md:${tokens.spacing.gap.md};--gap-lg:${tokens.spacing.gap.lg};
  --container:${tokens.container.default};--container-wide:${tokens.container.wide};--container-text:${tokens.container.text};--container-narrow:${tokens.container.narrow};
  --dur-fast:${tokens.motion.duration.fast};--dur-base:${tokens.motion.duration.base};--dur-slow:${tokens.motion.duration.slow};
  --ease-out:${tokens.motion.easing.out};--ease-inOut:${tokens.motion.easing.inOut};--ease-spring:${tokens.motion.easing.spring};--ease-expo:${tokens.motion.easing.expo};
  --map-filter:${mapFilter};
  color-scheme:${theme.mode};
}`;
}

/** Ajustes finos por tema (além das variáveis). Mantidos pequenos para preservar a identidade de cada um. */
const THEME_EXTRAS: Partial<Record<Theme['id'], string>> = {
  'luxury-dark': `
.hero__title{font-weight:500}
.eyebrow{letter-spacing:0.28em;font-weight:500}
.card{border-radius:2px}
.section-head .lead{font-weight:300}
h2 em,.h2 em,.hero__title em{font-style:italic;font-weight:400}
.rule-gold{height:1px;background:linear-gradient(90deg,transparent,var(--c-accent),transparent)}
`,
  industrial: `
.section-head h2::after{content:'';display:block;width:4rem;height:4px;background:var(--c-accent);margin-top:1.25rem}
.section-head--center h2::after{margin-inline:auto}
.eyebrow{font-family:var(--f-display);letter-spacing:0.22em;font-size:0.85rem}
.card{border-left:3px solid var(--c-accent)}
.stat strong{font-family:var(--f-display)}
.hero__title{font-size:clamp(2.8rem,6.5vw,6.5rem)}
.footer{border-top:4px solid var(--c-accent)}
`,
  editorial: `
.section-head h2{font-weight:500}
.eyebrow{font-family:var(--f-body);font-style:italic;text-transform:none;letter-spacing:0;font-size:1rem;color:var(--c-muted)}
.eyebrow::before{width:2.5rem}
.lead{font-family:var(--f-display);font-size:clamp(1.2rem,1.8vw,1.5rem);font-weight:400;font-style:italic}
.prose p:first-of-type::first-letter{font-family:var(--f-display);font-size:3.4em;float:left;line-height:0.85;padding-right:0.5rem;padding-top:0.15rem;color:var(--c-accent)}
.card{border-top:2px solid var(--c-text)}
.footer{background:var(--c-text);color:var(--c-bg);border-top:0}
.footer h4,.footer__brand p,.footer__bottom{color:color-mix(in srgb,var(--c-bg) 65%,transparent)}
.footer .social a{border-color:color-mix(in srgb,var(--c-bg) 30%,transparent)}
`,
  automotive: `
.hero__title{font-style:italic;letter-spacing:0.01em}
.eyebrow{font-family:var(--f-display);letter-spacing:0.25em}
.btn{clip-path:polygon(0 0,calc(100% - 0.7rem) 0,100% 0.7rem,100% 100%,0.7rem 100%,0 calc(100% - 0.7rem));border-radius:0}
.btn--whatsapp,.wa-float{clip-path:none}
.card{border-top:2px solid var(--c-accent)}
.section-head h2::before{content:'//';color:var(--c-accent);margin-right:0.5rem;font-size:0.6em;vertical-align:middle}
.stat strong{font-style:italic}
.header{border-bottom:1px solid var(--c-border)}
`,
  architecture: `
.hero__title{font-weight:300;font-size:clamp(2.2rem,5vw,4.8rem);letter-spacing:0.12em}
.section-head h2{font-size:clamp(1.6rem,2.6vw,2.4rem);letter-spacing:0.16em}
.eyebrow{font-weight:400;letter-spacing:0.3em;color:var(--c-muted)}
.lead{font-weight:300;font-size:1.1rem}
.card h3{font-weight:400;letter-spacing:0.08em;text-transform:uppercase;font-size:1rem}
.stat strong{font-weight:300}
.media{border-radius:0}
.footer{background:var(--c-text);color:var(--c-bg)}
.footer h4,.footer__brand p,.footer__bottom{color:color-mix(in srgb,var(--c-bg) 60%,transparent)}
.footer .social a{border-color:color-mix(in srgb,var(--c-bg) 30%,transparent)}
.btn{font-weight:400}
`,
  'medical-clean': `
.section--alt{background:linear-gradient(180deg,var(--c-bg-alt),var(--c-bg))}
.card__icon{background:color-mix(in srgb,var(--c-accent) 10%,transparent);border-radius:999px;width:3.25rem;height:3.25rem}
.hero .media{border-radius:var(--r-xl)}
.eyebrow{background:color-mix(in srgb,var(--c-accent) 10%,transparent);padding:0.4rem 0.8rem;border-radius:999px;letter-spacing:0.08em;font-size:0.78rem}
.eyebrow::before{display:none}
.btn{box-shadow:0 10px 24px -12px color-mix(in srgb,var(--c-accent) 60%,transparent)}
`,
  'local-business': `
.hero__title{font-size:clamp(2.6rem,6vw,5rem)}
.eyebrow{background:var(--c-bg-alt);padding:0.4rem 0.9rem;border-radius:999px;letter-spacing:0.06em}
.eyebrow::before{display:none}
.card{border:2px solid transparent}
.card:hover{border-color:var(--c-accent)}
.card__icon{border-radius:999px;width:3.25rem;height:3.25rem;background:var(--c-bg-alt)}
.btn{font-weight:800}
.stat strong{color:var(--c-accent)}
`,
  ecommerce: `
.product .media{background:var(--c-bg-alt)}
.btn{font-weight:600}
.eyebrow{color:var(--c-accent-2)}
.section-head h2{letter-spacing:-0.02em}
`,
  'high-contrast': `
.hero__title{font-size:clamp(3rem,8vw,7.5rem);line-height:0.92}
.section-head h2{font-size:clamp(2.2rem,5vw,4.2rem)}
.section{border-top:1px solid var(--c-border)}
.card{border:1px solid var(--c-text)}
.card:hover{background:var(--c-accent);color:var(--c-accent-contrast)}
.card:hover p,.card:hover .card__icon{color:var(--c-accent-contrast)}
.card__icon{background:transparent;border:1px solid currentColor}
.eyebrow{color:var(--c-accent)}
.btn:hover{box-shadow:6px 6px 0 0 var(--c-accent)}
.stat strong{color:var(--c-accent)}
.footer{background:var(--c-accent);color:var(--c-accent-contrast);border-top:0}
.footer h4,.footer__brand p,.footer__bottom{color:color-mix(in srgb,var(--c-accent-contrast) 70%,transparent)}
.footer .social a{border-color:var(--c-accent-contrast)}
.footer a:hover{color:var(--c-accent-contrast);text-decoration:underline}
.footer--big .footer__wordmark{color:color-mix(in srgb,var(--c-accent-contrast) 12%,transparent)}
`,
};

export function buildCss(theme: Theme, config: SiteConfig): string {
  return [themeVariables(theme, config.theme.overrides), BASE_CSS, THEME_EXTRAS[theme.id] ?? ''].join('\n');
}

export { BASE_CSS };
