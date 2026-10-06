/**
 * Fluxo criativo V2: pesquisa pública (opcional) → BusinessDNA → direções → prévia composta.
 * Tudo determinístico e sem IA. A pesquisa só extrai o que está publicado; nunca inventa.
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { Prospect, Settings } from '@shared/schemas';
import type { SiteConfig } from '@shared/site-config';
import type { BusinessDNA, CreativeDirection, CreativityLevel, ProspectAsset, Research } from '@shared/v2';
import { renderSite, writeRenderedSite } from '../../engine';
import { deriveBusinessDNA, describeDNA } from '../../engine/dna';
import { pickDirection, proposeDirections } from '../../engine/creative';
import { applyLocks, composeSite } from '../../engine/compose';
import { creativeQa } from '../../qa/creative';
import { env } from '../env';
import type { Repos } from '../db/repos';
import { researchProspect, summarizeResearch } from './research';
import { resolveUploadPath } from './previews';

export function hasPublicSources(p: Prospect): boolean {
  return !!(p.website || p.instagram || p.links.some((l) => /^https?:\/\//.test(l.url)));
}

/** Monta o DNA a partir do estado atual do prospect (ficha + assets + pesquisa + auditoria). */
export function dnaFor(repos: Repos, p: Prospect): BusinessDNA {
  const audit = repos.audits.latestForProspect(p.id);
  const logo: ProspectAsset | null = p.logoPath
    ? { path: p.logoPath, name: 'logo', kind: 'image', role: 'auto', analysis: (p as any).logoAnalysis }
    : null;
  return deriveBusinessDNA({
    name: p.name,
    segment: p.segment,
    city: p.city,
    state: p.state,
    notes: p.notes,
    services: p.services,
    differentials: p.differentials,
    brandColors: p.brandColors,
    logo,
    assets: p.photos,
    research: p.research,
    audit:
      audit?.status === 'done' && audit.scores
        ? { overall: audit.scores.overall, opportunities: audit.opportunities.map((o) => o.title) }
        : null,
  });
}

export interface DirectionsResult {
  research: Research | null;
  researchSummary: ReturnType<typeof summarizeResearch> | null;
  dna: BusinessDNA;
  dnaSummary: string;
  directions: CreativeDirection[];
  creativity: CreativityLevel;
}

/**
 * Pesquisa (se houver fontes e ainda não pesquisado, ou se `refresh`), deriva o DNA e propõe 3 direções.
 * Persiste `research` e `creative.dna` no prospect.
 */
export async function prepareDirections(
  repos: Repos,
  p: Prospect,
  opts: { refresh?: boolean; research?: boolean; onProgress?: (m: string) => void } = {},
): Promise<DirectionsResult> {
  const settings = repos.settings.get();
  let research = p.research;
  const wantResearch = opts.research !== false && hasPublicSources(p) && (!research || opts.refresh);
  if (wantResearch) {
    opts.onProgress?.('Pesquisando fontes públicas…');
    try {
      research = await researchProspect(p, { timeoutMs: Math.min(20000, settings.audit.timeoutMs || 20000) });
    } catch (e) {
      research = {
        researchedAt: new Date().toISOString(),
        sources: [
          { type: 'website', url: p.website || '', ok: false, error: (e as Error).message, found: [] },
        ],
        facts: {
          services: [],
          positioning: [],
          language: [],
          locations: [],
          hours: [],
          differentials: [],
          contentTypes: [],
          colors: [],
          socials: [],
          phones: [],
        },
      };
    }
    repos.prospects.update(p.id, { research });
    const okCount = research.sources.filter((s) => s.ok).length;
    repos.activities.log(
      p.id,
      'research.done',
      `Pesquisa pública: ${okCount}/${research.sources.length} fonte(s) lidas`,
      { found: research.sources.flatMap((s) => s.found) },
    );
    p = repos.prospects.get(p.id)!;
  }
  const dna = dnaFor(repos, p);
  const creativity = settings.creativity ?? 'equilibrado';
  const directions = proposeDirections(dna, creativity, 3);
  repos.prospects.update(p.id, { creative: { ...(p.creative ?? {}), dna } });
  return {
    research,
    researchSummary: research ? summarizeResearch(research) : null,
    dna,
    dnaSummary: describeDNA(dna),
    directions,
    creativity,
  };
}

export interface ComposeOptions {
  directionId?: string; // id ou 'auto'
  seed?: number;
  locks?: string[];
  /** prévia anterior (para locks e memória criativa) */
  fromPreviewId?: string;
  notes?: string;
}

function baseInput(p: Prospect, settings: Settings) {
  return {
    name: p.name,
    segment: p.segment,
    city: p.city,
    state: p.state,
    country: p.country,
    whatsapp: p.whatsapp,
    phone: p.phone,
    email: p.email,
    instagram: p.instagram,
    website: p.website,
    address: p.locations[0]?.address,
    logo: p.logoPath ? { src: p.logoPath, alt: p.name } : null,
    services: p.services,
    differentials: p.differentials,
    credits: { name: settings.agencyName, url: settings.website || undefined },
    previewMode: true,
  };
}

/** Cria uma prévia composta pelo motor adaptativo (direção + DNA + assets). */
export function createComposedPreview(repos: Repos, p: Prospect, opts: ComposeOptions = {}) {
  const settings = repos.settings.get();
  const creativity = settings.creativity ?? 'equilibrado';
  const dna = p.creative?.dna ?? dnaFor(repos, p);
  const direction = pickDirection(
    dna,
    opts.directionId === 'auto' ? undefined : opts.directionId,
    creativity,
  );
  const siblings = repos.previews.listByProspect(p.id);
  const seed = opts.seed ?? siblings.length;
  const prev = opts.fromPreviewId ? repos.previews.get(opts.fromPreviewId) : undefined;
  const locks = opts.locks ?? prev?.meta.locks ?? [];

  const composed = composeSite({
    ...baseInput(p, settings),
    dna,
    direction,
    assets: p.photos,
    locations: p.locations,
    seed,
    creativity,
  });
  let config = composed.config;
  if (prev && locks.length) config = applyLocks(config, prev.config as SiteConfig, locks);

  const id = randomUUID();
  const dir = path.join(env.previewsDir, id);
  const site = renderSite(config, { localFile: resolveUploadPath });
  writeRenderedSite(site, dir);
  const meta = {
    directionId: direction.id,
    direction,
    dna,
    seed,
    locks,
    fingerprint: composed.fingerprint,
    assetsUsed: composed.assetsUsed,
    creativeScore: 0,
  };
  meta.creativeScore = creativeQa(
    site.config,
    meta,
    siblings.map((s) => ({ id: s.id, fingerprint: s.meta.fingerprint })),
  ).score;
  const preview = repos.previews.create({
    id,
    prospectId: p.id,
    theme: direction.theme,
    segment: p.segment,
    layoutVariant: seed % 10,
    config: site.config,
    path: dir,
    notes: opts.notes ?? '',
    meta,
  });
  repos.prospects.update(p.id, { creative: { ...(p.creative ?? {}), dna, direction, lastPreviewId: id } });
  repos.activities.log(
    p.id,
    'preview.created',
    `Prévia gerada — direção "${direction.name}" (score criativo ${meta.creativeScore})`,
    { previewId: id, directionId: direction.id, seed },
  );
  if (['lead', 'contato', 'interessado'].includes(p.stage)) {
    repos.prospects.update(p.id, { stage: 'previa' });
    repos.activities.log(p.id, 'prospect.stage', 'Etapa alterada para Prévia');
  }
  return preview;
}

/** Regenera a composição (seed+1) mantendo direção e campos bloqueados; gera uma nova prévia. */
export function regeneratePreview(
  repos: Repos,
  previewId: string,
  opts: { locks?: string[]; directionId?: string } = {},
) {
  const prev = repos.previews.get(previewId);
  if (!prev) throw new Error('Prévia não encontrada');
  const p = repos.prospects.get(prev.prospectId);
  if (!p) throw new Error('Prospect não encontrado');
  return createComposedPreview(repos, p, {
    directionId: opts.directionId ?? prev.meta.directionId ?? 'auto',
    seed: (prev.meta.seed ?? 0) + 1,
    locks: opts.locks ?? prev.meta.locks ?? [],
    fromPreviewId: prev.id,
    notes: prev.notes,
  });
}

/** Atualiza só os locks de uma prévia (sem re-renderizar). */
export function setPreviewLocks(repos: Repos, previewId: string, locks: string[]) {
  const prev = repos.previews.get(previewId);
  if (!prev) throw new Error('Prévia não encontrada');
  repos.previews.updateConfig(previewId, prev.config, undefined, { ...prev.meta, locks });
  return repos.previews.get(previewId)!;
}

export function previewCreativeReport(repos: Repos, previewId: string) {
  const prev = repos.previews.get(previewId);
  if (!prev) throw new Error('Prévia não encontrada');
  const siblings = repos.previews.listByProspect(prev.prospectId).filter((s) => s.id !== prev.id);
  return creativeQa(
    prev.config as SiteConfig,
    prev.meta,
    siblings.map((s) => ({ id: s.id, fingerprint: s.meta.fingerprint })),
  );
}

export function previewDirExists(previewId: string) {
  return fs.existsSync(path.join(env.previewsDir, previewId, 'index.html'));
}
