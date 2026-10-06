/**
 * Publicação de prévias com link público.
 * Providers: netlify (token só via backend/.env) e mock (copia para data/published/<slug>, servido em /published/).
 * Nunca lê chaves do frontend; se não houver provider configurado, retorna erro amigável.
 */
import fs from 'node:fs';
import path from 'node:path';
import AdmZip from 'adm-zip';
import type { Preview, Prospect } from '@shared/schemas';
import type { PublishedPreview } from '@shared/v2';
import { slugify } from '@shared/utils';
import { env } from '../env';
import type { Repos } from '../db/repos';

export interface PublishProvider {
  id: string;
  /** publica (ou atualiza, se `existing`) o diretório e devolve a URL pública */
  publish(dir: string, slug: string, existing?: PublishedPreview | null): Promise<PublishedPreview>;
}

export const publishedDir = () => path.join(env.dataDir, 'published');

/** Provider local: copia os arquivos para data/published/<slug>/ (servido pelo próprio GZ OS). Útil em testes e intranet. */
export const mockProvider = (baseUrl = ''): PublishProvider => ({
  id: 'mock',
  async publish(dir, slug) {
    const out = path.join(publishedDir(), slug);
    fs.rmSync(out, { recursive: true, force: true });
    fs.mkdirSync(out, { recursive: true });
    fs.cpSync(dir, out, { recursive: true });
    return {
      provider: 'mock',
      url: `${baseUrl}/published/${slug}/`,
      slug,
      publishedAt: new Date().toISOString(),
    };
  },
});

export const netlifyProvider = (token: string): PublishProvider => ({
  id: 'netlify',
  async publish(dir, slug, existing) {
    const zip = new AdmZip();
    zip.addLocalFolder(dir);
    const headers = { Authorization: `Bearer ${token}` };
    let siteId = existing?.provider === 'netlify' ? existing.siteId : undefined;
    if (!siteId) {
      const res = await fetch('https://api.netlify.com/api/v1/sites', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: slug }),
      });
      if (!res.ok)
        throw new Error(
          `Netlify: não foi possível criar o site (${res.status}): ${(await res.text()).slice(0, 200)}`,
        );
      siteId = ((await res.json()) as { id: string }).id;
    }
    const res = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/zip' },
      body: zip.toBuffer(),
    });
    if (!res.ok)
      throw new Error(`Netlify: falha no deploy (${res.status}): ${(await res.text()).slice(0, 200)}`);
    const d = (await res.json()) as { id: string; ssl_url?: string; url?: string; deploy_ssl_url?: string };
    return {
      provider: 'netlify',
      url: d.ssl_url || d.url || d.deploy_ssl_url || '',
      siteId,
      deployId: d.id,
      slug,
      publishedAt: new Date().toISOString(),
    };
  },
});

export function publishStatus(): { configured: boolean; provider: string; message: string } {
  const forced = process.env.PUBLISH_PROVIDER;
  if (forced === 'mock')
    return {
      configured: true,
      provider: 'mock',
      message: 'Publicação local (mock) ativa: links em /published/<slug>/.',
    };
  if (env.netlifyToken)
    return { configured: true, provider: 'netlify', message: 'Netlify configurado via NETLIFY_AUTH_TOKEN.' };
  return {
    configured: false,
    provider: 'none',
    message:
      'Publicação não configurada. Defina NETLIFY_AUTH_TOKEN no backend/.env (ou PUBLISH_PROVIDER=mock para links locais).',
  };
}

export function resolveProvider(override?: PublishProvider): PublishProvider | null {
  if (override) return override;
  if (process.env.PUBLISH_PROVIDER === 'mock') return mockProvider();
  if (env.netlifyToken) return netlifyProvider(env.netlifyToken);
  return null;
}

export function previewSlug(p: Prospect, preview: Preview): string {
  // reaproveita o slug já publicado desta prévia; senão <cliente>-preview (único por cliente, atualizável)
  return preview.published?.slug || `${slugify(p.name).slice(0, 40)}-preview`;
}

/** Publica a prévia (cria ou atualiza no mesmo slug) e grava o resultado. Sem segredo configurado, falha com mensagem clara. */
export async function publishPreview(
  repos: Repos,
  previewId: string,
  provider?: PublishProvider,
): Promise<Preview> {
  const preview = repos.previews.get(previewId);
  if (!preview) throw new Error('Prévia não encontrada');
  const p = repos.prospects.get(preview.prospectId);
  if (!p) throw new Error('Prospect não encontrado');
  const prov = resolveProvider(provider);
  if (!prov) throw new Error(publishStatus().message);
  if (!fs.existsSync(path.join(preview.path, 'index.html')))
    throw new Error('Arquivos da prévia não encontrados. Gere a prévia novamente.');
  // atualiza o mesmo site se este cliente já tem uma prévia publicada neste provider
  const previous =
    preview.published ??
    repos.previews.listByProspect(p.id).find((x) => x.published?.provider === prov.id)?.published ??
    null;
  const slug = previous?.slug ?? previewSlug(p, preview);
  const result = await prov.publish(preview.path, slug, previous);
  repos.previews.setPublished(previewId, result);
  repos.activities.log(p.id, 'preview.published', `Prévia publicada: ${result.url}`, {
    previewId,
    provider: result.provider,
    url: result.url,
  });
  return repos.previews.get(previewId)!;
}
