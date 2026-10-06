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

export function creativeQa(
  config: SiteConfig,
  meta: PreviewMeta = {},
  siblings: { id: string; fingerprint?: string }[] = [],
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
    distinct >= 8 ? true : distinct >= 5 ? 'warn' : false,
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
