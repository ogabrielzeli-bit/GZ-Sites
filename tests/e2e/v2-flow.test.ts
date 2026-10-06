/**
 * E2E V2: servidor real + fixture Mizuno (teste) → upload de logo/fotos/vídeo → direções → prévia composta
 * com hero em vídeo → Playwright confirma autoplay silencioso → regenerar/locks → publicar (mock) → mensagem.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import type { AddressInfo } from 'node:net';
import sharp from 'sharp';
import { chromium } from 'playwright';
import { MIZUNO } from '../fixtures/mizuno';

process.env.GZ_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gz-e2e-v2-'));
process.env.AUDIT_LIGHTHOUSE = 'false';
process.env.PUBLISH_PROVIDER = 'mock';

let base = '';
let close: () => void = () => {};
const fxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gz-fx-'));
let hasFfmpeg = false;

const api = async <T>(method: string, url: string, body?: unknown): Promise<T> => {
  const isForm = body instanceof FormData;
  const res = await fetch(base + '/api' + url, {
    method,
    headers: body && !isForm ? { 'Content-Type': 'application/json' } : {},
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  if (!res.ok)
    throw new Error(
      `${method} ${url} → ${res.status}: ${typeof json === 'string' ? json.slice(0, 200) : json.error}`,
    );
  return json as T;
};
const upload = (id: string, category: string, files: string[]) => {
  const fd = new FormData();
  fd.append('category', category);
  for (const f of files) fd.append('files', new Blob([fs.readFileSync(f)]), path.basename(f));
  return api<{ files: any[]; prospect: any }>('POST', `/prospects/${id}/uploads`, fd);
};
const waitJobs = async (url: string, max = 60000) => {
  const t = Date.now();
  while (Date.now() - t < max) {
    const d = await api<any>('GET', url);
    if (!d.activeJobs?.length) return d;
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error('timeout esperando jobs');
};

beforeAll(async () => {
  // fixtures: logo (fundo escuro + círculo dourado), fotos sólidas e vídeo curto (webm: Chromium headless reproduz sem codec proprietário)
  await sharp({
    create: { width: 400, height: 400, channels: 4, background: { r: 10, g: 10, b: 12, alpha: 1 } },
  })
    .composite([
      {
        input: Buffer.from(
          '<svg width="400" height="400"><circle cx="200" cy="200" r="120" fill="#d4a017"/></svg>',
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toFile(path.join(fxDir, 'logo.png'));
  for (const [n, c] of [
    ['dark', { r: 20, g: 20, b: 24 }],
    ['gold', { r: 200, g: 160, b: 40 }],
    ['red', { r: 180, g: 30, b: 30 }],
    ['light', { r: 230, g: 232, b: 236 }],
  ] as const)
    await sharp({ create: { width: 1600, height: 1000, channels: 3, background: c } })
      .jpeg()
      .toFile(path.join(fxDir, `${n}.jpg`));
  try {
    execFileSync('ffmpeg', [
      '-loglevel',
      'error',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc2=size=640x360:rate=24',
      '-t',
      '2',
      '-c:v',
      'libvpx-vp9',
      '-b:v',
      '300k',
      path.join(fxDir, 'clip.webm'),
    ]);
    hasFfmpeg = fs.existsSync(path.join(fxDir, 'clip.webm'));
  } catch {
    hasFfmpeg = false;
  }
  const { createContext } = await import('../../src/server/context');
  const { createApp } = await import('../../src/server/app');
  const { ensureRuntime } = await import('../../src/engine');
  await ensureRuntime();
  const ctx = createContext();
  const app = createApp(ctx);
  await new Promise<void>((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      close = () => {
        server.close();
        ctx.db.close();
      };
      resolve();
    });
  });
}, 120000);
afterAll(() => close());

describe('V2 — fluxo criativo completo (fixture Mizuno, só teste)', () => {
  let id = '';
  let previewId = '';
  let previewUrl = '';
  let directionId = '';

  it('cria prospect com serviços e 2 unidades; sobe logo (cores extraídas), fotos e vídeo com poster', async () => {
    const p = await api<any>('POST', '/prospects', MIZUNO);
    id = p.id;
    expect(p.locations).toHaveLength(2);
    expect(p.services[0].title).toBe('Polimento técnico');
    const logo = await upload(id, 'logo', [path.join(fxDir, 'logo.png')]);
    expect(logo.prospect.logoPath).toMatch(/\/files\/uploads\//);
    expect(logo.prospect.brandColors.length).toBeGreaterThan(0);
    const photos = await upload(
      id,
      'photo',
      ['dark', 'gold', 'red', 'light'].map((n) => path.join(fxDir, `${n}.jpg`)),
    );
    expect(photos.files).toHaveLength(4);
    expect(photos.files[0].kind).toBe('image');
    expect(photos.files[0].analysis?.heroScore).toBeTypeOf('number');
    if (hasFfmpeg) {
      const v = await upload(id, 'video', [path.join(fxDir, 'clip.webm')]);
      expect(v.files[0].kind).toBe('video');
      expect(v.files[0].analysis.duration).toBeGreaterThan(1);
      expect(v.files[0].poster).toMatch(/-poster\.webp$/);
      expect(v.files[0].role).toBe('auto');
    }
    const after = await waitJobs(`/prospects/${id}`);
    expect(after.photos.length).toBe(hasFfmpeg ? 5 : 4);
  });

  it('papel do asset pode ser alterado (ex.: foto → não usar)', async () => {
    const p = await api<any>('GET', `/prospects/${id}`);
    const photo = p.photos.find((a: any) => a.kind === 'image');
    const r = await api<any>('PATCH', `/prospects/${id}/uploads`, { path: photo.path, role: 'none' });
    expect(r.photos.find((a: any) => a.path === photo.path).role).toBe('none');
    await api('PATCH', `/prospects/${id}/uploads`, { path: photo.path, role: 'auto' });
  });

  it('propõe 3 direções a partir do DNA (sem fontes públicas → sem pesquisa, sem erro)', async () => {
    const d = await api<any>('POST', `/prospects/${id}/directions`, {});
    expect(d.research).toBeNull();
    expect(d.dna.subIndustry).toBe('Estética automotiva');
    expect(d.directions).toHaveLength(3);
    expect(d.directions[0].id).toBe('performance-luxury');
    directionId = d.directions[0].id;
    const p = await api<any>('GET', `/prospects/${id}`);
    expect(p.creative.dna.subIndustry).toBe('Estética automotiva');
  });

  it('gera prévia composta com a direção; site tem hero em vídeo, unidades e é servido publicamente', async () => {
    const pv = await api<any>('POST', `/prospects/${id}/previews`, { directionId });
    previewId = pv.id;
    previewUrl = pv.url;
    expect(pv.meta.direction.id).toBe(directionId);
    expect(pv.meta.creativeScore).toBeGreaterThanOrEqual(70);
    const types = pv.config.pages[0].sections.map((s: any) => s.type);
    expect(types).toContain('locations');
    expect(types[1]).toBe(hasFfmpeg ? 'hero-video' : 'hero-fullscreen');
    const html = await (await fetch(base + previewUrl)).text();
    expect(html).toContain('data-motion="performance"');
    expect(html).toContain('id="unidades"');
    expect(html).toContain('Rua Barão de Jaguara');
    if (hasFfmpeg) {
      expect(html).toMatch(
        /<video class="hero__video" data-gz-video autoplay muted loop playsinline[^>]*poster="\.\/assets\/img\/[^"]+"/,
      );
      const src = html.match(/<source src="([^"]+)" type="video\/webm">/)![1];
      expect((await fetch(base + previewUrl + src.replace(/^\.\//, ''))).status).toBe(200);
    }
  });

  it('no navegador: vídeo toca silencioso e inline (autoplay), sem erros de JS, sem overflow horizontal', async () => {
    const browser = await chromium.launch();
    try {
      for (const width of [1440, 390]) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));
        await page.goto(base + previewUrl, { waitUntil: 'load' });
        await page.waitForTimeout(1200);
        const st = (await page.evaluate(
          `(() => { const v = document.querySelector('video[data-gz-video]'); return { video: v ? { paused: v.paused, muted: v.muted, inline: v.hasAttribute('playsinline'), ready: v.readyState, current: v.currentTime } : null, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth, motion: document.documentElement.dataset.motion, gz: !!window.GZ }; })()`,
        )) as any;
        expect(errors).toEqual([]);
        expect(st.overflow).toBe(false);
        expect(st.gz).toBe(true);
        expect(st.motion).toBe('performance');
        if (hasFfmpeg) {
          expect(st.video).not.toBeNull();
          expect(st.video.muted).toBe(true);
          expect(st.video.inline).toBe(true);
          expect(st.video.paused).toBe(false);
          expect(st.video.ready).toBeGreaterThan(0);
        }
        await page.close();
      }
    } finally {
      await browser.close();
    }
  }, 90000);

  it('locks + regenerar: mantém o título bloqueado e muda a composição (seed+1)', async () => {
    const pv = await api<any>('GET', `/previews/${previewId}`);
    const hi = pv.config.pages[0].sections.findIndex((s: any) => s.type.startsWith('hero'));
    const key = `pages.0.sections.${hi}.props.headline`;
    const locked = await api<any>('PUT', `/previews/${previewId}/locks`, { locks: [key] });
    expect(locked.meta.locks).toEqual([key]);
    const next = await api<any>('POST', `/previews/${previewId}/regenerate`, {});
    expect(next.meta.seed).toBe(pv.meta.seed + 1);
    expect(next.meta.fingerprint).not.toBe(pv.meta.fingerprint);
    expect(next.config.pages[0].sections[hi].props.headline).toBe(
      pv.config.pages[0].sections[hi].props.headline,
    );
    const qa = await api<any>('GET', `/previews/${next.id}/creative-qa`);
    expect(qa.score).toBeGreaterThan(0);
    expect(qa.checks.find((c: any) => c.id === 'distinct').status).not.toBe('fail');
  });

  it('publica a prévia (provider mock) em slug estável e o link público responde', async () => {
    const st = await api<any>('GET', '/publish/status');
    expect(st.configured).toBe(true);
    const pub = await api<any>('POST', `/previews/${previewId}/publish`);
    expect(pub.published.slug).toBe('mizuno-estetica-automotiva-preview');
    const res = await fetch(base + pub.published.url);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('Mizuno');
    const again = await api<any>('POST', `/previews/${previewId}/publish`);
    expect(again.published.slug).toBe(pub.published.slug);
  });

  it('mensagem adaptativa cita só fatos reais: link publicado, vídeo e unidades', async () => {
    const m = await api<any>('POST', `/prospects/${id}/messages/adaptive`, {
      kind: 'enviar-previa',
      previewId,
    });
    expect(m.text).toContain('/published/mizuno-estetica-automotiva-preview/');
    expect(m.text).toMatch(/Rafael/);
    expect(m.text).toMatch(/2 unidades/);
    if (hasFfmpeg) expect(m.text).toMatch(/vídeo/);
    const first = await api<any>('POST', `/prospects/${id}/messages/adaptive`, {
      kind: 'primeira-abordagem',
    });
    expect(first.text).not.toMatch(/auditoria|nota/i);
  });

  it('fluxo V1 continua funcionando (prévia clássica por tema) e lista do prospect mostra ambas', async () => {
    const v1 = await api<any>('POST', `/prospects/${id}/previews`, { theme: 'medical-clean' });
    expect(v1.theme).toBe('medical-clean');
    expect(v1.meta.direction).toBeUndefined();
    const p = await api<any>('GET', `/prospects/${id}`);
    expect(p.previews.length).toBe(3);
  });
});
