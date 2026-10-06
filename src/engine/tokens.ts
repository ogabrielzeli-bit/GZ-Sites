/**
 * GZ Design Tokens — valores centrais usados por todos os temas e seções.
 * Os temas sobrescrevem cores/fontes; estes tokens definem ritmo, escala e movimento.
 */
export const tokens = {
  typography: {
    /** escala modular (rem) — display → caption */
    scale: {
      display: 'clamp(2.6rem, 5.6vw, 5.6rem)',
      h1: 'clamp(2.4rem, 5vw, 4.5rem)',
      h2: 'clamp(1.9rem, 3.4vw, 3rem)',
      h3: 'clamp(1.3rem, 2vw, 1.75rem)',
      h4: '1.15rem',
      lead: 'clamp(1.1rem, 1.5vw, 1.35rem)',
      body: '1rem',
      small: '0.875rem',
      caption: '0.75rem',
    },
    lineHeight: { tight: '0.98', snug: '1.1', normal: '1.55', relaxed: '1.7' },
    tracking: { tight: '-0.03em', normal: '0', wide: '0.08em', wider: '0.18em' },
  },
  spacing: {
    /** espaçamento de seção vertical por "humor" do tema */
    section: {
      compact: 'clamp(3.5rem, 7vw, 6rem)',
      normal: 'clamp(5rem, 10vw, 9rem)',
      generous: 'clamp(6rem, 13vw, 12rem)',
    },
    gutter: 'clamp(1.25rem, 4vw, 3rem)',
    gap: { xs: '0.5rem', sm: '1rem', md: '1.5rem', lg: '2.5rem', xl: '4rem' },
  },
  radius: {
    none: '0px',
    sm: '4px',
    md: '12px',
    lg: '20px',
    xl: '32px',
    pill: '999px',
  },
  shadows: {
    none: 'none',
    soft: '0 10px 40px -10px rgba(0,0,0,0.12)',
    medium: '0 20px 60px -20px rgba(0,0,0,0.25)',
    hard: '0 30px 80px -30px rgba(0,0,0,0.45)',
    glowAccent:
      '0 0 0 1px color-mix(in srgb, var(--c-accent) 35%, transparent), 0 20px 50px -20px color-mix(in srgb, var(--c-accent) 55%, transparent)',
  },
  container: { narrow: '46rem', text: '62rem', default: '80rem', wide: '96rem' },
  motion: {
    duration: { fast: '160ms', base: '320ms', slow: '700ms', reveal: '1000ms' },
    easing: {
      out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
      spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      expo: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
  },
  breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280, xxl: 1536 },
} as const;

export type RadiusKey = keyof typeof tokens.radius;
export type SectionSpacing = keyof typeof tokens.spacing.section;
