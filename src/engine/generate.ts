/**
 * Gera um site.config completo a partir dos dados do prospect/cliente + preset do segmento + copy.
 * 100% determinístico, sem IA. O mesmo input gera sempre o mesmo site.
 */
import type { SegmentId } from '@shared/segments';
import { isSegmentId } from '@shared/segments';
import type { ImageRef, SectionInstance, SiteConfig, ThemeId } from '@shared/site-config';
import { parseSiteConfig, THEME_IDS } from '@shared/site-config';
import { createPicker, getCopy } from './copy';
import type { LayoutArchetype } from './copy/types';
import { LAYOUTS, type Blueprint } from './presets/layouts';
import { formatPhoneBR, normalizeWhatsapp } from '@shared/utils';

export interface GenerateInput {
  name: string;
  segment: string;
  city?: string;
  state?: string;
  country?: string;
  yearsExperience?: number;
  description?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  address?: string;
  instagram?: string;
  facebook?: string;
  website?: string;
  logo?: ImageRef | null;
  photos?: ImageRef[];
  theme?: ThemeId | string;
  layout?: LayoutArchetype | string;
  layoutVariant?: number;
  previewMode?: boolean;
  /** dados extras já conhecidos do cliente (sobrescrevem a copy padrão) */
  differentials?: string[];
  services?: { title: string; description?: string }[];
  hours?: { days: string; hours: string }[];
  /** créditos no rodapé */
  credits?: { name: string; url?: string };
  formMode?: 'netlify' | 'whatsapp' | 'mailto' | 'none';
  seed?: string | number;
  /** V2 — composer adaptativo: blueprints explícitos (substituem o arquétipo fixo) */
  blueprints?: Blueprint[];
  themeOverrides?: SiteConfig['theme']['overrides'];
  motionProfile?: SiteConfig['animations']['profile'];
  hero?: {
    headline?: string;
    subheadline?: string;
    eyebrow?: string;
    primaryCta?: string;
    secondaryCta?: string;
    image?: ImageRef;
    images?: ImageRef[];
    video?: { src: string; poster?: string; duration?: number };
    services?: string[];
  };
  finalCta?: { title: string; text: string };
  locations?: SiteConfig['business']['locations'];
}

export interface GenerateResult {
  config: SiteConfig;
  theme: ThemeId;
  layout: LayoutArchetype;
}

export function resolveTheme(segment: SegmentId, requested: string | undefined, variant: number): ThemeId {
  if (requested && (THEME_IDS as readonly string[]).includes(requested)) return requested as ThemeId;
  const prefs = getCopy(segment).themes;
  return prefs[variant % prefs.length];
}

export function resolveLayout(
  segment: SegmentId,
  requested: string | undefined,
  variant: number,
): LayoutArchetype {
  if (requested && requested in LAYOUTS) return requested as LayoutArchetype;
  const prefs = getCopy(segment).layouts;
  return prefs[variant % prefs.length];
}

export function generateSiteConfig(input: GenerateInput): GenerateResult {
  const segment: SegmentId = isSegmentId(input.segment) ? input.segment : 'servicos';
  const copy = getCopy(segment);
  const variant = input.layoutVariant ?? 0;
  const theme = resolveTheme(segment, input.theme, variant);
  const layout = resolveLayout(segment, input.layout, variant);
  const pick = createPicker(
    {
      empresa: input.name,
      cidade: input.city,
      estado: input.state,
      anos: input.yearsExperience || undefined,
    },
    input.seed !== undefined ? String(input.seed) : `${input.name}|${variant}`,
  );
  const photos = input.photos ?? [];
  let photoIdx = 0;
  const nextPhoto = (): ImageRef | undefined =>
    photos.length ? photos[photoIdx++ % photos.length] : undefined;

  const services = (
    input.services?.length
      ? input.services.map((s, i) => ({
          title: s.title,
          description: s.description ?? copy.services[i % copy.services.length]?.description ?? '',
          icon: copy.services[i % copy.services.length]?.icon,
        }))
      : pick.list(copy.services)
  ).slice(0, 6);
  const differentials = input.differentials?.length ? input.differentials : [];
  const benefits = differentials.length
    ? differentials.map((d, i) => ({
        title: d,
        description: copy.benefits[i % copy.benefits.length]?.description ?? '',
        icon: copy.benefits[i % copy.benefits.length]?.icon,
      }))
    : pick.list(copy.benefits);
  const stats = pick.list(copy.stats).slice(0, 4);
  const testimonials = pick.list(copy.testimonials);
  const faqs = pick.list(copy.faqs);
  const steps = pick.list(copy.steps);
  const projects = pick.list(copy.projects).map((p) => ({ ...p, image: nextPhoto() }));

  const whatsappMessage = pick.text(copy.whatsappMessage);
  const primaryLabel = pick.pick(copy.cta.primary, 1);
  const secondaryLabel = pick.pick(copy.cta.secondary, 2);

  const h = input.hero;
  const heroImage = h?.image ?? nextPhoto();
  const heroProps = {
    eyebrow: h?.eyebrow ?? pick.pick(copy.hero.eyebrow, 3),
    headline: h?.headline ?? pick.pick(copy.hero.headline, 4),
    subheadline: h?.subheadline ?? pick.pick(copy.hero.sub, 5),
    primaryCta: { label: h?.primaryCta ?? primaryLabel },
    secondaryCta: { label: h?.secondaryCta ?? secondaryLabel, href: '#servicos' },
    badges: copy.hero.badges.map((b) => pick.text(b)),
    stats:
      layout === 'impact' && !input.blueprints
        ? stats.slice(0, 3).map((s) => ({ value: s.value + (s.suffix ?? ''), label: s.label }))
        : [],
    image: heroImage,
    images: h?.images ?? (heroImage ? [heroImage, ...photos.filter((p) => p !== heroImage).slice(0, 2)] : []),
    services: h?.services ?? [],
    videoSrc: h?.video?.src,
    poster: h?.video?.poster ? { src: h.video.poster, alt: 'Poster do vídeo' } : undefined,
  };
  const heroStats = stats.slice(0, 3).map((s) => ({ value: s.value + (s.suffix ?? ''), label: s.label }));

  const sections: SectionInstance[] = [];
  for (const bp of input.blueprints ?? LAYOUTS[layout]) {
    const s = buildSection(bp, {
      copy,
      pick,
      heroProps,
      heroStats,
      services,
      benefits,
      stats,
      testimonials,
      faqs,
      steps,
      projects,
      nextPhoto,
      primaryLabel,
      credits: input.credits,
      whatsappMessage,
      finalCta: input.finalCta,
      locations: input.locations ?? [],
    });
    if (s) sections.push(s);
  }
  const motion = input.motionProfile ?? 'elegant';
  const motionIntensity: Record<string, 'subtle' | 'normal' | 'bold'> = {
    minimal: 'subtle',
    technical: 'subtle',
    editorial: 'normal',
    elegant: 'normal',
    performance: 'bold',
    playful: 'bold',
    cinematic: 'bold',
  };

  const hasPhone = !!(input.whatsapp || input.phone);
  const raw = {
    version: 1,
    brand: {
      name: input.name,
      tagline: pick.pick(copy.manifesto, 6).replace(/\*/g, ''),
      logo: input.logo ?? null,
    },
    theme: { id: theme, overrides: input.themeOverrides ?? {} },
    business: {
      segment,
      city: input.city,
      state: input.state,
      country: input.country ?? 'Brasil',
      yearsExperience: input.yearsExperience,
      description: input.description || pick.text(copy.about.paragraphs[0][0]),
      differentials: differentials.length ? differentials : benefits.map((b) => b.title),
      services,
      products: [],
      testimonials,
      faqs,
      stats,
      steps,
      team: [],
      projects,
      hours: input.hours ?? [],
      serviceAreas: input.city ? [input.city] : [],
      locations: input.locations ?? [],
    },
    contact: {
      whatsapp: input.whatsapp ? (normalizeWhatsapp(input.whatsapp) ?? undefined) : undefined,
      phone: input.phone ? formatPhoneBR(input.phone) : undefined,
      email: input.email,
      address: input.address,
      instagram: input.instagram,
      facebook: input.facebook,
      whatsappMessage,
    },
    seo: {
      lang: 'pt-BR',
      title:
        `${input.name}${input.city ? ` · ${input.city}` : ''} — ${pick.pick(copy.hero.eyebrow, 3).replace(/\{cidade\}/g, '')}`
          .replace(/\s+—\s*$/, '')
          .trim(),
      description: pick.pick(copy.seoDescription, 7),
      keywords: copy.keywords.map((k) => pick.text(k)),
      noindex: !!input.previewMode,
    },
    animations: {
      enabled: true,
      profile: motion,
      intensity: motionIntensity[motion] ?? 'normal',
      parallax: motion !== 'minimal',
      magnetic: motion !== 'minimal' && motion !== 'technical',
      textReveal: motion !== 'technical',
      smoothScroll: false,
    },
    integrations: {
      form: input.formMode ?? (hasPhone ? 'whatsapp' : input.email ? 'mailto' : 'netlify'),
      analytics: { provider: 'none' },
    },
    assets: {
      images: photos.map((p, i) => ({ id: `photo-${i}`, ...p })),
      videos: input.hero?.video ? [{ id: 'hero-video', src: input.hero.video.src, poster: input.hero.video.poster, duration: input.hero.video.duration }] : [],
    },
    pages: [{ path: '/', title: 'Início', hidden: false, sections }],
    previewMode: !!input.previewMode,
  };
  return { config: parseSiteConfig(raw), theme, layout };
}

interface BuildCtx {
  copy: ReturnType<typeof getCopy>;
  pick: ReturnType<typeof createPicker>;
  heroProps: Record<string, unknown>;
  heroStats: { value: string; label: string }[];
  finalCta?: { title: string; text: string };
  locations: NonNullable<GenerateInput['locations']>;
  services: { title: string; description: string; icon?: string }[];
  benefits: { title: string; description: string; icon?: string }[];
  stats: { value: string; label: string; suffix?: string }[];
  testimonials: { quote: string; author: string; role?: string; rating?: number }[];
  faqs: { question: string; answer: string }[];
  steps: { title: string; description: string }[];
  projects: { title: string; category: string; description: string; image?: ImageRef }[];
  nextPhoto: () => ImageRef | undefined;
  primaryLabel: string;
  credits?: { name: string; url?: string };
  whatsappMessage: string;
}

function buildSection(bp: Blueprint, c: BuildCtx): SectionInstance | null {
  const { copy, pick } = c;
  const base = (props: Record<string, unknown>): SectionInstance => ({
    type: bp.type,
    variant: bp.variant,
    enabled: true,
    props: { ...(bp.tone ? { tone: bp.tone } : {}), ...props, ...(bp.props ?? {}) },
  });
  switch (bp.type) {
    case 'header':
      return base({});
    case 'hero':
    case 'hero-fullscreen':
    case 'hero-split':
    case 'hero-video':
    case 'hero-editorial':
    case 'hero-showcase':
    case 'hero-layered':
      return base(bp.props?.withStats ? { ...c.heroProps, stats: c.heroStats } : c.heroProps);
    case 'locations':
      if (!c.locations.length) return null;
      return base({
        id: 'unidades',
        navLabel: 'Unidades',
        eyebrow: 'Onde estamos',
        title: c.locations.length > 1 ? 'Nossas *unidades*' : 'Onde *estamos*',
        items: c.locations,
      });
    case 'marquee':
      return base({ items: copy.marquee.map((m) => pick.text(m)) });
    case 'manifesto':
      return base({ text: pick.pick(copy.manifesto, 10), navLabel: undefined });
    case 'services':
      return base({
        id: 'servicos',
        navLabel: 'Serviços',
        eyebrow: pick.text(copy.servicesHead.eyebrow),
        title: pick.pick(copy.servicesHead.title, 11),
        intro: pick.pick(copy.servicesHead.intro, 12),
        items: c.services.map((s, i) => ({
          ...s,
          image: bp.variant === 'alternating' ? c.nextPhoto() : undefined,
          tags: i === 0 ? undefined : undefined,
        })),
      });
    case 'benefits':
      return base({
        id: 'diferenciais',
        navLabel: 'Diferenciais',
        eyebrow: pick.text(copy.benefitsHead.eyebrow),
        title: pick.pick(copy.benefitsHead.title, 13),
        intro: pick.pick(copy.benefitsHead.intro, 14),
        items: c.benefits,
      });
    case 'about': {
      const paras = copy.about.paragraphs.filter((set) =>
        set.every((p) => (p.includes('{anos}') ? !!pick.text('{anos}') : true)),
      );
      const set = paras.length
        ? paras[Math.abs(pick.pick(['0', '1'], 15).length) % paras.length]
        : copy.about.paragraphs[0];
      return base({
        id: 'sobre',
        navLabel: 'Sobre',
        eyebrow: pick.text(copy.about.eyebrow),
        title: pick.pick(copy.about.title, 16),
        paragraphs: set.map((p) => pick.text(p)),
        highlights: copy.about.highlights.map((h) => pick.obj(h)),
        image: c.nextPhoto(),
        image2: c.nextPhoto(),
      });
    }
    case 'numbers':
    case 'statistics':
      return base({
        items: c.stats,
        eyebrow: bp.variant === 'inline' ? undefined : 'Em números',
        title: bp.variant === 'inline' ? undefined : undefined,
      });
    case 'projects':
    case 'portfolio-masonry':
      return base({
        id: 'projetos',
        navLabel: 'Trabalhos',
        eyebrow: pick.text(copy.projectsHead.eyebrow),
        title: pick.pick(copy.projectsHead.title, 17),
        intro: pick.pick(copy.projectsHead.intro, 18),
        items: c.projects,
      });
    case 'gallery':
      return base({
        id: 'galeria',
        navLabel: 'Galeria',
        eyebrow: 'Galeria',
        title: pick.pick(copy.projectsHead.title, 17),
        count: 6,
      });
    case 'process':
    case 'timeline':
      return base({
        id: 'como-funciona',
        navLabel: 'Como funciona',
        eyebrow: pick.text(copy.processHead.eyebrow),
        title: pick.pick(copy.processHead.title, 19),
        intro: pick.pick(copy.processHead.intro, 20),
        items: c.steps,
      });
    case 'testimonials':
      return base({
        id: 'depoimentos',
        navLabel: 'Depoimentos',
        eyebrow: pick.text(copy.testimonialsHead.eyebrow),
        title: pick.pick(copy.testimonialsHead.title, 21),
        items: c.testimonials,
      });
    case 'faq':
      return base({
        id: 'faq',
        navLabel: 'Dúvidas',
        eyebrow: 'Perguntas frequentes',
        title: 'Dúvidas *comuns*',
        intro: 'Se a sua pergunta não estiver aqui, chame no WhatsApp.',
        items: c.faqs,
      });
    case 'cta':
      return base({
        eyebrow: pick.text(copy.finalCta.eyebrow),
        title: c.finalCta?.title ?? pick.pick(copy.finalCta.title, 22),
        text: c.finalCta?.text ?? pick.pick(copy.finalCta.text, 23),
        primaryCta: { label: c.primaryLabel },
        image: c.nextPhoto(),
      });
    case 'contact':
      return base({
        id: 'contato',
        navLabel: 'Contato',
        eyebrow: 'Contato',
        title: 'Fale com a *gente*',
        intro: pick.pick(copy.contactIntro, 24),
      });
    case 'comparison':
      if (!copy.comparison) return null;
      return base({
        title: pick.text(copy.comparison.title),
        left: {
          title: pick.text(copy.comparison.left.title),
          items: copy.comparison.left.items.map((i) => pick.text(i)),
        },
        right: {
          title: pick.text(copy.comparison.right.title),
          items: copy.comparison.right.items.map((i) => pick.text(i)),
        },
      });
    case 'catalog':
    case 'products':
      return base({
        id: bp.type === 'catalog' ? 'catalogo' : 'produtos',
        navLabel: bp.type === 'catalog' ? 'Catálogo' : 'Produtos',
        eyebrow: pick.text(copy.servicesHead.eyebrow),
        title: pick.pick(copy.servicesHead.title, 11),
        intro: pick.pick(copy.servicesHead.intro, 12),
        items: (bp.type === 'catalog' ? c.services.slice(0, 5) : c.services).map((s) => ({
          title: s.title,
          description: s.description,
          image: c.nextPhoto(),
        })),
      });
    case 'horizontal-scroll':
      return base({
        id: 'destaques',
        navLabel: 'Destaques',
        eyebrow: pick.text(copy.benefitsHead.eyebrow),
        title: pick.pick(copy.benefitsHead.title, 13),
        intro: pick.pick(copy.benefitsHead.intro, 14),
        items: c.benefits.map((b) => ({ title: b.title, description: b.description, image: c.nextPhoto() })),
      });
    case 'before-after':
      return base({
        eyebrow: 'Antes e depois',
        title: 'O resultado *fala*',
        intro: 'Arraste para comparar.',
        before: c.nextPhoto(),
        after: c.nextPhoto(),
      });
    case 'footer':
      return base({ credits: c.credits?.name, creditsUrl: c.credits?.url });
    case 'whatsapp-float':
      return base({ message: c.whatsappMessage });
    case 'sticky-cta':
      return base({});
    default:
      return base({});
  }
}
