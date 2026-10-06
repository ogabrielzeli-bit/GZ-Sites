/**
 * Brand / Asset Analyzer — analisa imagens (sharp) e vídeos (ffmpeg/ffprobe quando disponíveis).
 * Sem IA: cores dominantes, luminância, contraste, orientação, qualidade e scores para hero/galeria.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import type { ImageAnalysis, VideoAnalysis } from '@shared/v2';
import { env } from '../env';

const exec = promisify(execFile);

// ---------------- Imagens ----------------
function hex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}
export function luminanceOf(hexColor: string): number {
  const m = hexColor.replace('#', '');
  if (m.length !== 6) return 0.5;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminanceOf(a), luminanceOf(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
function saturationOf(hexColor: string): number {
  const m = hexColor.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

/** Quantiza pixels (grade 24x24) em até 6 cores dominantes, ignorando transparência. */
async function dominantColors(buffer: Buffer, ignoreNeutral: boolean): Promise<string[]> {
  const { data, info } = await sharp(buffer).resize(24, 24, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>();
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (a < 128) continue;
    const key = `${r >> 5}_${g >> 5}_${b >> 5}`;
    const bk = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bk.n++;
    bk.r += r;
    bk.g += g;
    bk.b += b;
    buckets.set(key, bk);
  }
  const list = Array.from(buckets.values())
    .sort((a, b) => b.n - a.n)
    .map((bk) => hex(bk.r / bk.n, bk.g / bk.n, bk.b / bk.n));
  const filtered = ignoreNeutral ? list.filter((c) => { const l = luminanceOf(c); return !(l > 0.92 || (l < 0.04 && saturationOf(c) < 0.2)); }) : list;
  return (filtered.length ? filtered : list).slice(0, 6);
}

export async function analyzeImage(buffer: Buffer, opts: { isLogo?: boolean } = {}): Promise<ImageAnalysis> {
  const img = sharp(buffer);
  const meta = await img.metadata();
  const stats = await img.stats();
  const width = meta.width ?? 0, height = meta.height ?? 0;
  const aspect = height ? width / height : 1;
  const gray = await sharp(buffer).greyscale().resize(64, 64, { fit: 'inside' }).raw().toBuffer();
  let sum = 0;
  for (const v of gray) sum += v;
  const mean = sum / gray.length / 255;
  let varSum = 0;
  for (const v of gray) varSum += (v / 255 - mean) ** 2;
  const contrast = Math.min(1, Math.sqrt(varSum / gray.length) * 3);
  const dominant = await dominantColors(buffer, !!opts.isLogo);
  const pixels = width * height;
  const quality: ImageAnalysis['quality'] = pixels >= 1600 * 1000 ? 'high' : pixels >= 800 * 600 ? 'medium' : 'low';
  const orientation: ImageAnalysis['orientation'] = aspect > 1.15 ? 'landscape' : aspect < 0.87 ? 'portrait' : 'square';
  const heroScore = Math.round(
    Math.min(100, (orientation === 'landscape' ? 45 : orientation === 'square' ? 25 : 10) + (quality === 'high' ? 35 : quality === 'medium' ? 20 : 5) + contrast * 20),
  );
  const galleryScore = Math.round(Math.min(100, (quality === 'high' ? 50 : quality === 'medium' ? 35 : 15) + contrast * 25 + (orientation !== 'landscape' ? 10 : 20)));
  return {
    width,
    height,
    aspect: Number(aspect.toFixed(3)),
    orientation,
    dominantColors: dominant,
    luminance: Number(mean.toFixed(3)),
    contrast: Number(contrast.toFixed(3)),
    hasAlpha: !!meta.hasAlpha && (stats.channels[3]?.min ?? 255) < 250,
    quality,
    heroScore,
    galleryScore,
  };
}

/** Paleta de marca a partir do logo: cor de destaque (saturada), fundo (escuro/claro) e texto com contraste. */
export function brandPaletteFromLogo(a: ImageAnalysis): { colors: string[]; mode: 'dark' | 'light' | 'unknown' } {
  const colors = a.dominantColors;
  if (!colors.length) return { colors: [], mode: 'unknown' };
  const saturated = colors.filter((c) => saturationOf(c) > 0.25).sort((x, y) => saturationOf(y) - saturationOf(x));
  const darks = colors.filter((c) => luminanceOf(c) < 0.15);
  const lights = colors.filter((c) => luminanceOf(c) > 0.7);
  const mode: 'dark' | 'light' | 'unknown' = darks.length && a.luminance < 0.45 ? 'dark' : lights.length || a.luminance > 0.6 ? 'light' : 'unknown';
  const out: string[] = [];
  if (saturated[0]) out.push(saturated[0]);
  if (darks[0]) out.push(darks[0]);
  for (const c of colors) if (!out.includes(c) && out.length < 4) out.push(c);
  return { colors: out, mode };
}

// ---------------- Vídeo ----------------
let ffCache: { ffmpeg: string | null; ffprobe: string | null } | null = null;
async function canRun(bin: string): Promise<boolean> {
  try {
    await exec(bin, ['-version'], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
/** Procura ffmpeg/ffprobe: FFMPEG_PATH → PATH. (O ffmpeg do Playwright só lê/escreve WebM, insuficiente.) */
export async function findFfmpeg(): Promise<{ ffmpeg: string | null; ffprobe: string | null }> {
  if (ffCache) return ffCache;
  const candidates = [process.env.FFMPEG_PATH, 'ffmpeg'].filter(Boolean) as string[];
  let ffmpeg: string | null = null;
  for (const c of candidates) if (await canRun(c)) { ffmpeg = c; break; }
  const probeCandidates = [process.env.FFPROBE_PATH, ffmpeg ? ffmpeg.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1') : null, 'ffprobe'].filter(Boolean) as string[];
  let ffprobe: string | null = null;
  for (const c of probeCandidates) if (await canRun(c)) { ffprobe = c; break; }
  ffCache = { ffmpeg, ffprobe };
  return ffCache;
}

export const VIDEO_SIZE_WARN_BYTES = 12 * 1024 * 1024;

export async function probeVideo(file: string): Promise<Omit<VideoAnalysis, 'bytes'> | null> {
  const { ffprobe, ffmpeg } = await findFfmpeg();
  try {
    if (ffprobe) {
      const { stdout } = await exec(ffprobe, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file], { timeout: 20000 });
      const j = JSON.parse(stdout);
      const v = (j.streams ?? []).find((s: any) => s.codec_type === 'video');
      if (!v) return null;
      const duration = Number(j.format?.duration ?? v.duration ?? 0);
      const width = Number(v.width ?? 0), height = Number(v.height ?? 0);
      return { duration: Number(duration.toFixed(2)), width, height, aspect: height ? Number((width / height).toFixed(3)) : 1.78, codec: v.codec_name };
    }
    if (ffmpeg) {
      const r = await exec(ffmpeg, ['-hide_banner', '-i', file], { timeout: 20000 }).catch((e) => e as { stderr: string });
      const txt = String((r as any).stderr ?? '');
      const d = txt.match(/Duration: (\d+):(\d+):([\d.]+)/);
      const s = txt.match(/Video: (\w+).*?(\d{2,5})x(\d{2,5})/);
      if (!s) return null;
      const duration = d ? Number(d[1]) * 3600 + Number(d[2]) * 60 + Number(d[3]) : 0;
      const width = Number(s[2]), height = Number(s[3]);
      return { duration, width, height, aspect: height ? Number((width / height).toFixed(3)) : 1.78, codec: s[1] };
    }
  } catch {}
  return null;
}

/** Gera poster (WebP) do vídeo em t = 1s (ou 10% da duração). */
export async function videoPoster(file: string, outWebp: string, duration = 0): Promise<boolean> {
  const { ffmpeg } = await findFfmpeg();
  if (!ffmpeg) return false;
  const t = Math.max(0.5, Math.min(duration * 0.1, 3));
  const tmpPng = outWebp.replace(/\.webp$/, '.png');
  try {
    await exec(ffmpeg, ['-y', '-ss', String(t), '-i', file, '-frames:v', '1', '-vf', 'scale=1600:-2', tmpPng], { timeout: 30000 });
    await sharp(tmpPng).webp({ quality: 80 }).toFile(outWebp);
    fs.unlinkSync(tmpPng);
    return true;
  } catch {
    return false;
  }
}

/** Versão otimizada para web (H.264 720p, sem áudio) — hero em loop. MOV/AVI viram MP4 reproduzível. */
export async function optimizeVideo(file: string, outMp4: string, maxHeight = 720): Promise<boolean> {
  const { ffmpeg } = await findFfmpeg();
  if (!ffmpeg) return false;
  try {
    await exec(ffmpeg, ['-y', '-i', file, '-an', '-vf', `scale=-2:'min(${maxHeight},ih)'`, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-movflags', '+faststart', '-pix_fmt', 'yuv420p', '-t', '45', outMp4], { timeout: 180000, maxBuffer: 1024 * 1024 * 8 });
    return fs.existsSync(outMp4) && fs.statSync(outMp4).size > 0;
  } catch {
    return false;
  }
}

export function publicPathOf(abs: string): string {
  return '/files/uploads/' + path.relative(env.uploadsDir, abs).split(path.sep).join('/');
}
