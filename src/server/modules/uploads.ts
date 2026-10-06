/**
 * Uploads de assets (logo, fotos, ícones, vídeo): validação de tipo/tamanho, organização por cliente,
 * compressão e geração de WebP + tamanhos responsivos com sharp.
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { env } from '../env';
import { slugify } from '@shared/utils';
import { HttpError } from '../http';

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
const VIDEO_TYPES = new Set(['video/mp4', 'video/webm']);

export interface StoredAsset {
  /** caminho público (servido em /files/uploads/...) */
  path: string;
  name: string;
  kind: 'image' | 'video' | 'svg';
  width?: number;
  height?: number;
  bytes: number;
  variants?: { width: number; path: string }[];
}

function publicPath(abs: string): string {
  return '/files/uploads/' + path.relative(env.uploadsDir, abs).split(path.sep).join('/');
}

export async function storeAsset(opts: {
  clientSlug: string;
  buffer: Buffer;
  originalName: string;
  mimetype: string;
  category: 'logo' | 'photo' | 'icon' | 'video';
}): Promise<StoredAsset> {
  const { buffer, mimetype } = opts;
  const isVideo = VIDEO_TYPES.has(mimetype);
  const isSvg = mimetype === 'image/svg+xml';
  if (!IMAGE_TYPES.has(mimetype) && !isVideo)
    throw new HttpError(400, `Tipo de arquivo não permitido: ${mimetype}`);
  if (isVideo && buffer.length > MAX_VIDEO_BYTES) throw new HttpError(413, 'Vídeo acima de 80 MB');
  if (!isVideo && buffer.length > MAX_IMAGE_BYTES) throw new HttpError(413, 'Imagem acima de 15 MB');
  const client = slugify(opts.clientSlug || 'geral');
  const dir = path.join(
    env.uploadsDir,
    client,
    opts.category === 'photo'
      ? 'fotos'
      : opts.category === 'logo'
        ? 'logo'
        : opts.category === 'icon'
          ? 'icones'
          : 'video',
  );
  fs.mkdirSync(dir, { recursive: true });
  const base = `${slugify(path.parse(opts.originalName).name) || 'arquivo'}-${randomUUID().slice(0, 8)}`;

  if (isVideo) {
    const ext = mimetype === 'video/webm' ? '.webm' : '.mp4';
    const abs = path.join(dir, base + ext);
    fs.writeFileSync(abs, buffer);
    return { path: publicPath(abs), name: opts.originalName, kind: 'video', bytes: buffer.length };
  }
  if (isSvg) {
    // sanitiza SVG: remove scripts e handlers inline
    const text = buffer
      .toString('utf8')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/\son[a-z]+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
    const abs = path.join(dir, base + '.svg');
    fs.writeFileSync(abs, text);
    return { path: publicPath(abs), name: opts.originalName, kind: 'svg', bytes: Buffer.byteLength(text) };
  }
  const img = sharp(buffer, { animated: mimetype === 'image/gif' }).rotate();
  const meta = await img.metadata();
  const maxW = opts.category === 'logo' ? 1200 : 2400;
  const abs = path.join(dir, base + '.webp');
  const main = await sharp(buffer)
    .rotate()
    .resize({ width: maxW, withoutEnlargement: true })
    .webp({ quality: opts.category === 'logo' ? 92 : 82 })
    .toFile(abs);
  const variants: StoredAsset['variants'] = [];
  if (opts.category === 'photo') {
    for (const w of [480, 960, 1600]) {
      if ((meta.width ?? 0) <= w) continue;
      const vAbs = path.join(dir, `${base}-${w}.webp`);
      await sharp(buffer).rotate().resize({ width: w }).webp({ quality: 78 }).toFile(vAbs);
      variants.push({ width: w, path: publicPath(vAbs) });
    }
  }
  return {
    path: publicPath(abs),
    name: opts.originalName,
    kind: 'image',
    width: main.width,
    height: main.height,
    bytes: main.size,
    variants,
  };
}

export function deleteAsset(publicPathStr: string) {
  const m = publicPathStr.match(/^\/files\/uploads\/(.+)$/);
  if (!m) return;
  const abs = path.resolve(env.uploadsDir, m[1]);
  if (!abs.startsWith(path.resolve(env.uploadsDir) + path.sep)) return;
  const dir = path.dirname(abs);
  const base = path.basename(abs, '.webp');
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
  for (const w of [480, 960, 1600]) {
    const v = path.join(dir, `${base}-${w}.webp`);
    if (fs.existsSync(v)) fs.unlinkSync(v);
  }
}
