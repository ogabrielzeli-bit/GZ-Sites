/**
 * Creative Directions — catálogo de direções criativas e seleção baseada no BusinessDNA.
 * Cada direção combina tema, paleta (marca ou tema), tipografia, família de hero, motion e composição.
 * A seleção pontua cada direção contra o DNA (nunca sorteia) e devolve as 3 mais coerentes e distintas.
 */
import type { BusinessDNA, CreativeDirection, CreativityLevel, MotionPersonality } from '@shared/v2';
import type { ThemeId } from '@shared/site-config';
import { THEMES } from './themes';
import { contrastRatio, luminanceOf } from './color';

export type HeroFamily = 'video' | 'cinematic' | 'editorial' | 'split' | 'showcase' | 'layered' | 'conversion' | 'numbers';
export type CompositionId = 'automotive-showcase' | 'editorial-portfolio' | 'trust-booking' | 'local-conversion' | 'catalog-sales' | 'cinematic-story' | 'technical-grid' | 'minimal-luxury';

interface DirectionDef {
  id: string;
  name: string;
  description: string;
  theme: ThemeId;
  hero: HeroFamily;
  motion: MotionPersonality;
  composition: CompositionId;
  /** 'brand' usa as cores da marca (quando existem e têm contraste); 'theme' mantém a paleta do tema */
  palette: 'brand' | 'theme';
  typography?: { display: string; body: string };
  fit: (d: BusinessDNA) => number;
  boldness: number; // 0 conservador … 2 ousado
}

const has = (d: BusinessDNA, ...p: BusinessDNA['visualPersonality'][]) => (p.includes(d.visualPersonality) ? 1 : 0);
const goal = (d: BusinessDNA, ...g: BusinessDNA['conversionGoal'][]) => (g.includes(d.conversionGoal) ? 1 : 0);
const prem = (d: BusinessDNA, ...l: BusinessDNA['premiumLevel'][]) => (l.includes(d.premiumLevel) ? 1 : 0);
const hero = (d: BusinessDNA, h: HeroFamily) => { const i = d.heroPreference.indexOf(h as any); return i < 0 ? 0 : 1 - i * 0.25; };
const dark = (d: BusinessDNA) => (d.brandMode === 'dark' ? 1 : d.brandMode === 'light' ? -0.5 : 0);
const auto = (d: BusinessDNA) => (/automotiv|ve[íi]culo|carro|pe[çc]as|oficina|concession/i.test(d.industry + d.subIndustry) ? 1 : 0);

export const DIRECTIONS: DirectionDef[] = [
  { id: 'performance-luxury', name: 'Performance Luxury', description: 'Preto profundo, destaque metálico, vídeo ou foto cinematográfica em tela cheia, contraste alto e movimentos rápidos e precisos.', theme: 'automotive', hero: 'video', motion: 'performance', composition: 'automotive-showcase', palette: 'brand', boldness: 1, fit: (d) => 3 * auto(d) + 2 * has(d, 'premium', 'performance') + 1.5 * (d.assetProfile.videos ? 1 : 0) + dark(d) + prem(d, 'premium', 'luxury') },
  { id: 'editorial-automotive', name: 'Editorial Automotive', description: 'Tipografia grande, muito espaço, imagens full bleed e composição limpa. Sofisticação sem gritar.', theme: 'high-contrast', hero: 'editorial', motion: 'editorial', composition: 'editorial-portfolio', palette: 'brand', boldness: 2, fit: (d) => 2 * auto(d) + 1.5 * has(d, 'premium', 'bold', 'editorial') + (d.assetProfile.strongPhotos >= 2 ? 1 : -1) + dark(d) },
  { id: 'technical-motorsport', name: 'Technical Motorsport', description: 'Grid técnico, números, linhas finas, serviços em destaque e motion preciso inspirado em performance.', theme: 'industrial', hero: 'numbers', motion: 'technical', composition: 'technical-grid', palette: 'brand', boldness: 1, fit: (d) => 2 * auto(d) + 2 * has(d, 'technical', 'performance') + (d.keyServices.length >= 5 ? 1 : 0) + 0.5 * dark(d) },
  { id: 'minimal-luxury', name: 'Minimal Luxury', description: 'Serifa elegante, respiro, poucas palavras, dourado discreto. Para quem vende exclusividade.', theme: 'luxury-dark', hero: 'cinematic', motion: 'elegant', composition: 'minimal-luxury', palette: 'brand', boldness: 1, fit: (d) => 3 * prem(d, 'luxury') + 1.5 * prem(d, 'premium') + has(d, 'premium') + (d.contentDensity === 'low' ? 1 : 0) + dark(d) },
  { id: 'architecture-editorial', name: 'Architecture Editorial', description: 'Monocromático, grid rígido, caixa alta espaçada, projetos em tela cheia e manifesto. Silêncio e proporção.', theme: 'architecture', hero: 'editorial', motion: 'editorial', composition: 'editorial-portfolio', palette: 'theme', boldness: 1, fit: (d) => 3 * has(d, 'editorial') + 1.5 * (d.tone === 'sofisticado' || d.tone === 'formal' ? 1 : 0) + hero(d, 'editorial') + (d.contentDensity === 'low' ? 1 : 0) - auto(d) },
  { id: 'paper-editorial', name: 'Paper Editorial', description: 'Papel, serifa clássica, filetes e colunas. Parece uma revista. Autoridade com calor.', theme: 'editorial', hero: 'split', motion: 'editorial', composition: 'cinematic-story', palette: 'theme', boldness: 1, fit: (d) => 2 * has(d, 'editorial', 'warm') + 1.5 * (d.tone === 'formal' || d.tone === 'sofisticado' ? 1 : 0) + goal(d, 'contato', 'reserva') - auto(d) },
  { id: 'medical-clean', name: 'Medical Clean', description: 'Branco, azul calmo, cantos suaves, muito ar. Autoridade, estrutura e agendamento fácil.', theme: 'medical-clean', hero: 'split', motion: 'minimal', composition: 'trust-booking', palette: 'theme', boldness: 0, fit: (d) => 3 * has(d, 'clean') + 2 * goal(d, 'agendamento') + (d.tone === 'acolhedor' ? 1 : 0) - 2 * auto(d) },
  { id: 'warm-local', name: 'Warm Local', description: 'Quente, direto e amigável. Botões grandes, WhatsApp em destaque, zero frescura.', theme: 'local-business', hero: 'conversion', motion: 'playful', composition: 'local-conversion', palette: 'theme', boldness: 0, fit: (d) => 2.5 * has(d, 'warm') + 1.5 * goal(d, 'orcamento', 'compra') + prem(d, 'standard') + (d.contentDensity === 'high' ? 1 : 0) },
  { id: 'bold-contrast', name: 'Bold Contrast', description: 'Preto, branco e uma cor ácida. Tipografia gigante, marquee e bordas duras. Impacto imediato.', theme: 'high-contrast', hero: 'editorial', motion: 'performance', composition: 'cinematic-story', palette: 'brand', boldness: 2, fit: (d) => 3 * has(d, 'bold') + 1.5 * (d.motionPersonality === 'performance' ? 1 : 0) + 0.5 * dark(d) },
  { id: 'cinematic-image', name: 'Cinematic Image', description: 'Foto grande em tela cheia com parallax, texto no rodapé do hero, história contada por imagens.', theme: 'luxury-dark', hero: 'cinematic', motion: 'cinematic', composition: 'cinematic-story', palette: 'brand', boldness: 1, fit: (d) => 2 * (d.assetProfile.strongPhotos >= 1 ? 1 : -1) + has(d, 'premium', 'warm') + hero(d, 'cinematic') + 0.5 * dark(d) },
  { id: 'product-showcase', name: 'Product Showcase', description: 'Produtos e serviços em primeiro lugar: cards limpos, etiquetas, preços e CTA de compra.', theme: 'ecommerce', hero: 'showcase', motion: 'minimal', composition: 'catalog-sales', palette: 'brand', boldness: 0, fit: (d) => 3 * goal(d, 'compra') + (d.keyServices.length >= 4 ? 1 : 0) + has(d, 'minimal') },
  { id: 'trust-process', name: 'Trust & Process', description: 'Processo claro, diferenciais numerados, números e prova social. Corporativo sem ser frio.', theme: 'minimal-light', hero: 'split', motion: 'minimal', composition: 'trust-booking', palette: 'brand', boldness: 0, fit: (d) => 2 * has(d, 'minimal', 'clean', 'technical') + 1.5 * (d.tone === 'formal' || d.tone === 'tecnico' ? 1 : 0) + goal(d, 'contato', 'orcamento') },
  { id: 'industrial-heavy', name: 'Industrial Heavy', description: 'Grafite, laranja de segurança, caixa alta condensada, listras e estrutura. Peso e força.', theme: 'industrial', hero: 'split', motion: 'technical', composition: 'technical-grid', palette: 'brand', boldness: 1, fit: (d) => 2.5 * has(d, 'technical', 'bold') + 1.5 * goal(d, 'orcamento') + (/metal|constru|ind[úu]stria|serralheria/i.test(d.industry) ? 2 : 0) },
  { id: 'fresh-warm', name: 'Fresh & Warm', description: 'Fotos quentes, serifa suave, ritmo leve. Para gastronomia, eventos e bem-estar.', theme: 'editorial', hero: 'cinematic', motion: 'elegant', composition: 'cinematic-story', palette: 'theme', boldness: 1, fit: (d) => 2 * has(d, 'warm', 'premium') + 1.5 * goal(d, 'reserva') + (/gastro|buffet|est[ée]tica e beleza|bem-estar/i.test(d.industry) ? 2 : 0) },
];

const BOLD_LIMIT: Record<CreativityLevel, number> = { conservador: 0, equilibrado: 1, ousado: 2 };

/** Paleta final: marca (com contraste garantido) ou tema. */
export function resolvePalette(def: Pick<DirectionDef, 'palette' | 'theme'>, dna: BusinessDNA): CreativeDirection['palette'] {
  const t = THEMES[def.theme];
  const base = { bg: t.colors.bg, accent: t.colors.accent, text: t.colors.text, surface: t.colors.surface };
  if (def.palette !== 'brand' || !dna.brandColors.length) return base;
  const colors = dna.brandColors;
  const bgDark = t.mode === 'dark';
  // destaque: cor da marca com contraste ≥ 3 sobre o fundo do tema; evita cores quase iguais ao fundo
  const accent = colors.find((c) => contrastRatio(c, base.bg) >= 3) ?? base.accent;
  // fundo: se a marca é escura e o tema é escuro, usar o preto da marca; se a marca é clara e o tema claro, idem
  const brandBg = colors.find((c) => (bgDark ? luminanceOf(c) < 0.08 : luminanceOf(c) > 0.85));
  const bg = brandBg ?? base.bg;
  const text = contrastRatio(base.text, bg) >= 4.5 ? base.text : bgDark ? '#f4f2ee' : '#111111';
  return { bg, accent, text, surface: base.surface };
}

function toDirection(def: DirectionDef, dna: BusinessDNA, score: number): CreativeDirection {
  const why: string[] = [];
  if (def.hero === 'video' && dna.assetProfile.videos) why.push('usa o vídeo enviado no hero');
  if (def.palette === 'brand' && dna.brandColors.length) why.push(`aplica a identidade ${dna.brandColors.slice(0, 2).join('/')}`);
  if (dna.priorityServices.length) why.push(`destaca ${dna.priorityServices.slice(0, 3).join(', ')}`);
  why.push(`motion ${def.motion}, hero ${def.hero}`);
  return { id: def.id, name: def.name, description: def.description, theme: def.theme, palette: resolvePalette(def, dna), typography: def.typography ?? { display: THEMES[def.theme].fonts.display.family, body: THEMES[def.theme].fonts.body.family }, hero: def.hero, motion: def.motion, composition: def.composition, score: Number(score.toFixed(2)), why };
}

/** Propõe as N direções mais coerentes e mutuamente distintas (hero/composição diferentes quando possível). */
export function proposeDirections(dna: BusinessDNA, creativity: CreativityLevel = 'equilibrado', n = 3): CreativeDirection[] {
  const limit = BOLD_LIMIT[creativity];
  const scored = DIRECTIONS.map((def) => ({ def, score: def.fit(dna) + (def.boldness > limit ? -1.5 * (def.boldness - limit) : 0) + (creativity === 'ousado' ? def.boldness * 0.4 : 0) }))
    .sort((a, b) => b.score - a.score);
  const out: { def: DirectionDef; score: number }[] = [];
  for (const s of scored) {
    if (out.length >= n) break;
    const similar = out.some((o) => o.def.composition === s.def.composition && o.def.hero === s.def.hero) || out.some((o) => o.def.theme === s.def.theme);
    if (similar && scored.length - out.length > n - out.length) continue;
    out.push(s);
  }
  while (out.length < n && out.length < scored.length) out.push(scored.find((s) => !out.includes(s))!);
  return out.map((s) => toDirection(s.def, dna, s.score));
}

export function pickDirection(dna: BusinessDNA, directionId: string | undefined, creativity: CreativityLevel = 'equilibrado'): CreativeDirection {
  const list = proposeDirections(dna, creativity, 3);
  if (directionId && directionId !== 'auto') {
    const def = DIRECTIONS.find((d) => d.id === directionId);
    if (def) return toDirection(def, dna, def.fit(dna));
  }
  return list[0];
}

export function getDirectionDef(id: string) {
  return DIRECTIONS.find((d) => d.id === id);
}
