import { describe, expect, it, beforeAll } from 'vitest';
import {
  generateSiteConfig,
  renderSite,
  ensureRuntime,
  THEME_LIST,
  LAYOUT_LIST,
  sectionCatalog,
  getSection,
} from '../../src/engine';
import { SEGMENT_IDS } from '../../src/shared/segments';
import { THEME_IDS, SECTION_TYPES, parseSiteConfig } from '../../src/shared/site-config';
import { accentText, splitWords } from '../../src/engine/sections/types';
import { placeholderSvg } from '../../src/engine/placeholders';

beforeAll(async () => {
  await ensureRuntime();
}, 60000);

const base = {
  name: 'Oficina do Zé',
  city: 'Curitiba',
  state: 'PR',
  whatsapp: '41999998888',
  email: 'a@b.com',
  yearsExperience: 10,
};

describe('engine: geração e render', () => {
  it('gera e renderiza todos os segmentos sem avisos', () => {
    for (const segment of SEGMENT_IDS) {
      const { config } = generateSiteConfig({ ...base, segment, previewMode: true });
      const site = renderSite(config);
      expect(site.warnings, segment).toEqual([]);
      const html = site.files.find((f) => f.path === 'index.html')!.content as string;
      expect(html).toContain('<h1');
      expect(html).toContain('wa.me/5541999998888');
      expect(html).toContain('application/ld+json');
      expect(html).toContain('gz-preview-bar');
      expect(site.files.some((f) => f.path === 'assets/site.css')).toBe(true);
      expect(site.files.some((f) => f.path === 'assets/gz-runtime.js')).toBe(true);
      expect(site.files.some((f) => f.path === '_headers')).toBe(true);
    }
  });

  it('todos os temas e layouts renderizam', () => {
    for (const theme of THEME_IDS) {
      for (const layout of LAYOUT_LIST) {
        const {
          config,
          theme: t,
          layout: l,
        } = generateSiteConfig({ ...base, segment: 'servicos', theme, layout });
        expect(t).toBe(theme);
        expect(l).toBe(layout);
        const site = renderSite(config);
        expect(site.warnings, `${theme}/${layout}`).toEqual([]);
      }
    }
    expect(THEME_LIST).toHaveLength(10);
  });

  it('é determinístico', () => {
    const a = renderSite(generateSiteConfig({ ...base, segment: 'barbearia' }).config);
    const b = renderSite(generateSiteConfig({ ...base, segment: 'barbearia' }).config);
    const ha = a.files.find((f) => f.path === 'index.html')!.content as string;
    const hb = b.files.find((f) => f.path === 'index.html')!.content as string;
    // o único trecho variável é o ano do rodapé (mesmo em execuções do mesmo ano)
    expect(ha).toBe(hb);
  });

  it('variação muda tema/layout', () => {
    const v0 = generateSiteConfig({ ...base, segment: 'restaurante', layoutVariant: 0 });
    const v1 = generateSiteConfig({ ...base, segment: 'restaurante', layoutVariant: 1 });
    expect(v0.theme !== v1.theme || v0.layout !== v1.layout).toBe(true);
  });

  it('sem telefone, o CTA cai para o formulário', () => {
    const { config } = generateSiteConfig({ name: 'X', segment: 'loja' });
    const html = renderSite(config).files.find((f) => f.path === 'index.html')!.content as string;
    expect(html).not.toContain('wa.me');
    expect(html).toContain('href="#contato"');
  });

  it('modo final: sem barra de prévia, com sitemap e robots liberado', () => {
    const { config } = generateSiteConfig({ ...base, segment: 'clinica', previewMode: false });
    config.seo.siteUrl = 'https://clinica.com.br';
    const site = renderSite(config);
    const html = site.files.find((f) => f.path === 'index.html')!.content as string;
    expect(html).not.toContain('gz-preview-bar');
    expect(html).toContain('<link rel="canonical" href="https://clinica.com.br/">');
    expect(site.files.find((f) => f.path === 'robots.txt')!.content).toContain('Allow: /');
    expect(site.files.some((f) => f.path === 'sitemap.xml')).toBe(true);
  });

  it('todas as seções do catálogo existem e têm variantes', () => {
    const cat = sectionCatalog();
    for (const type of SECTION_TYPES) {
      const def = getSection(type);
      expect(def, type).toBeDefined();
      expect(def!.variants.length).toBeGreaterThan(0);
    }
    expect(cat.length).toBe(SECTION_TYPES.length);
  });

  it('seção com variante inválida usa a padrão e props inválidas geram aviso', () => {
    const { config } = generateSiteConfig({ ...base, segment: 'advogado' });
    config.pages[0].sections.push({
      type: 'comparison',
      variant: 'x',
      enabled: true,
      props: { left: 'errado' },
    } as any);
    const site = renderSite(config);
    expect(site.warnings.some((w) => w.includes('comparison'))).toBe(true);
  });

  it('config inválido é rejeitado pelo schema', () => {
    expect(() => parseSiteConfig({ brand: {}, pages: [] })).toThrow();
  });
});

describe('helpers de texto', () => {
  it('accentText marca *palavra*', () => {
    expect(accentText('Feito para *durar*.')).toBe('Feito para <em class="accent">durar</em>.');
    expect(accentText('<b>x</b>')).toBe('&lt;b&gt;x&lt;/b&gt;');
  });
  it('splitWords preserva o destaque', () => {
    const out = splitWords(accentText('Metal com *acabamento de verdade*.'));
    expect(out).toContain('<span class="word"><em class="accent">acabamento</em></span>');
    expect(out).toContain('<span class="word"><em class="accent">verdade.</em></span>');
    expect(out).not.toContain('&lt;em');
  });
  it('placeholder gera SVG válido e determinístico', () => {
    const a = placeholderSvg({
      width: 400,
      height: 300,
      seed: 'x',
      palette: ['#111', '#222', '#333', '#444'],
      style: 'geometric',
      label: 'Foto',
    });
    const b = placeholderSvg({
      width: 400,
      height: 300,
      seed: 'x',
      palette: ['#111', '#222', '#333', '#444'],
      style: 'geometric',
      label: 'Foto',
    });
    expect(a).toBe(b);
    expect(a.startsWith('<svg')).toBe(true);
    expect(a).toContain('aria-label="Foto"');
  });
});
