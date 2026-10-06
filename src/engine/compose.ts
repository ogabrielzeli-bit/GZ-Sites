/**
 * Site Composer adaptativo — BusinessDNA + direção criativa + assets → composição de seções,
 * copy baseada em serviços reais e parâmetros de tema/motion. Determinístico por seed.
 */
import type { BusinessDNA, CreativeDirection, CreativityLevel, Location, ProspectAsset, ImageAnalysis, VideoAnalysis } from '@shared/v2';
import type { ImageRef, SiteConfig } from '@shared/site-config';
import { hashString, seededRandom, uniq } from '@shared/utils';
import type { Blueprint } from './presets/layouts';
import { generateSiteConfig, type GenerateInput } from './generate';
import { contrastRatio } from './color';
import type { CompositionId, HeroFamily } from './creative';

export interface ComposeInput extends Omit<GenerateInput, 'theme' | 'layout' | 'blueprints'> {
  dna: BusinessDNA;
  direction: CreativeDirection;
  assets?: ProspectAsset[];
  locations?: Location[];
  seed?: number;
  creativity?: CreativityLevel;
}

export interface ComposeResult {
  config: SiteConfig;
  blueprints: Blueprint[];
  fingerprint: string;
  assetsUsed: string[];
  headline: string;
}

type Rnd = () => number;
const pick = <T>(arr: readonly T[], rnd: Rnd): T => arr[Math.floor(rnd() * arr.length)];

/** Separa os assets por função, respeitando papéis manuais (hero/gallery/background/none). */
export function planAssets(assets: ProspectAsset[] = []) {
  const usable = assets.filter((a) => a.role !== 'none');
  const videos = usable.filter((a) => a.kind === 'video');
  const images = usable.filter((a) => a.kind !== 'video');
  const heroVideo = videos.find((v) => v.role === 'hero') ?? (videos.some((v) => v.role === 'background') ? undefined : videos[0]);
  const bgVideo = videos.find((v) => v.role === 'background');
  const byHero = [...images].sort((a, b) => (((b.analysis as ImageAnalysis)?.heroScore ?? 0) - ((a.analysis as ImageAnalysis)?.heroScore ?? 0)));
  const heroImage = images.find((i) => i.role === 'hero') ?? byHero[0];
  const gallery = images.filter((i) => i.role === 'gallery' || (i.role !== 'hero' && i !== heroImage));
  const toRef = (a: ProspectAsset): ImageRef => ({ src: a.path, alt: a.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]/g, ' '), width: a.width, height: a.height });
  return { heroVideo, bgVideo, heroImage: heroImage ? toRef(heroImage) : undefined, gallery: gallery.map(toRef), photos: images.map(toRef), toRef };
}

/** Gerador determinístico de headlines a partir de serviços reais (várias estruturas). */
export function generateHeadline(dna: BusinessDNA, rnd: Rnd, city?: string, name?: string): { headline: string; sub: string } {
  const s = dna.priorityServices.length ? dna.priorityServices : dna.keyServices;
  const lc = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
  const a = s[0] ? lc(s[0]) : '', b = s[1] ? lc(s[1]) : '', c = s[2] ? lc(s[2]) : '';
  const ind = lc(dna.subIndustry);
  const local = city ? ` em ${city}` : '';
  const structures: (() => string)[] = [];
  if (a && b) structures.push(() => `Do ${a} à ${b}, *cuidado* em cada detalhe.`, () => `${cap(a)}, ${b}${c ? ` e ${c}` : ''} com *acabamento* de verdade.`, () => `${cap(a)} e ${b} feitos para *durar*.`);
  if (a) structures.push(() => `${cap(a)} como tem que ser: *bem feito*${local}.`, () => `Quem entende de ${a} *não improvisa*.`);
  if (dna.conversionGoal === 'agendamento') structures.push(() => `${cap(ind)}${local} com *hora marcada* e resultado.`);
  if (dna.conversionGoal === 'reserva') structures.push(() => `A mesa que ${city ?? 'a cidade'} *comenta*.`);
  if (dna.premiumLevel !== 'standard') structures.push(() => `${cap(ind)} em *outro nível*${local}.`);
  structures.push(() => `${cap(ind)}${local}: ${lc(dna.positioning).replace(/\.$/, '')}*.*`.replace('*.*', '.'), () => `${name ? name + ': ' : ''}${lc(dna.positioning)}.`);
  const headline = pick(structures, rnd)();
  const subParts = [s.length >= 3 ? `${cap(a)}, ${b}, ${c}${s[3] ? ` e mais` : ''}.` : s.length ? `${cap(a)}${b ? ` e ${b}` : ''}.` : ''];
  const goalLine = { orcamento: 'Orçamento rápido pelo WhatsApp.', agendamento: 'Agende pelo WhatsApp em poucos minutos.', reserva: 'Reserve sua mesa pelo WhatsApp.', contato: 'Fale com a gente e receba uma proposta.', compra: 'Peça pelo WhatsApp e receba em casa.', visita: 'Venha conhecer o espaço.' }[dna.conversionGoal];
  const sub = [`${dna.positioning.charAt(0).toUpperCase() + dna.positioning.slice(1)}${local ? `, ${local.trim()}` : ''}.`, subParts[0], goalLine].filter(Boolean).join(' ');
  return { headline, sub };
  function cap(t: string) {
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
}

/** CTA final contextual */
export function finalCtaCopy(dna: BusinessDNA, name: string, rnd: Rnd): { title: string; text: string } {
  const byGoal: Record<BusinessDNA['conversionGoal'], string[]> = {
    agendamento: ['Agende seu *serviço*.', `Seu ${/automotiv/i.test(dna.industry) ? 'carro' : 'momento'} merece esse *cuidado*.`, 'Garanta seu *horário*.'],
    orcamento: ['Peça seu *orçamento* hoje.', `Fale com a *${name}*.`, 'Seu projeto começa com uma *conversa*.'],
    reserva: ['Faça sua *reserva*.', 'Sua mesa está *esperando*.'],
    contato: ['Vamos conversar sobre o seu *projeto*?', `Fale com a *${name}*.`],
    compra: ['Peça agora pelo *WhatsApp*.', 'Encontre o que você *procura*.'],
    visita: ['Venha nos *conhecer*.', 'Estamos *esperando* você.'],
  };
  const texts: Record<BusinessDNA['conversionGoal'], string> = {
    agendamento: 'Chame no WhatsApp, escolha o melhor horário e deixe o resto com a gente.',
    orcamento: 'Mande uma foto ou as medidas pelo WhatsApp. Respondemos rápido com uma estimativa.',
    reserva: 'Chame no WhatsApp e garanta seu lugar.',
    contato: 'Conte o que você precisa. Respondemos com os próximos passos.',
    compra: 'Mande o que você procura e a gente separa.',
    visita: 'Endereço, horários e WhatsApp logo abaixo.',
  };
  return { title: pick(byGoal[dna.conversionGoal], rnd), text: texts[dna.conversionGoal] };
}

/** Composições por arquétipo; cada uma reage ao DNA/assets. */
function composition(id: CompositionId, dna: BusinessDNA, plan: ReturnType<typeof planAssets>, dir: CreativeDirection, rnd: Rnd, creativity: CreativityLevel, locations: Location[], seed = 0): Blueprint[] {
  const manyPhotos = plan.gallery.length >= 4;
  const hasVideo = !!plan.heroVideo;
  const hero = heroBlueprint(dir.hero as HeroFamily, dna, plan, rnd);
  const galleryVariant = manyPhotos ? pick(['filmstrip', 'editorial', 'stacked'] as const, rnd) : 'editorial';
  const headerVariant = ['cinematic', 'video', 'editorial'].includes(dir.hero) ? 'transparent' : 'default';
  const servicesVariant = dna.keyServices.length >= 6 ? pick(['rows', 'minimal'] as const, rnd) : dna.contentDensity === 'low' ? 'alternating' : pick(['cards', 'rows'] as const, rnd);
  const units: Blueprint[] = locations.length > 1 ? [{ type: 'locations', slot: 'locations', tone: 'alt' }] : [];
  const bold = creativity === 'ousado';
  const T = (type: Blueprint['type'], variant?: string, slot?: string, tone?: Blueprint['tone']): Blueprint => ({ type, variant, slot, tone });
  const base: Record<CompositionId, Blueprint[]> = {
    'automotive-showcase': [T('header', headerVariant), hero, T('marquee', 'band'), T('services', 'rows', 'services'), manyPhotos ? T('gallery', galleryVariant, 'gallery', 'alt') : T('horizontal-scroll', undefined, 'hscroll', 'alt'), plan.gallery.length >= 2 ? T('before-after', undefined, 'beforeAfter') : T('benefits', 'numbered', 'benefits'), T('numbers', 'big', 'stats', 'alt'), T('testimonials', 'big', 'testimonials'), ...units, T('cta', 'full', 'finalCta'), T('contact', 'map', 'contact'), T('footer', 'big'), T('whatsapp-float'), T('sticky-cta')],
    'editorial-portfolio': [T('header', headerVariant), hero, T('manifesto', 'left', 'manifesto'), manyPhotos ? T('projects', 'list', 'projects') : T('services', 'alternating', 'services'), T('about', 'stacked', 'about', 'alt'), manyPhotos ? T('gallery', 'editorial', 'gallery') : T('numbers', 'grid', 'stats'), T('process', 'timeline', 'process', 'alt'), T('testimonials', 'big', 'testimonials'), ...units, T('cta', 'band', 'finalCta', 'accent'), T('contact', 'form', 'contact'), T('footer', 'big'), T('whatsapp-float')],
    'trust-booking': [T('header', 'default'), hero, T('services', 'cards', 'services', 'alt'), T('benefits', 'grid', 'benefits'), T('about', 'image-left', 'about', 'alt'), T('team', 'grid', 'team'), T('numbers', 'cards', 'stats', 'alt'), T('faq', 'split', 'faq'), ...units, T('cta', 'card', 'finalCta'), T('contact', 'form', 'contact', 'alt'), T('footer', 'columns'), T('whatsapp-float'), T('sticky-cta')],
    'local-conversion': [T('header', 'default'), hero, T('benefits', 'grid', 'benefits', 'alt'), T('services', servicesVariant, 'services'), manyPhotos ? T('gallery', galleryVariant, 'gallery', 'alt') : T('about', 'split', 'about', 'alt'), T('numbers', 'inline', 'stats'), T('testimonials', 'cards', 'testimonials', 'alt'), T('faq', 'stacked', 'faq'), ...units, T('cta', 'card', 'finalCta'), T('contact', 'map', 'contact', 'alt'), T('footer', 'columns'), T('whatsapp-float'), T('sticky-cta')],
    'catalog-sales': [T('header', 'default'), hero, T('marquee', 'band'), T('catalog', 'featured', 'catalog'), T('benefits', 'list', 'benefits', 'alt'), T('products', 'grid-4', 'products'), T('testimonials', 'slider', 'testimonials', 'alt'), T('comparison', undefined, 'comparison'), T('faq', 'stacked', 'faq', 'alt'), ...units, T('cta', 'card', 'finalCta'), T('contact', 'simple', 'contact', 'alt'), T('footer', 'columns'), T('whatsapp-float'), T('sticky-cta')],
    'cinematic-story': [T('header', headerVariant), hero, T('manifesto', 'center', 'manifesto'), T('services', 'alternating', 'services', 'alt'), manyPhotos ? T('gallery', galleryVariant, 'gallery') : T('about', 'stack-media', 'about'), T('numbers', 'big', 'stats', 'alt'), T('testimonials', 'big', 'testimonials'), T('process', 'columns', 'process', 'alt'), ...units, T('cta', 'full', 'finalCta'), T('contact', 'form', 'contact'), T('footer', 'big'), T('whatsapp-float'), T('sticky-cta')],
    'technical-grid': [T('header', 'default'), hero, T('services', 'minimal', 'services'), T('numbers', 'inline', 'stats', 'alt'), T('benefits', 'numbered', 'benefits'), manyPhotos ? T('portfolio-masonry', undefined, 'projects', 'alt') : T('projects', 'grid', 'projects', 'alt'), T('process', 'timeline', 'process'), T('comparison', undefined, 'comparison', 'alt'), T('testimonials', 'cards', 'testimonials'), ...units, T('cta', 'band', 'finalCta', 'accent'), T('contact', 'form', 'contact'), T('footer', 'columns'), T('whatsapp-float'), T('sticky-cta')],
    'minimal-luxury': [T('header', headerVariant), hero, T('manifesto', 'center', 'manifesto'), T('services', 'rows', 'services'), manyPhotos ? T('gallery', 'stacked', 'gallery', 'alt') : T('about', 'stack-media', 'about', 'alt'), T('testimonials', 'big', 'testimonials'), T('numbers', 'grid', 'stats', 'alt'), ...units, T('cta', 'full', 'finalCta'), T('contact', 'simple', 'contact'), T('footer', 'big'), T('whatsapp-float')],
  };
  let list = base[id];
  // densidade: conteúdo baixo remove uma seção informativa; alto adiciona FAQ
  if (dna.contentDensity === 'low') list = list.filter((b, i) => !(b.type === 'faq' && i > 4) && b.type !== 'comparison');
  if (dna.contentDensity === 'high' && !list.some((b) => b.type === 'faq')) list.splice(list.length - 4, 0, T('faq', 'stacked', 'faq'));
  if (!hasVideo && hero.type === 'hero-video') list[1] = heroBlueprint('cinematic', dna, plan, rnd);
  if (bold && !list.some((b) => b.type === 'marquee')) list.splice(2, 0, T('marquee', 'outline'));
  return remix(list, rnd, seed);
}

/** Variações determinísticas por seed (regenerar composição): troca variantes e reordena o miolo sem quebrar a estrutura. */
const ALT_VARIANTS: Partial<Record<string, string[]>> = {
  services: ['rows', 'cards', 'minimal', 'alternating'],
  testimonials: ['big', 'cards', 'slider'],
  numbers: ['big', 'grid', 'inline', 'cards'],
  benefits: ['numbered', 'grid', 'list'],
  cta: ['full', 'band', 'card'],
  about: ['stack-media', 'stacked', 'split', 'image-left'],
  gallery: ['editorial', 'filmstrip', 'stacked', 'uniform'],
  faq: ['split', 'stacked'],
  process: ['columns', 'timeline'],
};
function remix(list: Blueprint[], rnd: Rnd, seed: number): Blueprint[] {
  if (seed <= 0) return list;
  const out = list.map((b) => ({ ...b }));
  // 1) troca a variante de 2–3 seções informativas
  const candidates = out.map((b, i) => [b, i] as const).filter(([b]) => ALT_VARIANTS[b.type]);
  const n = Math.min(candidates.length, 2 + (seed % 2));
  for (let k = 0; k < n && candidates.length; k++) {
    const [b] = candidates.splice(Math.floor(rnd() * candidates.length), 1)[0];
    const alts = ALT_VARIANTS[b.type]!.filter((v) => v !== b.variant);
    if (alts.length) b.variant = pick(alts, rnd);
  }
  // 2) inverte duas seções do miolo (entre hero+1 e cta-1), nunca header/hero/footer/float
  const lo = 3, hi = out.findIndex((b) => b.type === 'cta') - 1;
  if (hi - lo >= 2 && rnd() < 0.7) {
    const i = lo + Math.floor(rnd() * (hi - lo));
    const j = Math.min(hi, i + 1);
    if (i !== j) [out[i], out[j]] = [out[j], out[i]];
  }
  // 3) marquee entra/sai conforme o seed
  const mi = out.findIndex((b) => b.type === 'marquee');
  if (mi > 0 && seed % 3 === 2) out.splice(mi, 1);
  return out;
}

function heroBlueprint(family: HeroFamily, dna: BusinessDNA, plan: ReturnType<typeof planAssets>, rnd: Rnd): Blueprint {
  const showServices = dna.priorityServices.length >= 3;
  switch (family) {
    case 'video':
      return plan.heroVideo ? { type: 'hero-video', variant: showServices ? 'bottom' : 'center', slot: 'hero' } : { type: 'hero-fullscreen', variant: 'bottom', slot: 'hero' };
    case 'cinematic':
      return { type: 'hero-fullscreen', variant: pick(['bottom', 'center'] as const, rnd), slot: 'hero' };
    case 'editorial':
      return { type: 'hero-editorial', variant: plan.photos.length ? pick(['statement', 'offset'] as const, rnd) : 'statement', slot: 'hero' };
    case 'showcase':
      return { type: 'hero-showcase', variant: showServices ? 'services' : 'media', slot: 'hero' };
    case 'layered':
      return plan.photos.length >= 2 ? { type: 'hero-layered', slot: 'hero' } : { type: 'hero-split', variant: 'image-right', slot: 'hero' };
    case 'numbers':
      return { type: 'hero-split', variant: pick(['image-right', 'image-left'] as const, rnd), slot: 'hero', props: { withStats: true } };
    case 'conversion':
      return { type: 'hero', variant: pick(['split', 'stacked'] as const, rnd), slot: 'hero' };
    default:
      return { type: 'hero-split', variant: 'image-right', slot: 'hero' };
  }
}

export function fingerprintOf(bps: Blueprint[], theme: string, motion: string): string {
  return [theme, motion, ...bps.map((b) => `${b.type}${b.variant ? ':' + b.variant : ''}`)].join('|');
}

/** Similaridade estrutural 0..1 entre dois fingerprints (Jaccard sobre seções + bônus de mesma ordem/tema). */
export function similarity(a: string, b: string): number {
  const [ta, ma, ...sa] = a.split('|');
  const [tb, mb, ...sb] = b.split('|');
  const A = new Set(sa), B = new Set(sb);
  const inter = [...A].filter((x) => B.has(x)).length;
  const jacc = inter / Math.max(1, new Set([...A, ...B]).size);
  let order = 0;
  for (let i = 0; i < Math.min(sa.length, sb.length); i++) if (sa[i] === sb[i]) order++;
  const orderScore = order / Math.max(sa.length, sb.length, 1);
  return Math.min(1, jacc * 0.5 + orderScore * 0.3 + (ta === tb ? 0.12 : 0) + (ma === mb ? 0.08 : 0));
}

export function composeSite(input: ComposeInput): ComposeResult {
  const { dna, direction } = input;
  const seed = input.seed ?? 0;
  const rnd = seededRandom(hashString(`${input.name}|${direction.id}|${seed}`));
  const plan = planAssets(input.assets ?? []);
  const locations = input.locations ?? [];
  const blueprints = composition(direction.composition as CompositionId, dna, plan, direction, rnd, input.creativity ?? 'equilibrado', locations, seed);
  const { headline, sub } = generateHeadline(dna, rnd, input.city, input.name);
  const final = finalCtaCopy(dna, input.name, rnd);
  const video = plan.heroVideo;
  const videoAnalysis = video?.analysis as VideoAnalysis | undefined;
  const themeOverrides: SiteConfig['theme']['overrides'] = {
    colors: direction.palette.bg || direction.palette.accent ? { bg: direction.palette.bg, accent: direction.palette.accent, text: direction.palette.text, accentContrast: contrastRatio('#000000', direction.palette.accent) >= 4.5 ? '#000000' : '#ffffff' } : undefined,
    fonts: { display: direction.typography.display, body: direction.typography.body },
  };
  const services: { title: string; description?: string }[] = (input.services?.length ? input.services : dna.keyServices.map((t) => ({ title: t }))).map((s: { title: string; description?: string }) => ({ title: s.title, description: s.description }));
  const { config } = generateSiteConfig({
    ...input,
    services,
    differentials: input.differentials?.length ? input.differentials : undefined,
    photos: plan.photos,
    theme: direction.theme,
    blueprints,
    themeOverrides,
    motionProfile: direction.motion,
    hero: {
      headline,
      subheadline: sub,
      primaryCta: dna.primaryCTA,
      secondaryCta: dna.secondaryCTA,
      image: plan.heroImage,
      video: video ? { src: videoAnalysis?.optimized ?? video.path, poster: video.poster, duration: videoAnalysis?.duration } : undefined,
      services: dna.priorityServices.slice(0, 4),
    },
    finalCta: final,
    locations,
    seed,
  });
  const assetsUsed = uniq([video?.path, plan.heroImage?.src, ...plan.gallery.slice(0, 12).map((g) => g.src)].filter(Boolean) as string[]);
  return { config, blueprints, fingerprint: fingerprintOf(blueprints, direction.theme, direction.motion), assetsUsed, headline };
}

/** Reaplica valores bloqueados (caminhos JSON "a.b.0.c") de uma config antiga sobre a nova. */
export function applyLocks(next: SiteConfig, prev: unknown, locks: string[] = []): SiteConfig {
  const out = JSON.parse(JSON.stringify(next));
  for (const p of locks) {
    const parts = p.split('.');
    let src: any = prev, dst: any = out;
    for (let i = 0; i < parts.length - 1; i++) {
      src = src?.[parts[i]];
      if (dst[parts[i]] === undefined) dst[parts[i]] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      dst = dst[parts[i]];
    }
    const last = parts[parts.length - 1];
    if (src && src[last] !== undefined) dst[last] = JSON.parse(JSON.stringify(src[last]));
  }
  return out as SiteConfig;
}
