import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

process.env.GZ_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gz-v2-test-'));

import { deriveBusinessDNA } from '../../src/engine/dna';
import { DIRECTIONS, pickDirection, proposeDirections, resolvePalette } from '../../src/engine/creative';
import { applyLocks, composeSite, planAssets, similarity } from '../../src/engine/compose';
import { renderSite } from '../../src/engine';
import { creativeQa } from '../../src/qa/creative';
import { composeMessage } from '../../src/server/modules/messages/adaptive';
import { mockProvider, publishPreview, publishStatus } from '../../src/server/modules/publish';
import { Database } from '../../src/server/db/database';
import { createRepos } from '../../src/server/db/repos';
import { createComposedPreview, regeneratePreview, setPreviewLocks } from '../../src/server/modules/creative';
import { exportJson, importJson } from '../../src/server/modules/backup';
import { env } from '../../src/server/env';
import { MIZUNO, MIZUNO_ASSETS } from '../fixtures/mizuno';
import type { SiteConfig } from '../../src/shared/site-config';

const dnaInput = (over: Record<string, unknown> = {}) => ({
  ...MIZUNO,
  services: [...MIZUNO.services],
  differentials: [...MIZUNO.differentials],
  assets: MIZUNO_ASSETS,
  ...over,
});
const sectionTypes = (c: SiteConfig) => c.pages[0].sections.map((s) => s.type);
const hero = (c: SiteConfig) => c.pages[0].sections.find((s) => s.type.startsWith('hero'))!;

describe('BusinessDNA (regras, sem IA)', () => {
  it('detecta estética automotiva a partir de serviços reais e prefere hero em vídeo', () => {
    const d = deriveBusinessDNA(dnaInput());
    expect(d.subIndustry).toBe('Estética automotiva');
    expect(d.premiumLevel).not.toBe('standard');
    expect(d.priorityServices[0]).toBe('Polimento técnico');
    expect(d.assetProfile.videos).toBe(1);
    expect(d.heroPreference[0]).toBe('video');
    expect(d.conversionGoal).toBe('agendamento');
  });
  it('sem assets prefere heros que não dependem de foto; clínica vira clean/minimal', () => {
    const d = deriveBusinessDNA({
      name: 'Clínica X',
      segment: 'clinica',
      services: [{ title: 'Cardiologia' }],
    });
    expect(d.assetProfile.photos).toBe(0);
    expect(d.heroPreference).not.toContain('video');
    expect(d.visualPersonality).toBe('clean');
    expect(d.motionPersonality).toBe('minimal');
  });
  it('cores da marca informadas vencem as do logo e definem o modo', () => {
    const d = deriveBusinessDNA(dnaInput({ brandColors: ['#0a0a0a', '#ffcc00'] }));
    expect(d.brandColors).toEqual(['#0a0a0a', '#ffcc00']);
    expect(d.brandMode).toBe('dark');
  });
  it('a pesquisa pública só adiciona serviços/sinais verificáveis', () => {
    const research = {
      researchedAt: 'x',
      sources: [{ type: 'website' as const, url: 'https://a.com', ok: true, found: ['serviços'] }],
      facts: {
        services: ['Martelinho de ouro'],
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
    const d = deriveBusinessDNA({ name: 'Oficina Y', segment: 'oficina', research });
    expect(d.keyServices).toContain('Martelinho de ouro');
    expect(d.signals.join(' ')).toMatch(/pesquisa/i);
  });
});

describe('Direções criativas', () => {
  const dna = deriveBusinessDNA(dnaInput());
  it('propõe 3 direções distintas, ordenadas por score, todas do catálogo', () => {
    const dirs = proposeDirections(dna, 'equilibrado');
    expect(dirs).toHaveLength(3);
    expect(new Set(dirs.map((d) => d.theme + d.hero)).size).toBe(3);
    expect(dirs[0].score).toBeGreaterThanOrEqual(dirs[1].score);
    expect(dirs[0].id).toBe('performance-luxury');
    for (const d of dirs) expect(DIRECTIONS.some((x) => x.id === d.id)).toBe(true);
    expect(dirs[0].why.length).toBeGreaterThan(0);
  });
  it('criatividade conservadora evita direções ousadas; "auto" escolhe a melhor', () => {
    const cons = proposeDirections(dna, 'conservador');
    expect(cons.some((d) => d.id === 'bold-contrast')).toBe(false);
    expect(pickDirection(dna, undefined).id).toBe(proposeDirections(dna)[0].id);
    expect(pickDirection(dna, 'medical-clean').id).toBe('medical-clean');
  });
  it('paleta usa cor da marca só com contraste suficiente', () => {
    const d = deriveBusinessDNA(dnaInput({ brandColors: ['#0b0b0d', '#d4a017'] }));
    const pal = resolvePalette(
      DIRECTIONS.find((x) => x.id === 'performance-luxury')!,
      d,
    );
    expect(pal.accent.toLowerCase()).toBe('#d4a017');
    const low = deriveBusinessDNA(dnaInput({ brandColors: ['#111111', '#161616'] }));
    const pal2 = resolvePalette(
      DIRECTIONS.find((x) => x.id === 'performance-luxury')!,
      low,
    );
    expect(pal2.accent.toLowerCase()).not.toBe('#161616');
  });
});

describe('Composição adaptativa', () => {
  const dna = deriveBusinessDNA(dnaInput());
  const direction = pickDirection(dna, 'performance-luxury');
  const base = {
    ...MIZUNO,
    services: [...MIZUNO.services],
    differentials: [...MIZUNO.differentials],
    locations: [...MIZUNO.locations],
    dna,
    direction,
    assets: MIZUNO_ASSETS,
    previewMode: true,
  };

  it('planeja assets respeitando papéis', () => {
    const plan = planAssets(MIZUNO_ASSETS);
    expect(plan.heroVideo?.path).toContain('hero.mp4');
    expect(plan.heroImage?.src).toContain('/a.webp');
    expect(plan.gallery.some((g) => g.src.includes('/c.webp'))).toBe(true);
    const none = planAssets(
      MIZUNO_ASSETS.map((a) => (a.kind === 'video' ? { ...a, role: 'none' as const } : a)),
    );
    expect(none.heroVideo).toBeUndefined();
  });
  it('com vídeo gera hero-video real (autoplay muted loop playsinline + poster) e unidades', () => {
    const { config, fingerprint, assetsUsed, headline } = composeSite(base);
    const h = hero(config);
    expect(h.type).toBe('hero-video');
    expect(h.props.videoSrc).toContain('hero.mp4');
    expect(sectionTypes(config)).toContain('locations');
    expect(config.business.locations).toHaveLength(2);
    expect(config.animations.profile).toBe('performance');
    expect(assetsUsed).toContain('/files/uploads/mizuno/video/hero.mp4');
    expect(fingerprint).toContain('hero-video');
    expect(headline).toMatch(/polimento técnico|vitrificação|PPF|estética automotiva/i);
    expect(headline).not.toMatch(/pPF/);
    const html = renderSite(config)
      .files.find((f) => f.path === 'index.html')!
      .content.toString();
    expect(html).toMatch(
      /<video class="hero__video" data-gz-video autoplay muted loop playsinline[^>]*poster="[^"]+"/,
    );
    expect(html).toContain('hero__video-fallback');
    expect(html).toContain('data-motion="performance"');
    expect(html).toContain('id="unidades"');
    expect(html).not.toMatch(/lorem ipsum/i);
  });
  it('sem vídeo cai para hero cinematográfico; uma unidade só não cria a seção', () => {
    const noVideo = MIZUNO_ASSETS.filter((a) => a.kind !== 'video');
    const { config } = composeSite({
      ...base,
      assets: noVideo,
      locations: [MIZUNO.locations[0]],
      dna: deriveBusinessDNA(dnaInput({ assets: noVideo })),
    });
    expect(hero(config).type).toBe('hero-fullscreen');
    expect(sectionTypes(config)).not.toContain('locations');
  });
  it('direções diferentes produzem composições estruturalmente diferentes', () => {
    const a = composeSite(base);
    const b = composeSite({ ...base, direction: pickDirection(dna, 'editorial-automotive') });
    const c = composeSite({ ...base, direction: pickDirection(dna, 'technical-motorsport') });
    expect(hero(a.config).type).not.toBe(hero(b.config).type);
    expect(similarity(a.fingerprint, b.fingerprint)).toBeLessThan(0.6);
    expect(similarity(a.fingerprint, c.fingerprint)).toBeLessThan(0.6);
    expect(a.config.theme.id).not.toBe(c.config.theme.id);
  });
  it('seed diferente regenera a composição; locks preservam campos', () => {
    const a = composeSite({ ...base, seed: 0 });
    const b = composeSite({ ...base, seed: 1 });
    expect(a.fingerprint).not.toBe(b.fingerprint);
    expect(composeSite({ ...base, seed: 1 }).fingerprint).toBe(b.fingerprint); // determinístico
    const edited = JSON.parse(JSON.stringify(a.config)) as SiteConfig;
    const hi = edited.pages[0].sections.findIndex((s) => s.type.startsWith('hero'));
    edited.pages[0].sections[hi].props.headline = 'Título *editado* pelo usuário';
    const locked = applyLocks(b.config, edited, [`pages.0.sections.${hi}.props.headline`]);
    expect(hero(locked).props.headline).toBe('Título *editado* pelo usuário');
    expect(hero(b.config).props.headline).not.toBe('Título *editado* pelo usuário');
  });
});

describe('Creative QA', () => {
  const dna = deriveBusinessDNA(dnaInput());
  const base = {
    ...MIZUNO,
    services: [...MIZUNO.services],
    locations: [...MIZUNO.locations],
    dna,
    direction: pickDirection(dna, 'performance-luxury'),
    assets: MIZUNO_ASSETS,
    previewMode: true,
  };
  it('pontua 0–100, penaliza falta de assets e avisa similaridade', () => {
    const good = composeSite(base);
    const r1 = creativeQa(good.config, { dna, fingerprint: good.fingerprint });
    expect(r1.score).toBeGreaterThanOrEqual(85);
    expect(r1.checks.find((c) => c.id === 'assets')?.status).toBe('pass');
    const bare = composeSite({
      ...base,
      assets: [],
      locations: [],
      dna: deriveBusinessDNA(dnaInput({ assets: [] })),
    });
    const r2 = creativeQa(bare.config, { dna, fingerprint: bare.fingerprint });
    expect(r2.score).toBeLessThan(r1.score);
    expect(r2.checks.find((c) => c.id === 'assets')?.status).toBe('fail');
    const r3 = creativeQa(good.config, { dna, fingerprint: good.fingerprint }, [
      { id: 'x', fingerprint: good.fingerprint },
    ]);
    expect(r3.checks.find((c) => c.id === 'distinct')?.status).toBe('fail');
    expect(r3.warnings.join(' ')).toMatch(/quase igual/);
  });
});

describe('Mensagens adaptativas (sem inventar fatos)', () => {
  const settings = {
    agencyName: 'GZ Sites',
    ownerName: 'Gabriel',
    signature: 'Gabriel · GZ Sites',
    currency: 'BRL',
    locale: 'pt-BR',
    pricing: { institutional: 2500, defaultDeadlineDays: 10, defaultPaymentTerms: '50% na aprovação' },
  } as any;
  const prospect = {
    ...MIZUNO,
    id: 'p1',
    website: '',
    photos: MIZUNO_ASSETS,
    locations: [...MIZUNO.locations],
    services: [...MIZUNO.services],
    research: null,
    creative: null,
    potentialValue: null,
  } as any;
  it('sem site nem prévia: fala em montar prévia, não cita link nem auditoria', () => {
    const t = composeMessage('primeira-abordagem', {
      prospect,
      settings,
      now: new Date('2026-01-01T09:00:00'),
    });
    expect(t).toMatch(/^Bom dia, Rafael! Sou Gabriel, da GZ Sites/);
    expect(t).toMatch(/não encontrei um site/);
    expect(t).not.toMatch(/http|auditoria|nota/i);
  });
  it('com prévia publicada: envia o link público e cita vídeo e unidades reais', () => {
    const preview = {
      id: 'pv',
      url: '/previews/pv/',
      published: {
        url: 'https://mizuno-preview.netlify.app',
        provider: 'netlify',
        slug: 's',
        publishedAt: 'x',
      },
      meta: { direction: { name: 'Performance Luxury' } },
    } as any;
    const t = composeMessage('enviar-previa', { prospect, settings, preview });
    expect(t).toContain('https://mizuno-preview.netlify.app');
    expect(t).toMatch(/usei o vídeo/);
    expect(t).toMatch(/2 unidades/);
    const semVideo = composeMessage('enviar-previa', {
      prospect: { ...prospect, photos: [], locations: [] },
      settings,
      preview,
    });
    expect(semVideo).not.toMatch(/vídeo|unidades/);
  });
  it('preço usa proposta quando existe, senão tabela padrão', () => {
    const t = composeMessage('enviar-preco', {
      prospect,
      settings,
      proposal: { price: 3900, deadlineDays: 15, paymentTerms: 'À vista' } as any,
    });
    expect(t).toMatch(/3\.900/);
    expect(t).toMatch(/15 dias/);
    expect(composeMessage('enviar-preco', { prospect, settings })).toMatch(/2\.500/);
  });
});

describe('Fluxo no banco: prévia composta, regenerar, locks, publicar (mock) e backup', () => {
  const db = new Database(':memory:');
  db.migrate();
  const repos = createRepos(db);
  const p = repos.prospects.create({
    ...MIZUNO,
    services: [...MIZUNO.services],
    differentials: [...MIZUNO.differentials],
    locations: [...MIZUNO.locations],
  } as any);
  repos.prospects.update(p.id, { photos: MIZUNO_ASSETS, brandColors: ['#0b0b0d', '#d4a017'] });

  it('cria prévia com meta (direção, DNA, fingerprint, score) e arquivos no disco', () => {
    const pv = createComposedPreview(repos, repos.prospects.get(p.id)!, { directionId: 'auto' });
    expect(pv.meta.direction?.id).toBe('performance-luxury');
    expect(pv.meta.fingerprint).toBeTruthy();
    expect(typeof pv.meta.creativeScore).toBe('number');
    expect(fs.existsSync(path.join(pv.path, 'index.html'))).toBe(true);
    expect(repos.prospects.get(p.id)!.creative?.lastPreviewId).toBe(pv.id);
    expect(repos.prospects.get(p.id)!.stage).toBe('previa');
  });
  it('regenera com seed+1 mantendo direção e locks', () => {
    const first = repos.previews.listByProspect(p.id)[0];
    const hi = (first.config as SiteConfig).pages[0].sections.findIndex((s) => s.type.startsWith('hero'));
    setPreviewLocks(repos, first.id, [`pages.0.sections.${hi}.props.headline`]);
    const next = regeneratePreview(repos, first.id);
    expect(next.meta.seed).toBe((first.meta.seed ?? 0) + 1);
    expect(next.meta.directionId).toBe(first.meta.directionId);
    expect(next.meta.locks).toEqual([`pages.0.sections.${hi}.props.headline`]);
    expect(hero(next.config as SiteConfig).props.headline).toBe(
      hero(first.config as SiteConfig).props.headline,
    );
    expect(next.meta.fingerprint).not.toBe(first.meta.fingerprint);
  });
  it('publica via provider mock no slug do cliente e atualiza no mesmo slug', async () => {
    const pv = repos.previews.listByProspect(p.id)[0];
    const pub = await publishPreview(repos, pv.id, mockProvider('http://localhost:4800'));
    expect(pub.published?.slug).toBe('mizuno-estetica-automotiva-preview');
    expect(pub.published?.url).toBe('http://localhost:4800/published/mizuno-estetica-automotiva-preview/');
    expect(
      fs.existsSync(path.join(env.dataDir, 'published', 'mizuno-estetica-automotiva-preview', 'index.html')),
    ).toBe(true);
    const other = repos.previews.listByProspect(p.id)[1];
    const pub2 = await publishPreview(repos, other.id, mockProvider());
    expect(pub2.published?.slug).toBe('mizuno-estetica-automotiva-preview');
  });
  it('sem provider configurado falha com mensagem amigável (nunca lê token do frontend)', async () => {
    const saved = process.env.PUBLISH_PROVIDER;
    delete process.env.PUBLISH_PROVIDER;
    expect(publishStatus().configured).toBe(false);
    await expect(publishPreview(repos, repos.previews.listByProspect(p.id)[0].id)).rejects.toThrow(
      /NETLIFY_AUTH_TOKEN/,
    );
    if (saved) process.env.PUBLISH_PROVIDER = saved;
  });
  it('backup exporta/importa as novas colunas (unidades, pesquisa, meta da prévia, publicação)', () => {
    const json = exportJson(repos);
    const db2 = new Database(':memory:');
    db2.migrate();
    const repos2 = createRepos(db2);
    importJson(db2, repos2, json, 'replace');
    const p2 = repos2.prospects.get(p.id)!;
    expect(p2.locations).toHaveLength(2);
    expect(p2.photos.filter((a) => a.kind === 'video')).toHaveLength(1);
    const pv2 = repos2.previews.listByProspect(p.id)[0];
    expect(pv2.meta.direction?.id).toBe('performance-luxury');
    expect(pv2.published?.slug).toBe('mizuno-estetica-automotiva-preview');
  });
});
