/**
 * Uploads de assets (logo, fotos, ícones, vídeo): validação de tipo/tamanho, organização por cliente,
 * compressão e geração de WebP + tamanhos responsivos (sharp), análise de imagem e vídeo (poster, metadados).
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { env } from '../env';
import { slugify } from '@shared/utils';
import { HttpError } from '../http';
import type { ProspectAsset } from '@shared/v2';
import { analyzeImage, probeVideo, publicPathOf, videoPoster, VIDEO_SIZE_WARN_BYTES } from './assets';

export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;
const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/svg+xml',
]);
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v']);

export type StoredAsset = ProspectAsset & { needsOptimization?: boolean; absPath?: string };

export async function storeAsset(opts: {
  clientSlug: string;
  buffer: Buffer;
  originalName: string;
  mimetype: string;
  category: 'logo' | 'photo' | 'icon' | 'video';
}): Promise<StoredAsset> {
  const { buffer } = opts;
  let mimetype = opts.mimetype;
  const ext = path.extname(opts.originalName).toLowerCase();
  if (mimetype === 'application/octet-stream' || !mimetype) {
    // alguns clientes (e drag-and-drop de alguns SOs) não informam o tipo: inferimos pela extensão
    const byExt: Record<string, string> = {
      '.mov': 'video/quicktime',
      '.mp4': 'video/mp4',
      '.m4v': 'video/x-m4v',
      '.webm': 'video/webm',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
    };
    mimetype = byExt[ext] ?? mimetype;
  }
  const isVideo = VIDEO_TYPES.has(mimetype) || opts.category === 'video';
  const isSvg = mimetype === 'image/svg+xml';
  if (!IMAGE_TYPES.has(mimetype) && !isVideo)
    throw new HttpError(400, `Tipo de arquivo não permitido: ${mimetype}`);
  if (isVideo && buffer.length > MAX_VIDEO_BYTES) throw new HttpError(413, 'Vídeo acima de 80 MB');
  if (!isVideo && buffer.length > MAX_IMAGE_BYTES) throw new HttpError(413, 'Imagem acima de 15 MB');
  const client = slugify(opts.clientSlug || 'geral');
  const sub = isVideo
    ? 'video'
    : opts.category === 'logo'
      ? 'logo'
      : opts.category === 'icon'
        ? 'icones'
        : 'fotos';
  const dir = path.join(env.uploadsDir, client, sub);
  fs.mkdirSync(dir, { recursive: true });
  const base = `${slugify(path.parse(opts.originalName).name) || 'arquivo'}-${randomUUID().slice(0, 8)}`;

  if (isVideo) {
    const vext = mimetype === 'video/webm' ? '.webm' : mimetype === 'video/quicktime' ? '.mov' : '.mp4';
    const abs = path.join(dir, base + vext);
    fs.writeFileSync(abs, buffer);
    const probe = await probeVideo(abs);
    const posterAbs = path.join(dir, base + '-poster.webp');
    const hasPoster = await videoPoster(abs, posterAbs, probe?.duration ?? 0);
    const analysis = probe
      ? {
          ...probe,
          bytes: buffer.length,
          sizeWarning:
            buffer.length > VIDEO_SIZE_WARN_BYTES
              ? `Vídeo com ${(buffer.length / 1024 / 1024).toFixed(0)} MB: será otimizado para 720p antes de ir ao site.`
              : undefined,
        }
      : {
          duration: 0,
          width: 0,
          height: 0,
          aspect: 1.78,
          bytes: buffer.length,
          sizeWarning:
            'ffmpeg não encontrado: sem metadados/poster. Instale ffmpeg para análise e otimização.',
        };
    return {
      path: publicPathOf(abs),
      absPath: abs,
      name: opts.originalName,
      kind: 'video',
      role: 'auto',
      width: probe?.width,
      height: probe?.height,
      bytes: buffer.length,
      poster: hasPoster ? publicPathOf(posterAbs) : undefined,
      thumb: hasPoster ? publicPathOf(posterAbs) : undefined,
      analysis,
      // MOV e vídeos pesados precisam virar MP4 web-friendly
      needsOptimization:
        vext === '.mov' || buffer.length > VIDEO_SIZE_WARN_BYTES || (probe?.height ?? 0) > 1080,
    };
  }
  if (isSvg) {
    const text = buffer
      .toString('utf8')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/\son[a-z]+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
    const abs = path.join(dir, base + '.svg');
    fs.writeFileSync(abs, text);
    let analysis;
    try {
      analysis = await analyzeImage(await sharp(Buffer.from(text)).png().toBuffer(), {
        isLogo: opts.category === 'logo',
      });
    } catch {}
    return {
      path: publicPathOf(abs),
      name: opts.originalName,
      kind: 'image',
      role: 'auto',
      bytes: Buffer.byteLength(text),
      analysis,
    };
  }
  const meta = await sharp(buffer, { animated: mimetype === 'image/gif' })
    .rotate()
    .metadata();
  const maxW = opts.category === 'logo' ? 1200 : 2400;
  const abs = path.join(dir, base + '.webp');
  const main = await sharp(buffer)
    .rotate()
    .resize({ width: maxW, withoutEnlargement: true })
    .webp({ quality: opts.category === 'logo' ? 92 : 82 })
    .toFile(abs);
  const variants: ProspectAsset['variants'] = [];
  if (opts.category === 'photo') {
    for (const w of [480, 960, 1600]) {
      if ((meta.width ?? 0) <= w) continue;
      const vAbs = path.join(dir, `${base}-${w}.webp`);
      await sharp(buffer).rotate().resize({ width: w }).webp({ quality: 78 }).toFile(vAbs);
      variants.push({ width: w, path: publicPathOf(vAbs) });
    }
  }
  let analysis;
  try {
    analysis = await analyzeImage(buffer, { isLogo: opts.category === 'logo' });
  } catch {}
  return {
    path: publicPathOf(abs),
    name: opts.originalName,
    kind: 'image',
    role: 'auto',
    width: main.width,
    height: main.height,
    bytes: main.size,
    variants,
    analysis,
  };
}

export function deleteAsset(publicPathStr: string) {
  const m = publicPathStr.match(/^\/files\/uploads\/(.+)$/);
  if (!m) return;
  const abs = path.resolve(env.uploadsDir, m[1]);
  if (!abs.startsWith(path.resolve(env.uploadsDir) + path.sep)) return;
  const dir = path.dirname(abs);
  const base = path.basename(abs).replace(/\.(webp|mp4|mov|webm|svg)$/, '');
  for (const f of fs.existsSync(dir) ? fs.readdirSync(dir) : [])
    if (f.startsWith(base)) fs.rmSync(path.join(dir, f), { force: true });
}

/** Resolve caminho público de upload para absoluto (sem path traversal). */
export function uploadAbsPath(publicPathStr: string): string | null {
  const m = publicPathStr.match(/^\/files\/uploads\/(.+)$/);
  if (!m) return null;
  const abs = path.resolve(env.uploadsDir, m[1]);
  return abs.startsWith(path.resolve(env.uploadsDir) + path.sep) ? abs : null;
}
