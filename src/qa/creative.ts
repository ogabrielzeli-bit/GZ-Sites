/**
 * Creative QA — avalia a qualidade criativa de uma composição (0–100) sem IA.
 * Olha para: assets reais, hero coerente com o DNA, variedade de seções, contraste da paleta,
 * CTA e contato, unidades quando há várias, e similaridade com outras prévias do mesmo cliente.
 */
import type { SiteConfig } from '@shared/site-config';
import type { PreviewMeta } from '@shared/v2';
import { getTheme } from '../engine/themes';
import { contrastRatio } from '../engine/color';
import { similarity } from '../engine/compose';

export interface CreativeCheck {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  points: number;
  max: number;
  detail?: string;
}
export interface CreativeReport {
  score: number;
  checks: CreativeCheck[];
  warnings: string[];
}

const LOREM = /lorem ipsum|dolor sit amet/i;

/** Alegações específicas que só podem aparecer se vierem dos dados do cliente. */
const CLAIM_PATTERNS: { id: string; re: RegExp }[] = [
  { id: 'garantia', re: /\bgarantia\b/i },
  {
    id: 'anos de experiência',
    re: /\banos de (experi[êe]ncia|mercado|hist[óo]ria|estrada)|\b\d{1,2}\+?\s*anos\b|desde (19|20)\d\d/i,
  },
  { id: 'certificação', re: /certifica[çc][ãa]o|certificad[oa]s?\b|credenciad[oa]s?\b/i },
  {
    id: 'equipe especializada',
    re: /equipe (especializada|qualificada|treinada|experiente)|profissionais (experientes|qualificados|certificados|especializados)|(mec[âa]nicos|t[ée]cnicos) (experientes|especializados)/i,
  },
  {
    id: 'equipamentos modernos',
    re: /equipamentos? (modernos?|de ponta|de [úu]ltima gera[çc][ãa]o|novos?)|tecnologia de ponta/i,
  },
  {
    id: 'peças de qualidade',
    re: /pe[çc]as (originais|de qualidade|genu[íi]nas)|produtos (premium|de qualidade|importados)/i,
  },
  {
    id: 'números',
    re: /\+?\d[\d.]*\s*(mil\s+)?(clientes|carros|ve[íi]culos|projetos|atendimentos|obras|entregas|avalia[çc][õo]es)\b/i,
  },
  { id: 'avaliações', re: /avalia[çc][õo]es|\b5 estrelas|\bnota (4|5)[.,]\d|⭐/i },
  { id: 'diagnóstico/mecânica (para estética)', re: /diagn[óo]stico|mec[âa]nic[ao]s?\b|revis[ãa]o/i },
];

/**
 * Procura, em toda a copy do site, alegações específicas que não estão nos dados fornecidos.
 * `allowedText` = tudo que o cliente informou (serviços, diferenciais, observações, pesquisa verificada).
 * Retorna os ids das alegações encontradas sem respaldo.
 */
export function unverifiedClaims(
  config: SiteConfig,
  allowedText = '',
  opts: { segment?: string; subIndustry?: string } = {},
): string[] {
  const copyText = [
    config.brand.tagline,
    config.business.description,
    config.seo.description,
    JSON.stringify(config.pages),
    JSON.stringify(config.business.differentials),
  ].join('\n');
  const out: string[] = [];
  for (const c of CLAIM_PATTERNS) {
    // "diagnóstico/mecânica" só é alegação indevida quando o negócio é estética automotiva
    if (c.id.startsWith('diagnóstico') && !/est[ée]tica automotiva|detailing/i.test(opts.subIndustry ?? ''))
      continue;
    if (c.re.test(copyText) && !c.re.test(allowedText)) out.push(c.id);
  }
  return out;
}

export function creativeQa(
  config: SiteConfig,
  meta: PreviewMeta = {},
  siblings: { id: string; fingerprint?: string }[] = [],
  /** texto com os fatos fornecidos pelo cliente (para validar alegações da copy) */
  allowedText = '',
): CreativeReport {
  const checks: CreativeCheck[] = [];
  const warnings: string[] = [];
  const sections = config.pages[0]?.sections.filter((s) => s.enabled) ?? [];
  const types = sections.map((s) => s.type);
  const hero = sections.find((s) => s.type.startsWith('hero'));
  const add = (id: string, label: string, ok: boolean | 'warn', max: number, detail?: string) => {
    const status = ok === true ? 'pass' : ok === 'warn' ? 'warning' : 'fail';
    checks.push({
      id,
      label,
      status,
      points: status === 'pass' ? max : status === 'warning' ? Math.round(max / 2) : 0,
      max,
      detail,
    });
    if (status !== 'pass' && detail) warnings.push(detail);
  };

  // 1. Assets reais
  const photos = config.assets.images.length;
  const videos = config.assets.videos.length;
  add(
    'assets',
    'Usa fotos/vídeos reais do cliente',
    photos + videos >= 4 ? true : photos + videos > 0 ? 'warn' : false,
    20,
    photos + videos
      ? `${photos} foto(s), ${videos} vídeo(s)`
      : 'Sem fotos ou vídeos do cliente: o site usa placeholders.',
  );

  // 2. Hero coerente com o DNA
  const pref: string[] = meta.dna?.heroPreference ?? [];
  const heroFamily = hero?.type === 'hero' ? 'split' : (hero?.type.replace('hero-', '') ?? '');
  const heroOk =
    !pref.length ||
    pref.includes(heroFamily) ||
    (heroFamily === 'fullscreen' && pref.includes('cinematic')) ||
    (heroFamily === 'split' && pref.includes('conversion'));
  add(
    'hero',
    'Hero alinhado com o DNA do negócio',
    hero ? (heroOk ? true : 'warn') : false,
    15,
    hero
      ? heroOk
        ? undefined
        : `Hero "${heroFamily}" não está entre as preferências do DNA (${pref.join(', ')}).`
      : 'Sem hero.',
  );
  const headline = String((hero?.props as any)?.headline ?? '');
  add(
    'headline',
    'Headline cita serviços reais',
    /\*/.test(headline) && headline.length > 20 ? true : headline ? 'warn' : false,
    10,
    headline ? undefined : 'Headline vazia.',
  );

  // 3. Variedade/ritmo de seções
  const distinct = new Set(types).size;
  add(
    'variety',
    'Variedade de seções',
    distinct >= 7 ? true : distinct >= 5 ? 'warn' : false,
    10,
    `${distinct} tipos de seção.`,
  );
  const dup = types.filter((t, i) => types.indexOf(t) !== i && !['cta', 'marquee'].includes(t));
  if (dup.length) warnings.push(`Seções repetidas: ${[...new Set(dup)].join(', ')}.`);

  // 4. Contraste da paleta
  const theme = getTheme(config.theme.id);
  const colors = { ...theme.colors, ...(config.theme.overrides.colors ?? {}) } as Record<string, string>;
  const textBg = contrastRatio(colors.text ?? '#000', colors.bg ?? '#fff');
  const accentBg = contrastRatio(colors.accent ?? '#000', colors.bg ?? '#fff');
  add(
    'contrast',
    'Contraste texto/fundo ≥ 4.5',
    textBg >= 4.5 ? true : textBg >= 3 ? 'warn' : false,
    10,
    `texto ${textBg.toFixed(1)}:1, destaque ${accentBg.toFixed(1)}:1`,
  );
  if (accentBg < 3)
    warnings.push(`Cor de destaque com pouco contraste sobre o fundo (${accentBg.toFixed(1)}:1).`);

  // 5. Conversão: CTA + contato + WhatsApp
  const hasCta = types.includes('cta');
  const hasContact = types.includes('contact') || types.includes('locations');
  const hasWa = !!config.contact.whatsapp;
  add(
    'conversion',
    'CTA final, contato e WhatsApp',
    hasCta && hasContact && hasWa ? true : hasCta || hasContact ? 'warn' : false,
    15,
    [!hasCta && 'sem CTA final', !hasContact && 'sem seção de contato', !hasWa && 'sem WhatsApp']
      .filter(Boolean)
      .join(', ') || undefined,
  );

  // 6. Unidades
  const locs = config.business.locations.length;
  add(
    'locations',
    'Unidades no site quando há mais de uma',
    locs > 1 ? types.includes('locations') : true,
    5,
    locs > 1 && !types.includes('locations')
      ? 'Cliente tem várias unidades mas o site não as lista.'
      : undefined,
  );

  // 7. Texto real (sem lorem)
  const text = JSON.stringify(config.pages);
  add(
    'copy',
    'Sem texto de preenchimento',
    !LOREM.test(text),
    5,
    LOREM.test(text) ? 'Encontrado "Lorem ipsum".' : undefined,
  );

  // 7b. Só fatos: nenhuma alegação específica sem respaldo nos dados do cliente (só avaliado no fluxo V2)
  if (meta.dna) {
    const claims = unverifiedClaims(config, allowedText, { subIndustry: meta.dna.subIndustry });
    add(
      'facts',
      'Copy sem alegações não fornecidas',
      claims.length === 0 ? true : claims.length <= 1 ? 'warn' : false,
      15,
      claims.length ? `alegações sem respaldo: ${claims.join(', ')}` : undefined,
    );
  }

  // 8. Similaridade com outras prévias do cliente
  let maxSim = 0;
  for (const s of siblings)
    if (s.fingerprint && meta.fingerprint)
      maxSim = Math.max(maxSim, similarity(meta.fingerprint, s.fingerprint));
  add(
    'distinct',
    'Diferente das outras prévias do cliente',
    maxSim < 0.6 ? true : maxSim < 0.85 ? 'warn' : false,
    10,
    maxSim ? `similaridade máxima ${(maxSim * 100).toFixed(0)}%` : 'primeira prévia',
  );
  if (maxSim >= 0.85)
    warnings.push(
      'Esta composição é quase igual a outra prévia deste cliente. Troque a direção ou regenere.',
    );

  const score = Math.round(
    (checks.reduce((a, c) => a + c.points, 0) / checks.reduce((a, c) => a + c.max, 0)) * 100,
  );
  return { score, checks, warnings };
}
