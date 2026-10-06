/**
 * Regressões reportadas no Windows/Chrome:
 * 1) vídeo marcado como hero virava <img> (asset sem `kind`), 2) copy inventando fatos,
 * 3) sub-segmento "estética automotiva" tratado como oficina mecânica.
 */
import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

process.env.GZ_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gz-v2-video-'));

import { deriveBusinessDNA } from '../../src/engine/dna';
import { pickDirection } from '../../src/engine/creative';
import { composeSite, planAssets, videoSources } from '../../src/engine/compose';
import { renderSite } from '../../src/engine';
import { unverifiedClaims } from '../../src/qa/creative';
import { assetKindOf, normalizeAsset, type ProspectAsset } from '../../src/shared/v2';
import { prospectImages } from '../../src/server/modules/previews';
import { MIZUNO, MIZUNO_ASSETS } from '../fixtures/mizuno';
import type { SiteConfig } from '../../src/shared/site-config';

const html = (c: SiteConfig) =>
  renderSite(c)
    .files.find((f) => f.path === 'index.html')!
    .content.toString();
const hero = (c: SiteConfig) => c.pages[0].sections.find((s) => s.type.startsWith('hero'))!;
const baseFor = (assets: ProspectAsset[], over: Record<string, unknown> = {}) => {
  const dna = deriveBusinessDNA({ ...MIZUNO, assets });
  return {
    ...MIZUNO,
    dna,
    direction: pickDirection(dna, 'performance-luxury'),
    assets,
    previewMode: true,
    ...over,
  };
};

describe('vídeo no hero — tipo do asset sobrevive de ponta a ponta', () => {
  it('asset .mp4 marcado como hero SEM `kind` (upload antigo) gera <video>, nunca <img>', () => {
    // exatamente o cenário do bug: só path/name/role, nome com espaços
    const legacy = {
      path: '/files/uploads/mizuno/video/video-porsche-mizuno-ab12cd34.mp4',
      name: 'video porsche mizuno.mp4',
      role: 'hero',
    } as ProspectAsset;
    const photos = MIZUNO_ASSETS.filter((a) => a.kind === 'image');
    expect(assetKindOf(legacy)).toBe('video');
    expect(normalizeAsset(legacy).kind).toBe('video');
    const plan = planAssets([legacy, ...photos]);
    expect(plan.heroVideo?.path).toBe(legacy.path);
    expect(plan.heroImage?.src).not.toMatch(/\.mp4$/);
    expect(plan.photos.some((p) => /\.mp4$/.test(p.src))).toBe(false);
    const { config } = composeSite(baseFor([legacy, ...photos]));
    expect(hero(config).type).toBe('hero-video');
    expect(hero(config).props.videoSrc).toBe(legacy.path);
    const out = html(config);
    expect(out).toMatch(/<video class="hero__video" data-gz-video autoplay muted loop playsinline[^>]*>/);
    expect(out).toMatch(/<source src="[^"]+\.mp4" type="video\/mp4">/);
    expect(out).not.toMatch(/<img[^>]+src="[^"]*\.mp4"/);
    expect(out).not.toContain('video porsche mizuno.mp4');
  });
  it('MIME video/mp4 vence o nome; imagem continua <img>', () => {
    expect(assetKindOf({ path: '/files/uploads/x/fotos/a.webp', mime: 'video/mp4' })).toBe('video');
    expect(assetKindOf({ path: '/files/uploads/x/video/a.mp4', mime: 'image/webp' })).toBe('image');
    expect(assetKindOf({ path: '/files/uploads/x/fotos/foto.webp' })).toBe('image');
    const { config } = composeSite(baseFor(MIZUNO_ASSETS.filter((a) => a.kind === 'image')));
    expect(hero(config).type).not.toBe('hero-video');
    expect(html(config)).toMatch(/<img[^>]+\.webp/);
  });
  it('prefere WebM com fallback MP4 e usa o MP4 otimizado quando existe', () => {
    const webm: ProspectAsset = {
      path: '/files/uploads/x/video/clip.webm',
      name: 'clip.webm',
      kind: 'video',
      role: 'hero',
      analysis: {
        duration: 3,
        width: 1280,
        height: 720,
        aspect: 1.78,
        bytes: 1,
        optimized: '/files/uploads/x/video/clip-web.mp4',
      },
    };
    expect(videoSources(webm)).toMatchObject({
      src: '/files/uploads/x/video/clip-web.mp4',
      webm: '/files/uploads/x/video/clip.webm',
    });
    const mov: ProspectAsset = {
      path: '/files/uploads/x/video/clip.mov',
      name: 'clip.mov',
      kind: 'video',
      role: 'hero',
      analysis: {
        duration: 3,
        width: 3840,
        height: 2160,
        aspect: 1.78,
        bytes: 1,
        optimized: '/files/uploads/x/video/clip-web.mp4',
      },
    };
    expect(videoSources(mov).src).toBe('/files/uploads/x/video/clip-web.mp4');
    const { config } = composeSite(baseFor([webm]));
    const out = html(config);
    const webmIdx = out.indexOf('type="video/webm"');
    const mp4Idx = out.indexOf('type="video/mp4"');
    expect(webmIdx).toBeGreaterThan(-1);
    expect(mp4Idx).toBeGreaterThan(webmIdx);
    expect(config.assets.videos[0]).toMatchObject({
      src: '/files/uploads/x/video/clip-web.mp4',
      webm: '/files/uploads/x/video/clip.webm',
    });
  });
  it('fluxo V1 (prévia clássica) nunca usa vídeo como foto; renderer bloqueia vídeo em <img>', () => {
    const p = {
      logoPath: null,
      photos: [
        { path: '/files/uploads/x/video/a.mp4', name: 'a.mp4' },
        { path: '/files/uploads/x/fotos/b.webp', name: 'b.webp' },
      ],
    } as any;
    expect(prospectImages(p).photos.map((x) => x.src)).toEqual(['/files/uploads/x/fotos/b.webp']);
    const { config } = composeSite(baseFor(MIZUNO_ASSETS.filter((a) => a.kind === 'image')));
    const h = hero(config);
    h.props.image = { src: '/files/uploads/x/video/a.mp4', alt: 'a' };
    const site = renderSite(config);
    const out = site.files.find((f) => f.path === 'index.html')!.content.toString();
    expect(out).not.toMatch(/<img[^>]+\.mp4/);
    expect(site.warnings.join(' ')).toMatch(/Vídeo usado como imagem/);
  });
});

describe('copy só com fatos', () => {
  const dna = deriveBusinessDNA({ ...MIZUNO, assets: MIZUNO_ASSETS });
  const allowed = [
    MIZUNO.notes,
    ...MIZUNO.services.map((s) => s.title + ' ' + (s.description ?? '')),
    ...MIZUNO.differentials,
  ].join('\n');
  it('Mizuno: nada de garantia genérica, mecânicos, diagnóstico, anos, equipe, números ou depoimentos', () => {
    for (const dirId of [
      'performance-luxury',
      'editorial-automotive',
      'technical-motorsport',
      'minimal-luxury',
    ]) {
      const { config } = composeSite({
        ...MIZUNO,
        dna,
        direction: pickDirection(dna, dirId),
        assets: MIZUNO_ASSETS,
        previewMode: true,
      });
      const out = html(config);
      expect(out).not.toMatch(
        /mec[âa]nicos experientes|Garantia nos servi[çc]os|diagn[óo]stico|pe[çc]as de qualidade|equipamentos modernos|anos de experi[êe]ncia/i,
      );
      const types = config.pages[0].sections.map((s) => s.type);
      expect(types).not.toContain('testimonials');
      expect(types).not.toContain('numbers');
      expect(types).not.toContain('team');
      expect(types).not.toContain('comparison');
      // "garantia" só porque o cliente informou "Garantia de 12 meses"
      expect(unverifiedClaims(config, allowed, { subIndustry: dna.subIndustry })).toEqual([]);
      expect(unverifiedClaims(config, '', { subIndustry: dna.subIndustry })).toEqual(['garantia']);
      expect(out).toContain('Garantia de 12 meses');
      expect(out).toContain('Polimento técnico');
    }
  });
  it('sem diferenciais informados não há seção de diferenciais nem badges; serviços sem descrição inventada', () => {
    const { config } = composeSite({
      ...MIZUNO,
      differentials: [],
      dna,
      direction: pickDirection(dna, 'performance-luxury'),
      assets: MIZUNO_ASSETS,
      previewMode: true,
    });
    const types = config.pages[0].sections.map((s) => s.type);
    expect(types).not.toContain('benefits');
    expect(types).not.toContain('horizontal-scroll');
    expect(hero(config).props.badges).toEqual([]);
    const svc = config.business.services.find((s) => s.title === 'PPF')!;
    expect(svc.description).toBe('');
    expect(config.business.differentials).toEqual([]);
    expect(unverifiedClaims(config, MIZUNO.notes, { subIndustry: dna.subIndustry })).toEqual([]);
  });
  it('FAQ, sobre e marquee vêm dos dados reais (unidades, horário, serviços, cidade)', () => {
    const { config } = composeSite({
      ...MIZUNO,
      dna,
      direction: pickDirection(dna, 'minimal-luxury'),
      assets: MIZUNO_ASSETS,
      previewMode: true,
    });
    const out = html(config);
    expect(out).toContain('Rua Barão de Jaguara');
    expect(out).toMatch(/seg–sex 8h–18h/);
    expect(config.business.description).toMatch(
      /Mizuno Estética Automotiva é estética automotiva em Campinas\/SP/,
    );
    expect(config.business.description).toMatch(/Polimento técnico/);
    expect(config.brand.tagline).toBe(dna.positioning.replace(/\.$/, ''));
    const faq = config.pages[0].sections.find((s) => s.type === 'faq');
    if (faq) expect(JSON.stringify(faq.props)).toMatch(/agendar|Onde ficam/);
  });
  it('o fluxo V1 clássico continua com a copy completa da biblioteca', async () => {
    const { generateSiteConfig } = await import('../../src/engine/generate');
    const v1 = generateSiteConfig({ name: 'Oficina Teste', segment: 'oficina', city: 'Curitiba' });
    expect(v1.config.business.testimonials.length).toBeGreaterThan(0);
    expect(v1.config.business.stats.length).toBeGreaterThan(0);
  });
});

describe('sub-segmento: estética automotiva vs oficina mecânica', () => {
  it('oficina + lavagem/higienização/polimento/insulfilm → Estética automotiva', () => {
    const d = deriveBusinessDNA({
      name: 'Lava Car Prime',
      segment: 'oficina',
      services: [
        { title: 'Lavagem detalhada' },
        { title: 'Higienização de bancos' },
        { title: 'Polimento' },
        { title: 'Insulfilm' },
      ],
    });
    expect(d.subIndustry).toBe('Estética automotiva');
    expect(d.industry).toBe('Estética automotiva');
    expect(d.conversionGoal).toBe('agendamento');
  });
  it('oficina com serviços mecânicos continua Oficina', () => {
    const d = deriveBusinessDNA({
      name: 'Auto Center Silva',
      segment: 'oficina',
      services: [{ title: 'Troca de óleo' }, { title: 'Freios' }, { title: 'Suspensão' }],
    });
    expect(d.subIndustry).not.toBe('Estética automotiva');
  });
});
