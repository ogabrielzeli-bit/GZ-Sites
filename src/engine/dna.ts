/**
 * BusinessDNA — interpreta os dados do negócio (segmento, nome, serviços, observações, assets, pesquisa,
 * auditoria) em uma identidade estruturada. 100% regras e heurísticas; IA pode refinar depois (opcional).
 */
import type { BusinessDNA, ImageAnalysis, MotionPersonality, ProspectAsset, Research, VideoAnalysis, VisualPersonality } from '@shared/v2';
import { isSegmentId, segmentLabel, type SegmentId } from '@shared/segments';
import { uniq } from '@shared/utils';

export interface DnaInput {
  name: string;
  segment: string;
  city?: string;
  state?: string;
  notes?: string;
  services?: { title: string; description?: string }[];
  differentials?: string[];
  brandColors?: string[];
  logo?: ProspectAsset | null;
  assets?: ProspectAsset[];
  research?: Research | null;
  audit?: { overall: number; opportunities: string[] } | null;
  stage?: string;
}

type Base = Omit<BusinessDNA, 'keyServices' | 'priorityServices' | 'assetProfile' | 'brandColors' | 'brandMode' | 'signals' | 'subIndustry' | 'heroPreference'> & { heroPreference: BusinessDNA['heroPreference'] };

const BASE: Record<SegmentId, Base> = {
  serralheria: b('Serralheria e estruturas metálicas', 'residências, comércios e construtoras', 'solidez e acabamento sob medida', 'bold', 'direto', 'orcamento', 'metal, solda, obra, close-up de acabamento', 'technical', 'medium', 'dynamic', 'standard', 'Pedir orçamento', 'Ver trabalhos', ['cinematic', 'split', 'showcase'], 'Oswald', 'Barlow'),
  arquitetura: b('Arquitetura e interiores', 'famílias e empresas que valorizam projeto', 'silêncio, proporção e autoria', 'editorial', 'sofisticado', 'contato', 'luz natural, espaços amplos, materiais, fotografia de arquitetura', 'editorial', 'low', 'calm', 'premium', 'Agendar conversa', 'Ver projetos', ['editorial', 'cinematic', 'layered'], 'Jost', 'Jost'),
  restaurante: b('Gastronomia', 'quem busca uma boa refeição e um lugar para ficar', 'comida de verdade, feita na hora', 'warm', 'acolhedor', 'reserva', 'pratos, cozinha, ambiente, pessoas à mesa', 'cinematic', 'low', 'dynamic', 'premium', 'Reservar mesa', 'Ver cardápio', ['cinematic', 'layered', 'split'], 'Cormorant Garamond', 'Inter'),
  buffet: b('Buffet e eventos', 'noivos, famílias e empresas', 'eventos impecáveis, do cardápio ao serviço', 'premium', 'sofisticado', 'orcamento', 'mesas postas, pratos, festas, detalhes', 'elegant', 'medium', 'calm', 'premium', 'Solicitar orçamento', 'Ver eventos', ['cinematic', 'editorial', 'layered'], 'Playfair Display', 'Source Serif 4'),
  oficina: b('Serviços automotivos', 'motoristas que querem confiança', 'diagnóstico honesto e serviço bem feito', 'technical', 'confiante', 'agendamento', 'oficina, peças, carro no elevador, equipe', 'performance', 'medium', 'dynamic', 'standard', 'Agendar serviço', 'Ver serviços', ['split', 'showcase', 'cinematic'], 'Chakra Petch', 'Inter'),
  'loja-automotiva': b('Peças e acessórios automotivos', 'motoristas e oficinas', 'peça certa, preço justo, entrega rápida', 'bold', 'direto', 'compra', 'produtos, carros, detalhes', 'performance', 'medium', 'dense', 'standard', 'Pedir pelo WhatsApp', 'Ver catálogo', ['showcase', 'split', 'cinematic'], 'Chakra Petch', 'Inter'),
  concessionaria: b('Veículos novos e seminovos', 'compradores de carro', 'procedência, garantia e negociação justa', 'premium', 'confiante', 'contato', 'carros em estúdio, pátio, detalhes', 'cinematic', 'medium', 'dynamic', 'premium', 'Ver estoque', 'Avaliar meu usado', ['cinematic', 'showcase', 'video'], 'Chakra Petch', 'Inter'),
  clinica: b('Saúde e bem-estar', 'pacientes e famílias', 'cuidado humano com estrutura completa', 'clean', 'acolhedor', 'agendamento', 'luz clara, equipe, consultórios, pessoas', 'minimal', 'medium', 'calm', 'premium', 'Agendar consulta', 'Ver especialidades', ['split', 'conversion', 'cinematic'], 'Plus Jakarta Sans', 'Inter'),
  medico: b('Consultório médico', 'pacientes', 'atendimento com tempo e escuta', 'clean', 'acolhedor', 'agendamento', 'retrato profissional, consultório, luz suave', 'minimal', 'low', 'calm', 'premium', 'Agendar consulta', 'Sobre o atendimento', ['split', 'editorial', 'conversion'], 'Plus Jakarta Sans', 'Inter'),
  advogado: b('Advocacia', 'pessoas e empresas com decisões importantes', 'estratégia e clareza jurídica', 'editorial', 'formal', 'contato', 'escritório, retrato, arquitetura, papel', 'editorial', 'medium', 'calm', 'premium', 'Agendar consulta', 'Áreas de atuação', ['editorial', 'split', 'cinematic'], 'Playfair Display', 'Source Serif 4'),
  imobiliaria: b('Mercado imobiliário', 'compradores, vendedores e locatários', 'conhecimento local e negócio seguro', 'minimal', 'confiante', 'contato', 'fachadas, interiores, bairros, luz', 'elegant', 'medium', 'dynamic', 'premium', 'Ver imóveis', 'Anunciar imóvel', ['showcase', 'cinematic', 'split'], 'Manrope', 'Inter'),
  construcao: b('Construção civil', 'quem vai construir ou reformar', 'obra planejada, prazo cumprido', 'technical', 'confiante', 'orcamento', 'canteiro, estrutura, obra entregue', 'technical', 'medium', 'dynamic', 'standard', 'Solicitar orçamento', 'Ver obras', ['cinematic', 'split', 'showcase'], 'Oswald', 'Barlow'),
  academia: b('Fitness', 'quem quer treinar com resultado', 'treino com acompanhamento e constância', 'bold', 'direto', 'agendamento', 'treino, movimento, contraste, suor', 'performance', 'low', 'dynamic', 'standard', 'Agendar aula grátis', 'Ver planos', ['video', 'cinematic', 'showcase'], 'Syne', 'Archivo'),
  estetica: b('Estética e beleza', 'quem cuida de si', 'resultado natural com técnica', 'premium', 'acolhedor', 'agendamento', 'pele, luz suave, texturas, detalhes', 'elegant', 'low', 'calm', 'premium', 'Agendar avaliação', 'Ver tratamentos', ['cinematic', 'editorial', 'split'], 'Cormorant Garamond', 'Inter'),
  barbearia: b('Barbearia', 'homens que valorizam estilo', 'tradição, navalha e atitude', 'bold', 'direto', 'agendamento', 'cadeira, navalha, retratos, preto e branco', 'performance', 'low', 'dynamic', 'standard', 'Agendar horário', 'Ver serviços', ['cinematic', 'split', 'showcase'], 'Syne', 'Archivo'),
  loja: b('Varejo', 'clientes da região', 'variedade, preço justo e atendimento', 'warm', 'acolhedor', 'compra', 'produtos, vitrine, pessoas comprando', 'playful', 'medium', 'dense', 'standard', 'Pedir pelo WhatsApp', 'Ver produtos', ['showcase', 'split', 'conversion'], 'Nunito', 'Nunito'),
  ecommerce: b('Loja online', 'compradores em todo o Brasil', 'compra segura e entrega rápida', 'minimal', 'direto', 'compra', 'produtos em fundo limpo, lifestyle', 'minimal', 'medium', 'dense', 'standard', 'Ver catálogo', 'Mais vendidos', ['showcase', 'split', 'cinematic'], 'Sora', 'Inter'),
  servicos: b('Serviços', 'residências e empresas', 'serviço bem feito, no prazo', 'warm', 'direto', 'orcamento', 'equipe em ação, resultado do serviço', 'minimal', 'medium', 'dynamic', 'standard', 'Pedir orçamento', 'Ver serviços', ['split', 'conversion', 'cinematic'], 'Nunito', 'Nunito'),
  b2b: b('Soluções para empresas', 'gestores e decisores', 'resultado mensurável', 'minimal', 'formal', 'contato', 'escritórios, pessoas trabalhando, gráficos sóbrios', 'minimal', 'medium', 'calm', 'premium', 'Agendar reunião', 'Ver soluções', ['editorial', 'split', 'showcase'], 'Manrope', 'Inter'),
  industria: b('Indústria', 'compradores técnicos', 'capacidade e qualidade certificada', 'technical', 'tecnico', 'orcamento', 'fábrica, máquinas, produtos em série', 'technical', 'medium', 'dynamic', 'standard', 'Solicitar cotação', 'Ver produtos', ['cinematic', 'split', 'showcase'], 'Oswald', 'Barlow'),
};

function b(industry: string, audience: string, positioning: string, visualPersonality: VisualPersonality, tone: BusinessDNA['tone'], conversionGoal: BusinessDNA['conversionGoal'], imageryStyle: string, motionPersonality: MotionPersonality, contentDensity: BusinessDNA['contentDensity'], pageRhythm: BusinessDNA['pageRhythm'], premiumLevel: BusinessDNA['premiumLevel'], primaryCTA: string, secondaryCTA: string, heroPreference: BusinessDNA['heroPreference'], display: string, body: string): Base {
  return { industry, audience, positioning, visualPersonality, tone, conversionGoal, imageryStyle, motionPersonality, contentDensity, pageRhythm, premiumLevel, primaryCTA, secondaryCTA, heroPreference, recommendedTypography: { display, body } };
}

/** Sub-indústrias detectadas por palavras-chave (nome, serviços, observações, pesquisa). */
const SUB_INDUSTRIES: { id: string; label: string; re: RegExp; apply: Partial<Base> & { signals: string } }[] = [
  { id: 'estetica-automotiva', label: 'Estética automotiva', re: /est[ée]tica automotiva|detailing|polimento|vitrifica|lavagem|higieniza[çc][ãa]o (de )?(bancos|interna)|insulfilm|pel[íi]cula/i, apply: { industry: 'Estética automotiva', positioning: 'cuidado automotivo completo, do detalhe ao brilho', visualPersonality: 'premium', tone: 'confiante', conversionGoal: 'agendamento', imageryStyle: 'alto contraste, reflexos, brilho, close-up de pintura e interiores', motionPersonality: 'performance', contentDensity: 'low', pageRhythm: 'dynamic', premiumLevel: 'premium', primaryCTA: 'Agendar serviço', secondaryCTA: 'Solicitar orçamento', heroPreference: ['video', 'cinematic', 'showcase'], recommendedTypography: { display: 'Chakra Petch', body: 'Inter' }, signals: 'serviços de estética automotiva detectados → direção automotiva premium' } },
  { id: 'luxo', label: 'Alto padrão', re: /\b(luxo|luxury|alto padr[ãa]o|premium|exclusiv|boutique|gourmet)\b/i, apply: { premiumLevel: 'luxury', motionPersonality: 'elegant', contentDensity: 'low', signals: 'termos de alto padrão → nível luxury, motion elegante' } },
  { id: 'emergencia', label: 'Atendimento 24h', re: /\b24 ?h|24 horas|emerg[êe]ncia|urg[êe]ncia|plant[ãa]o\b/i, apply: { conversionGoal: 'contato', primaryCTA: 'Chamar agora', signals: 'atendimento 24h/emergência → CTA imediato' } },
  { id: 'popular', label: 'Preço acessível', re: /\b(popular|econ[ôo]mic|barat|promo[çc][ãa]o|menor pre[çc]o|parcel)\b/i, apply: { premiumLevel: 'standard', visualPersonality: 'warm', contentDensity: 'high', pageRhythm: 'dense', signals: 'foco em preço acessível → densidade maior, tom direto' } },
  { id: 'familiar', label: 'Negócio familiar', re: /\b(fam[íi]lia|familiar|tradi[çc][ãa]o|desde 19\d\d|desde 20[01]\d)\b/i, apply: { tone: 'acolhedor', signals: 'tradição/família → tom acolhedor' } },
  { id: 'tecnico', label: 'Técnico', re: /\b(certifica|norma|laudo|engenharia|t[ée]cnic|precis[ãa]o|calibra)\b/i, apply: { visualPersonality: 'technical', motionPersonality: 'technical', signals: 'vocabulário técnico → estética técnica (grid, números)' } },
];

export function deriveBusinessDNA(input: DnaInput): BusinessDNA {
  const seg: SegmentId = isSegmentId(input.segment) ? input.segment : 'servicos';
  const base = { ...BASE[seg], heroPreference: [...BASE[seg].heroPreference], recommendedTypography: { ...BASE[seg].recommendedTypography } };
  const signals: string[] = [`segmento ${segmentLabel(seg)} → ${base.visualPersonality}/${base.motionPersonality}`];
  const research = input.research;
  const text = [input.name, input.notes, ...(input.services ?? []).map((s) => s.title + ' ' + (s.description ?? '')), ...(input.differentials ?? []), ...(research?.facts.services ?? []), ...(research?.facts.positioning ?? []), ...(research?.facts.differentials ?? [])].join(' \n ');

  let subIndustry = segmentLabel(seg);
  for (const si of SUB_INDUSTRIES) {
    if (!si.re.test(text)) continue;
    if (si.id === 'estetica-automotiva' && !['oficina', 'loja-automotiva', 'servicos', 'concessionaria', 'estetica'].includes(seg)) continue;
    const { signals: sig, ...apply } = si.apply;
    Object.assign(base, apply);
    if (apply.heroPreference) base.heroPreference = [...apply.heroPreference];
    if (si.id === 'estetica-automotiva') subIndustry = si.label;
    signals.push(sig);
  }

  // serviços: cadastrados > pesquisa > vazio
  const svcTitles = uniq([...(input.services ?? []).map((s) => s.title.trim()), ...(research?.facts.services ?? [])].filter(Boolean));
  const priorityServices = rankServices(svcTitles, text).slice(0, 5);
  if (svcTitles.length) signals.push(`${svcTitles.length} serviços conhecidos → ${priorityServices.length} em destaque`);

  // assets
  const assets = input.assets ?? [];
  const images = assets.filter((a) => a.kind !== 'video');
  const videos = assets.filter((a) => a.kind === 'video');
  const strong = images.filter((a) => ((a.analysis as ImageAnalysis | undefined)?.heroScore ?? 0) >= 60).length;
  const q = images.length === 0 ? 'none' : strong >= 3 ? 'high' : strong >= 1 || images.length >= 4 ? 'medium' : 'low';
  const assetProfile = { logo: !!input.logo, photos: images.length, strongPhotos: strong, videos: videos.length, quality: q as BusinessDNA['assetProfile']['quality'] };
  if (videos.length) {
    base.heroPreference = ['video', ...base.heroPreference.filter((h) => h !== 'video')];
    signals.push(`${videos.length} vídeo(s) enviado(s) → hero em vídeo preferido`);
    const long = videos.find((v) => ((v.analysis as VideoAnalysis | undefined)?.duration ?? 0) > 45);
    if (long) signals.push('vídeo longo: será cortado/otimizado para o hero');
  } else if (strong >= 1) signals.push('fotos fortes → hero cinematográfico com foto real');
  else if (images.length === 0) {
    base.heroPreference = base.heroPreference.filter((h) => h !== 'video' && h !== 'cinematic').concat(['editorial', 'split']);
    signals.push('sem fotos → hero tipográfico/editorial em vez de imagem de fundo');
  }
  if (images.length >= 6) signals.push('muitas fotos → galeria forte e seções visuais');
  if (images.length >= 6 && base.contentDensity === 'medium') base.contentDensity = 'low';

  // cores da marca: informadas > logo > pesquisa
  const logoAnalysis = input.logo?.analysis as ImageAnalysis | undefined;
  let brandColors = input.brandColors?.length ? [...input.brandColors] : logoAnalysis?.dominantColors?.slice(0, 4) ?? research?.facts.colors?.slice(0, 3) ?? [];
  brandColors = uniq(brandColors.map((c) => c.toLowerCase()));
  const brandMode: BusinessDNA['brandMode'] = brandColors.length ? (avgLum(brandColors) < 0.3 ? 'dark' : avgLum(brandColors) > 0.6 ? 'light' : 'unknown') : 'unknown';
  if (brandColors.length) signals.push(`identidade ${brandMode === 'dark' ? 'escura' : brandMode === 'light' ? 'clara' : 'mista'} (${brandColors.slice(0, 2).join(', ')}) ${input.brandColors?.length ? 'informada' : 'extraída do logo/site'}`);

  // auditoria: site atual fraco em conversão → reforça CTA; forte em visual → manter premium
  if (input.audit) {
    if (input.audit.opportunities.some((o) => /WhatsApp|CTA|chamada/i.test(o))) signals.push('auditoria: conversão fraca no site atual → CTA e WhatsApp em destaque');
    if (input.audit.overall < 50) signals.push(`auditoria: nota ${input.audit.overall}/100 → redesign completo justificado`);
  }

  const dna: BusinessDNA = {
    industry: base.industry,
    subIndustry,
    audience: base.audience,
    positioning: research?.facts.positioning?.[0] && research.facts.positioning[0].length < 90 ? research.facts.positioning[0] : base.positioning,
    visualPersonality: base.visualPersonality,
    tone: base.tone,
    conversionGoal: base.conversionGoal,
    keyServices: svcTitles.slice(0, 12),
    priorityServices,
    assetProfile,
    brandColors,
    brandMode,
    recommendedTypography: base.recommendedTypography,
    imageryStyle: base.imageryStyle,
    motionPersonality: base.motionPersonality,
    contentDensity: base.contentDensity,
    pageRhythm: base.pageRhythm,
    premiumLevel: base.premiumLevel,
    primaryCTA: base.primaryCTA,
    secondaryCTA: base.secondaryCTA,
    heroPreference: uniq(base.heroPreference),
    signals,
    researchSummary: research ? { found: uniq(research.sources.flatMap((s) => s.found)), sources: research.sources.map((s) => ({ type: s.type, url: s.url, ok: s.ok })) } : undefined,
  };
  return dna;
}

function avgLum(colors: string[]): number {
  const l = colors.map((c) => {
    const m = c.replace('#', '');
    if (m.length !== 6) return 0.5;
    return (0.2126 * parseInt(m.slice(0, 2), 16) + 0.7152 * parseInt(m.slice(2, 4), 16) + 0.0722 * parseInt(m.slice(4, 6), 16)) / 255;
  });
  return l.reduce((a, b) => a + b, 0) / Math.max(1, l.length);
}

/** Serviços "mais vendáveis" primeiro: os que aparecem mais vezes no texto e os de maior ticket. */
function rankServices(services: string[], text: string): string[] {
  const t = text.toLowerCase();
  const high = /(polimento|vitrifica|insulfilm|pel[íi]cula|projeto|reforma|constru|implante|cirurg|tratamento|estrutura|port[ãa]o|casamento|evento|lan[çc]amento|financiamento|consultoria)/i;
  return [...services].sort((a, b) => score(b) - score(a));
  function score(s: string) {
    const occurrences = t.split(s.toLowerCase()).length - 1;
    return occurrences * 2 + (high.test(s) ? 3 : 0) + (s.length < 40 ? 1 : 0);
  }
}

/** Texto curto para o painel */
export function describeDNA(d: BusinessDNA): string {
  return `${d.subIndustry} · ${d.positioning}. Personalidade ${d.visualPersonality}, motion ${d.motionPersonality}, objetivo: ${d.conversionGoal}. ${d.assetProfile.videos ? `${d.assetProfile.videos} vídeo(s), ` : ''}${d.assetProfile.photos} foto(s)${d.brandColors.length ? `, cores ${d.brandColors.slice(0, 2).join(' / ')}` : ''}.`;
}
