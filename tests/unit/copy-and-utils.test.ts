import { describe, expect, it } from 'vitest';
import { COPY_LIBRARY, createPicker, getCopy, interpolate } from '../../src/engine/copy';
import { usable } from '../../src/engine/copy';
import { SEGMENT_IDS } from '../../src/shared/segments';
import {
  formatCurrency,
  formatPhoneBR,
  hashString,
  instagramHandle,
  normalizeUrl,
  normalizeWhatsapp,
  slugify,
  whatsappLink,
} from '../../src/shared/utils';
import { ProspectInput, SettingsSchema } from '../../src/shared/schemas';

describe('biblioteca de copy', () => {
  it('todos os segmentos têm conteúdo completo', () => {
    for (const id of SEGMENT_IDS) {
      const c = COPY_LIBRARY[id];
      expect(c.segment).toBe(id);
      expect(c.hero.headline.length).toBeGreaterThanOrEqual(2);
      expect(c.services.length).toBeGreaterThanOrEqual(4);
      expect(c.benefits.length).toBeGreaterThanOrEqual(3);
      expect(c.faqs.length).toBeGreaterThanOrEqual(3);
      expect(c.testimonials.length).toBeGreaterThanOrEqual(2);
      expect(c.themes.length).toBeGreaterThanOrEqual(2);
      expect(c.layouts.length).toBeGreaterThanOrEqual(2);
      expect(c.whatsappMessage).toContain('{empresa}');
    }
  });
  it('interpola variáveis e trata ausentes', () => {
    expect(interpolate('A {empresa} atende {cidade}', { empresa: 'X', cidade: 'Y' })).toBe('A X atende Y');
    expect(interpolate('A {empresa} atende {cidade}', { empresa: 'X' })).toBe('A X atende toda a região');
    expect(usable('Há {anos} anos', { empresa: 'X' })).toBe(false);
    expect(usable('Há {anos} anos', { empresa: 'X', anos: 5 })).toBe(true);
  });
  it('picker é determinístico e pula frases sem variáveis', () => {
    const p1 = createPicker({ empresa: 'Zé' }, 'seed');
    const p2 = createPicker({ empresa: 'Zé' }, 'seed');
    const list = ['Há {anos} anos', 'Sem anos'];
    expect(p1.pick(list)).toBe('Sem anos');
    expect(p1.pick(getCopy('oficina').hero.headline, 1)).toBe(p2.pick(getCopy('oficina').hero.headline, 1));
  });
  it('segmento desconhecido cai em serviços', () => {
    expect(getCopy('xyz').segment).toBe('servicos');
  });
});

describe('utils', () => {
  it('slugify', () => {
    expect(slugify('Serralheria Dois Irmãos!')).toBe('serralheria-dois-irmaos');
    expect(slugify('')).toBe('item');
  });
  it('whatsapp', () => {
    expect(normalizeWhatsapp('(41) 99999-8888')).toBe('5541999998888');
    expect(normalizeWhatsapp('+55 41 99999-8888')).toBe('5541999998888');
    expect(normalizeWhatsapp('123')).toBeNull();
    expect(whatsappLink('41999998888', 'Oi')).toBe('https://wa.me/5541999998888?text=Oi');
    expect(formatPhoneBR('5541999998888')).toBe('(41) 99999-8888');
  });
  it('urls e instagram', () => {
    expect(normalizeUrl('empresa.com.br')).toBe('https://empresa.com.br/');
    expect(normalizeUrl('semponto')).toBeNull();
    expect(instagramHandle('https://instagram.com/gz.sites/')).toBe('gz.sites');
    expect(instagramHandle('@gz')).toBe('gz');
  });
  it('moeda e hash', () => {
    expect(formatCurrency(2500)).toMatch(/R\$\s?2\.500/);
    expect(formatCurrency(null)).toBe('—');
    expect(hashString('a')).toBe(hashString('a'));
    expect(hashString('a')).not.toBe(hashString('b'));
  });
});

describe('schemas', () => {
  it('ProspectInput aplica defaults e limpa vazios', () => {
    const p = ProspectInput.parse({ name: ' Loja ', city: '' });
    expect(p.name).toBe('Loja');
    expect(p.city).toBeUndefined();
    expect(p.stage).toBe('lead');
    expect(p.segment).toBe('servicos');
  });
  it('ProspectInput rejeita nome vazio', () => {
    expect(ProspectInput.safeParse({ name: '' }).success).toBe(false);
  });
  it('Settings tem os valores iniciais da GZ Sites', () => {
    const s = SettingsSchema.parse({});
    expect(s.agencyName).toBe('GZ Sites');
    expect(s.slogan).toBe('Sua loja fecha. Seu site não.');
    expect(s.ai.provider).toBe('none');
  });
});
