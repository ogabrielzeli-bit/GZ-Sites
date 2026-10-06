import { describe, expect, it, beforeAll } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

// dados em pasta temporária para não tocar em ./data
process.env.GZ_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'gz-test-'));

import { Database } from '../../src/server/db/database';
import { createRepos } from '../../src/server/db/repos';
import { seedTemplates } from '../../src/server/modules/messages/seed';
import { buildMessageVars, renderMessage, renderTemplate } from '../../src/server/modules/messages';
import {
  defaultProposalData,
  renderProposalHtml,
  renderProposalText,
  renderProposalWhatsapp,
} from '../../src/server/modules/proposals';
import { scoreReport } from '../../src/server/modules/auditor/score';
import { applyAutofix } from '../../src/qa/autofix';
import { lintHtml, checkInternalLinks } from '../../src/qa/static-checks';
import { generateSiteConfig, renderSite, writeRenderedSite, ensureRuntime } from '../../src/engine';
import { NoAIProvider } from '../../src/server/modules/ai/none';
import { createAIProvider } from '../../src/server/modules/ai';
import { exportJson, importJson } from '../../src/server/modules/backup';
import { ProspectInput, type AuditReport, type Prospect } from '../../src/shared/schemas';
import type { AIProvider } from '../../src/server/modules/ai/provider';

function freshDb() {
  const db = new Database(':memory:');
  db.migrate();
  const repos = createRepos(db);
  seedTemplates(repos.templates);
  return { db, repos };
}

describe('banco e repositórios', () => {
  it('migra, cria prospect com slug único e registra histórico', () => {
    const { repos } = freshDb();
    const a = repos.prospects.create(
      ProspectInput.parse({
        name: 'Loja X',
        segment: 'loja',
        country: 'Brasil',
        notes: '',
        links: [],
        stage: 'lead',
        tags: [],
      }),
    );
    const b = repos.prospects.create(
      ProspectInput.parse({
        name: 'Loja X',
        segment: 'loja',
        country: 'Brasil',
        notes: '',
        links: [],
        stage: 'lead',
        tags: [],
      }),
    );
    expect(a.slug).toBe('loja-x');
    expect(b.slug).toBe('loja-x-2');
    repos.activities.log(a.id, 'prospect.created', 'criado');
    expect(repos.activities.list({ prospectId: a.id })).toHaveLength(1);
    const upd = repos.prospects.update(a.id, { stage: 'fechado', potentialValue: 3000 });
    expect(upd.stage).toBe('fechado');
    expect(repos.prospects.list({ stage: 'fechado' })).toHaveLength(1);
    expect(repos.prospects.list({ q: 'Loja' })).toHaveLength(2);
    repos.prospects.delete(a.id);
    expect(repos.prospects.count()).toBe(1);
  });
  it('settings com defaults e merge', () => {
    const { repos } = freshDb();
    expect(repos.settings.get().agencyName).toBe('GZ Sites');
    repos.settings.save({ ownerName: 'Gabriel' });
    expect(repos.settings.get().ownerName).toBe('Gabriel');
    expect(repos.settings.get().slogan).toBe('Sua loja fecha. Seu site não.');
  });
  it('templates: seed não sobrescreve edição; reset funciona', () => {
    const { repos } = freshDb();
    expect(repos.templates.list('message').length).toBeGreaterThanOrEqual(8);
    repos.templates.upsert({ kind: 'message', key: 'follow-up', name: 'FU', body: 'custom' });
    seedTemplates(repos.templates);
    expect(repos.templates.get('message', 'follow-up')!.body).toBe('custom');
  });
  it('tarefas, propostas e projetos', () => {
    const { repos } = freshDb();
    const p = repos.prospects.create(
      ProspectInput.parse({
        name: 'A',
        segment: 'clinica',
        country: 'Brasil',
        notes: '',
        links: [],
        stage: 'lead',
        tags: [],
      }),
    );
    const t = repos.tasks.create({ prospectId: p.id, title: 'ligar' });
    expect(repos.tasks.countPending()).toBe(1);
    repos.tasks.update(t.id, { done: true });
    expect(repos.tasks.countPending()).toBe(0);
    const pr = repos.proposals.create(p.id, defaultProposalData(p, repos.settings.get()));
    expect(pr.number).toBe(1);
    expect(repos.proposals.create(p.id, defaultProposalData(p, repos.settings.get())).number).toBe(2);
    const pj = repos.projects.create({
      prospectId: p.id,
      name: 'A',
      slug: repos.projects.uniqueSlug('A'),
      config: {},
      path: '/tmp/x',
    });
    expect(repos.projects.update(pj.id, { status: 'built' }).status).toBe('built');
  });
  it('backup exporta e importa (merge e replace)', () => {
    const { db, repos } = freshDb();
    repos.prospects.create(
      ProspectInput.parse({
        name: 'B',
        segment: 'b2b',
        country: 'Brasil',
        notes: '',
        links: [],
        stage: 'lead',
        tags: [],
      }),
    );
    const dump = exportJson(repos);
    expect(dump.data.prospects).toHaveLength(1);
    const other = freshDb();
    const r = importJson(other.db, other.repos, dump, 'replace');
    expect(r.imported.prospects).toBe(1);
    expect(other.repos.prospects.count()).toBe(1);
    expect(importJson(other.db, other.repos, dump, 'merge').imported.prospects).toBe(0);
    db.close();
  });
});

describe('mensagens e propostas', () => {
  const { repos } = freshDb();
  const prospect: Prospect = repos.prospects.create(
    ProspectInput.parse({
      name: 'Barbearia Top',
      segment: 'barbearia',
      city: 'Curitiba',
      contactName: 'Carlos Lima',
      whatsapp: '41988887777',
      country: 'Brasil',
      notes: '',
      links: [],
      stage: 'lead',
      tags: [],
      potentialValue: 1800,
    }),
  );
  const settings = repos.settings.save({ ownerName: 'Gabriel' });
  it('renderiza mensagem com variáveis', () => {
    const t = repos.templates.get('message', 'primeira-abordagem')!;
    const text = renderMessage(t, { prospect, settings });
    expect(text).toContain('Carlos');
    expect(text).toContain('Barbearia Top');
    expect(text).toContain('Me chamo Gabriel, da GZ Sites');
    expect(text).toContain('barbearia em Curitiba');
    expect(text).not.toMatch(/\{[a-z_]+\}/);
  });
  it('vars sem auditoria têm fallback', () => {
    const vars = buildMessageVars({ prospect, settings });
    expect(vars.nota).toBe('—');
    expect(vars.problema1.length).toBeGreaterThan(5);
    expect(renderTemplate('{nome} {inexistente}', vars)).toBe('Carlos {inexistente}');
  });
  it('proposta: defaults, html, texto e whatsapp', () => {
    const data = defaultProposalData(prospect, settings);
    expect(data.price).toBe(1800);
    const pr = repos.proposals.create(prospect.id, data);
    const tpl = repos.templates.get('proposal', 'classic')!;
    const html = renderProposalHtml(pr, prospect, settings, tpl);
    expect(html).toContain('Barbearia Top');
    expect(html).toContain('R$');
    expect(html).not.toContain('{{');
    expect(renderProposalText(pr, prospect, settings)).toContain('INVESTIMENTO');
    expect(renderProposalWhatsapp(pr, prospect, settings, 'http://x')).toContain('http://x');
  });
});

describe('pontuação da auditoria', () => {
  const basePartial = (): Omit<AuditReport, 'findings' | 'scores' | 'opportunities'> => ({
    url: 'http://x.com',
    finalUrl: 'http://x.com/',
    fetchedAt: '',
    durationMs: 1,
    httpStatus: 200,
    https: false,
    redirectedToHttps: false,
    headers: {},
    page: {
      title: null,
      description: null,
      h1: [],
      headings: [],
      canonical: null,
      viewport: null,
      favicon: false,
      openGraph: {},
      structuredData: [],
      lang: null,
      generator: null,
      wordCount: 50,
      linksInternal: 3,
      linksExternal: 0,
      imagesTotal: 1,
      imagesWithoutAlt: 1,
      imagesLazy: 0,
      imagesOversized: [],
      forms: [],
      fontsFamilies: 1,
      hasTelLink: false,
      hasWhatsappLink: false,
      hasEmailLink: false,
      ctaCandidates: [],
      phoneVisibleAboveFold: false,
      whatsappVisibleAboveFold: false,
      ctaAboveFold: false,
      year: 2015,
      usesTables: true,
      legacySignals: ['Layout baseado em tabelas', 'Sem meta viewport (não responsivo)'],
      scriptsCount: 2,
      inlineStylesCount: 10,
      usesFlexOrGrid: false,
      hasHeroImage: false,
      textBlocksLong: 0,
    },
    mobile: {
      horizontalOverflow: true,
      overflowWidth: 300,
      viewportWidth: 390,
      smallFontElements: 30,
      smallTapTargets: 40,
      hasMobileMenu: false,
      overlappingElements: 0,
      clippedElements: 0,
      smallestFontPx: 9,
    },
    network: {
      requests: 20,
      transferBytes: 6_000_000,
      byType: {},
      heaviestImages: [{ url: 'a.jpg', bytes: 900_000, type: 'image/jpeg' }],
      mixedContent: [],
      thirdPartyDomains: [],
      unoptimizedImages: 1,
    },
    console: { errors: [], warnings: 0 },
    security: {
      https: false,
      hsts: false,
      csp: false,
      xFrameOptions: false,
      xContentTypeOptions: false,
      referrerPolicy: false,
      permissionsPolicy: false,
      mixedContent: 0,
      exposedSecrets: [],
      serverHeader: null,
      poweredBy: null,
    },
    seoFiles: { robots: false, sitemap: false, robotsBlocksAll: false },
    lighthouse: { ran: false },
  });
  it('site ruim recebe notas baixas e oportunidades ordenadas por severidade', () => {
    const r = scoreReport(basePartial());
    expect(r.scores.overall).toBeLessThan(40);
    expect(r.scores.security).toBeLessThan(50);
    expect(r.scores.mobile).toBeLessThan(40);
    expect(r.opportunities.length).toBeGreaterThanOrEqual(5);
    expect(r.opportunities.length).toBeLessThanOrEqual(8);
    expect(r.opportunities[0].severity).toBe('high');
    expect(r.opportunities.map((o) => o.title)).toContain('Site sem HTTPS (marcado como não seguro)');
  });
  it('site bom recebe notas altas', () => {
    const p = basePartial();
    p.https = true;
    p.security = {
      ...p.security,
      https: true,
      hsts: true,
      csp: true,
      xFrameOptions: true,
      xContentTypeOptions: true,
      referrerPolicy: true,
      permissionsPolicy: true,
    };
    p.page = {
      ...p.page,
      title: 'Oficina do Zé · Curitiba — mecânica',
      description: 'Oficina mecânica em Curitiba com revisão, freios e injeção. Orçamento pelo WhatsApp.',
      h1: ['Oficina'],
      headings: [
        { tag: 'h1', text: 'a' },
        { tag: 'h2', text: 'b' },
        { tag: 'h2', text: 'c' },
      ],
      canonical: 'x',
      viewport: 'width=device-width',
      favicon: true,
      openGraph: { 'og:title': 'a', 'og:image': 'b', 'og:description': 'c' },
      structuredData: ['LocalBusiness'],
      lang: 'pt-BR',
      imagesWithoutAlt: 0,
      hasTelLink: true,
      hasWhatsappLink: true,
      whatsappVisibleAboveFold: true,
      ctaAboveFold: true,
      phoneVisibleAboveFold: true,
      legacySignals: [],
      usesTables: false,
      usesFlexOrGrid: true,
      hasHeroImage: true,
      year: new Date().getFullYear(),
      fontsFamilies: 2,
      imagesTotal: 5,
      wordCount: 500,
    };
    p.mobile = {
      ...p.mobile,
      horizontalOverflow: false,
      overflowWidth: 0,
      smallFontElements: 0,
      smallTapTargets: 0,
      hasMobileMenu: true,
    };
    p.network = { ...p.network, transferBytes: 800_000, heaviestImages: [], unoptimizedImages: 0 };
    p.seoFiles = { robots: true, sitemap: true, robotsBlocksAll: false };
    const r = scoreReport(p);
    expect(r.scores.overall).toBeGreaterThan(85);
    expect(r.opportunities).toHaveLength(0);
  });
});

describe('QA estático e auto-fix', () => {
  let dist: string;
  beforeAll(async () => {
    await ensureRuntime();
    dist = fs.mkdtempSync(path.join(os.tmpdir(), 'gz-dist-'));
    const { config } = generateSiteConfig({
      name: 'Teste',
      segment: 'academia',
      whatsapp: '41999999999',
      previewMode: false,
    });
    writeRenderedSite(renderSite(config), dist);
  }, 60000);
  it('site gerado passa no lint e nos links internos', () => {
    const checks = lintHtml(dist);
    const bad = checks.filter((c) => c.status === 'fail');
    expect(bad, JSON.stringify(bad)).toEqual([]);
    expect(checkInternalLinks(dist).status).toBe('pass');
  });
  it('lint detecta problemas injetados', () => {
    const d2 = fs.mkdtempSync(path.join(os.tmpdir(), 'gz-dist-'));
    fs.writeFileSync(
      path.join(d2, 'index.html'),
      '<html><body><img src="a.png"><a target="_blank" href="http://x">x</a><a href="#nada">y</a><div id="a"></div><div id="a"></div></body></html>',
    );
    const checks = lintHtml(d2);
    expect(checks.find((c) => c.id === 'img-alt')!.status).toBe('fail');
    expect(checks.find((c) => c.id === 'blank-rel')!.status).toBe('warning');
    expect(checks.find((c) => c.id === 'dup-ids')!.status).toBe('warning');
    expect(checks.find((c) => c.id === 'meta')!.status).toBe('fail');
    expect(checkInternalLinks(d2).status).toBe('fail');
    const fixed = applyAutofix(
      {
        brand: { name: 'Z' },
        theme: { id: 'minimal-light' },
        business: { segment: 'loja' },
        contact: {},
        pages: [{ path: '/', title: 'Início', sections: [] }],
      },
      d2,
    );
    expect(fixed.applied.some((a) => a.id === 'html')).toBe(true);
    const html = fs.readFileSync(path.join(d2, 'index.html'), 'utf8');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('<img alt=""');
    expect(fs.existsSync(path.join(d2, '_headers'))).toBe(true);
  });
  it('auto-fix corrige config: alt, variante, âncora, whatsapp, meta', () => {
    const { config } = generateSiteConfig({ name: 'Teste', segment: 'loja' });
    const raw: any = JSON.parse(JSON.stringify(config));
    raw.contact.whatsapp = '(41) 9 8888-7777';
    raw.seo.title = undefined;
    raw.seo.description = undefined;
    raw.pages[0].sections[1].variant = 'nao-existe';
    raw.pages[0].sections[1].props.secondaryCta = { label: 'x', href: '#inexistente' };
    raw.pages[0].sections[1].props.image = { src: 'assets/img/x.webp' };
    raw.pages[0].sections.push({ type: 'seção-fantasma', props: {} });
    const r = applyAutofix(raw, null);
    const ids = r.applied.map((a) => a.id);
    expect(ids).toContain('whatsapp');
    expect(ids).toContain('variants');
    expect(ids).toContain('links');
    expect(ids).toContain('alt');
    expect(ids).toContain('meta');
    expect(ids).toContain('sections');
    expect(r.config.contact.whatsapp).toBe('5541988887777');
    expect(r.needsRebuild).toBe(true);
  });
});

describe('IA opcional', () => {
  it('sem chave, provider é NoAI e todas as funções respondem', async () => {
    const p = createAIProvider();
    expect(p.id).toBe('none');
    expect(p.available).toBe(false);
    const no: AIProvider = new NoAIProvider();
    const ctx = { company: 'Zé Motos', segment: 'oficina', city: 'Curitiba' };
    expect((await no.headlines(ctx, 2)).length).toBe(2);
    expect(await no.improveCopy('texto sem ponto final aqui', ctx)).toMatch(/\.$/);
    expect(await no.adaptTone('Oi, você', 'formal', ctx)).toContain('Olá');
    expect(
      await no.summarizeAudit(
        {
          url: 'x',
          scores: { overall: 40, seo: 20, mobile: 90 },
          opportunities: [{ title: 'Sem WhatsApp', detail: '', severity: 'high' }],
        },
        ctx,
      ),
    ).toContain('40/100');
    expect((await no.suggestStructure(ctx)).length).toBeGreaterThan(5);
    expect(await no.proposalText({ ...ctx, problems: ['a'], pages: ['Início'] })).toContain('Zé Motos');
  });
});
