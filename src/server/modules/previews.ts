/**
 * Gerador de prévias: prospect → site.config → site estático em data/previews/<id>/
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { ImageRef, SiteConfig } from '@shared/site-config';
import type { Prospect, Settings } from '@shared/schemas';
import { assetKindOf } from '@shared/v2';
import { generateSiteConfig, renderSite, writeRenderedSite, type GenerateInput } from '../../engine';
import { env } from '../env';
import type { Repos } from '../db/repos';

export function prospectImages(p: Prospect): { logo: ImageRef | null; photos: ImageRef[] } {
  const logo: ImageRef | null = p.logoPath ? { src: p.logoPath, alt: p.name } : null;
  // só imagens: um vídeo nunca pode virar <img> (o fluxo V2 usa o vídeo no hero)
  const photos: ImageRef[] = p.photos
    .filter((ph) => assetKindOf(ph) === 'image')
    .map((ph) => ({
      src: ph.path,
      alt: ph.name.replace(/\.[a-z0-9]+$/i, ''),
      width: ph.width,
      height: ph.height,
    }));
  return { logo, photos };
}

/** Converte um src "/files/uploads/..." em caminho absoluto dentro de data/uploads */
export function resolveUploadPath(src: string): string | null {
  const m = src.match(/^\/files\/uploads\/(.+)$/);
  if (!m) return null;
  const abs = path.resolve(env.uploadsDir, m[1]);
  if (!abs.startsWith(path.resolve(env.uploadsDir) + path.sep)) return null;
  return abs;
}

export function generateInputFromProspect(
  p: Prospect,
  settings: Settings,
  extra: Partial<GenerateInput> = {},
): GenerateInput {
  const { logo, photos } = prospectImages(p);
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
    logo,
    photos,
    credits: { name: settings.agencyName, url: settings.website || undefined },
    ...extra,
  };
}

export interface CreatePreviewOptions {
  theme?: string;
  layoutVariant?: number;
  config?: unknown;
  notes?: string;
}

export function createPreview(repos: Repos, prospect: Prospect, opts: CreatePreviewOptions = {}) {
  const settings = repos.settings.get();
  const id = randomUUID();
  const dir = path.join(env.previewsDir, id);
  let config: SiteConfig;
  let theme: string;
  const layoutVariant = opts.layoutVariant ?? repos.previews.listByProspect(prospect.id).length;
  if (opts.config) {
    const site = renderSite(
      { ...(opts.config as object), previewMode: true },
      { localFile: resolveUploadPath },
    );
    config = site.config;
    theme = config.theme.id;
    writeRenderedSite(site, dir);
  } else {
    const gen = generateSiteConfig(
      generateInputFromProspect(prospect, settings, {
        theme: opts.theme ?? undefined,
        layoutVariant,
        previewMode: true,
      }),
    );
    config = gen.config;
    theme = gen.theme;
    const site = renderSite(config, { localFile: resolveUploadPath });
    writeRenderedSite(site, dir);
  }
  const preview = repos.previews.create({
    id,
    prospectId: prospect.id,
    theme,
    segment: prospect.segment,
    layoutVariant,
    config,
    path: dir,
    notes: opts.notes ?? '',
  });
  repos.activities.log(prospect.id, 'preview.created', `Prévia gerada (tema ${theme})`, {
    previewId: id,
    theme,
    layoutVariant,
  });
  if (prospect.stage === 'lead' || prospect.stage === 'contato' || prospect.stage === 'interessado') {
    repos.prospects.update(prospect.id, { stage: 'previa' });
    repos.activities.log(prospect.id, 'prospect.stage', 'Etapa alterada para Prévia');
  }
  return preview;
}

/** Re-renderiza a prévia com uma config editada (mantém o id/URL) */
export function updatePreview(repos: Repos, previewId: string, config: unknown, notes?: string) {
  const preview = repos.previews.get(previewId);
  if (!preview) throw new Error('Prévia não encontrada');
  const site = renderSite({ ...(config as object), previewMode: true }, { localFile: resolveUploadPath });
  fs.rmSync(preview.path, { recursive: true, force: true });
  writeRenderedSite(site, preview.path);
  repos.previews.updateConfig(previewId, site.config, notes);
  return repos.previews.get(previewId)!;
}

/**
 * Garante que os arquivos da prévia existem em data/previews/<id>/ (re-renderiza da config salva se
 * sumiram: pasta data apagada, import de backup sem arquivos, render interrompido). Retorna a pasta ou null.
 */
export function ensurePreviewFiles(repos: Repos, previewId: string): string | null {
  const preview = repos.previews.get(previewId);
  if (!preview) return null;
  const dir = path.join(env.previewsDir, previewId);
  if (fs.existsSync(path.join(dir, 'index.html'))) return dir;
  const site = renderSite(
    { ...(preview.config as object), previewMode: true },
    { localFile: resolveUploadPath },
  );
  writeRenderedSite(site, dir);
  console.warn(`[previews] arquivos da prévia ${previewId} não existiam — re-renderizados em ${dir}`);
  return dir;
}

export function deletePreview(repos: Repos, previewId: string) {
  const preview = repos.previews.get(previewId);
  if (!preview) return;
  fs.rmSync(preview.path, { recursive: true, force: true });
  repos.previews.delete(previewId);
}
