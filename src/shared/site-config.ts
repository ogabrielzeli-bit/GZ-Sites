/**
 * site.config — a configuração que descreve um site inteiro gerado pelo GZ Engine.
 * Prévias e projetos finais são renderizados a partir deste objeto.
 * Tudo aqui é dado puro (JSON) → o engine transforma em HTML/CSS/JS estático.
 */
import { z } from 'zod';
import { SEGMENT_IDS } from './segments';

export const THEME_IDS = [
  'luxury-dark',
  'minimal-light',
  'industrial',
  'editorial',
  'automotive',
  'architecture',
  'medical-clean',
  'local-business',
  'ecommerce',
  'high-contrast',
] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const SECTION_TYPES = [
  'hero',
  'hero-video',
  'hero-split',
  'hero-fullscreen',
  'manifesto',
  'benefits',
  'services',
  'products',
  'catalog',
  'about',
  'numbers',
  'projects',
  'gallery',
  'before-after',
  'testimonials',
  'faq',
  'process',
  'team',
  'logos',
  'cta',
  'form',
  'map',
  'contact',
  'footer',
  'sticky-cta',
  'whatsapp-float',
  'portfolio-masonry',
  'horizontal-scroll',
  'timeline',
  'comparison',
  'statistics',
  'marquee',
  'header',
  'pricing',
  'hours',
] as const;
export type SectionType = (typeof SECTION_TYPES)[number];

export const ImageRef = z.object({
  src: z.string().min(1),
  alt: z.string().default(''),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  /** Quando true, a imagem é um placeholder gerado (SVG) e deve ser substituída por foto real */
  placeholder: z.boolean().optional(),
});
export type ImageRef = z.infer<typeof ImageRef>;

export const ServiceItem = z.object({
  title: z.string(),
  description: z.string().default(''),
  icon: z.string().optional(),
  image: ImageRef.optional(),
  price: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const TestimonialItem = z.object({
  quote: z.string(),
  author: z.string(),
  role: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  image: ImageRef.optional(),
});

export const FaqItem = z.object({ question: z.string(), answer: z.string() });
export const StatItem = z.object({ value: z.string(), label: z.string(), suffix: z.string().optional() });
export const StepItem = z.object({ title: z.string(), description: z.string().default('') });
export const TeamMember = z.object({
  name: z.string(),
  role: z.string().optional(),
  image: ImageRef.optional(),
  bio: z.string().optional(),
});
export const ProjectItem = z.object({
  title: z.string(),
  category: z.string().optional(),
  description: z.string().optional(),
  image: ImageRef.optional(),
  images: z.array(ImageRef).optional(),
  year: z.string().optional(),
});

export const SectionInstance = z.object({
  /** tipo de seção (ver SECTION_TYPES) */
  type: z.enum(SECTION_TYPES),
  /** variação visual da seção (cada tipo tem suas variantes) */
  variant: z.string().optional(),
  /** id/âncora opcional (ex.: "servicos") */
  id: z.string().optional(),
  /** se false a seção é ignorada no build (útil para testar) */
  enabled: z.boolean().default(true),
  /** propriedades específicas da seção (validadas pelo engine) */
  props: z.record(z.string(), z.unknown()).default({}),
});
export type SectionInstance = z.infer<typeof SectionInstance>;

export const PageConfig = z.object({
  path: z.string().regex(/^\/[a-z0-9\-/]*$/, 'caminho deve começar com / e usar letras minúsculas'),
  title: z.string(),
  description: z.string().optional(),
  /** se true, não aparece no menu */
  hidden: z.boolean().default(false),
  sections: z.array(SectionInstance),
});
export type PageConfig = z.infer<typeof PageConfig>;

export const ThemeOverrides = z
  .object({
    colors: z.record(z.string(), z.string()).optional(),
    fonts: z.object({ display: z.string().optional(), body: z.string().optional() }).optional(),
    radius: z.enum(['none', 'sm', 'md', 'lg', 'xl', 'pill']).optional(),
  })
  .default({});

export const SiteConfigSchema = z.object({
  version: z.literal(1).default(1),
  brand: z.object({
    name: z.string().min(1),
    tagline: z.string().optional(),
    logo: ImageRef.nullable().optional(),
    /** texto exibido quando não há logo (default: name) */
    logoText: z.string().optional(),
    favicon: z.string().optional(),
  }),
  theme: z.object({
    id: z.enum(THEME_IDS),
    overrides: ThemeOverrides,
  }),
  business: z.object({
    segment: z.enum(SEGMENT_IDS),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().default('Brasil'),
    yearsExperience: z.number().int().nonnegative().optional(),
    foundedYear: z.number().int().optional(),
    description: z.string().optional(),
    differentials: z.array(z.string()).default([]),
    services: z.array(ServiceItem).default([]),
    products: z.array(ServiceItem).default([]),
    testimonials: z.array(TestimonialItem).default([]),
    faqs: z.array(FaqItem).default([]),
    stats: z.array(StatItem).default([]),
    steps: z.array(StepItem).default([]),
    team: z.array(TeamMember).default([]),
    projects: z.array(ProjectItem).default([]),
    hours: z.array(z.object({ days: z.string(), hours: z.string() })).default([]),
    serviceAreas: z.array(z.string()).default([]),
  }),
  contact: z.object({
    whatsapp: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    mapQuery: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    linkedin: z.string().optional(),
    youtube: z.string().optional(),
    tiktok: z.string().optional(),
    /** mensagem inicial do link do WhatsApp */
    whatsappMessage: z.string().optional(),
  }),
  seo: z
    .object({
      lang: z.string().default('pt-BR'),
      title: z.string().optional(),
      description: z.string().optional(),
      keywords: z.array(z.string()).default([]),
      ogImage: z.string().optional(),
      /** URL pública final (para canonical/sitemap). Opcional. */
      siteUrl: z.string().optional(),
      noindex: z.boolean().default(false),
    })
    .default({ lang: 'pt-BR', keywords: [], noindex: false }),
  animations: z
    .object({
      enabled: z.boolean().default(true),
      intensity: z.enum(['subtle', 'normal', 'bold']).default('normal'),
      parallax: z.boolean().default(true),
      magnetic: z.boolean().default(true),
      textReveal: z.boolean().default(true),
      smoothScroll: z.boolean().default(false),
    })
    .default({
      enabled: true,
      intensity: 'normal',
      parallax: true,
      magnetic: true,
      textReveal: true,
      smoothScroll: false,
    }),
  integrations: z
    .object({
      /** como o formulário envia: netlify (Netlify Forms), whatsapp (abre conversa), mailto, none */
      form: z.enum(['netlify', 'whatsapp', 'mailto', 'none']).default('whatsapp'),
      analytics: z
        .object({ provider: z.enum(['none', 'plausible', 'ga4']).default('none'), id: z.string().optional() })
        .default({ provider: 'none' }),
    })
    .default({ form: 'whatsapp', analytics: { provider: 'none' } }),
  assets: z
    .object({
      images: z.array(ImageRef.extend({ id: z.string() })).default([]),
    })
    .default({ images: [] }),
  pages: z.array(PageConfig).min(1),
  /** marca d'água de prévia: mostra barra "Prévia GZ Sites" */
  previewMode: z.boolean().default(false),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;
export type SiteConfigInput = z.input<typeof SiteConfigSchema>;

export function parseSiteConfig(input: unknown): SiteConfig {
  return SiteConfigSchema.parse(input);
}

export function safeParseSiteConfig(input: unknown) {
  return SiteConfigSchema.safeParse(input);
}
