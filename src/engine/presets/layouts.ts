/**
 * Arquétipos de layout: composições de seções reutilizadas por todos os segmentos.
 * Cada segmento prefere alguns arquétipos; combinados com tema + copy, geram sites bem diferentes.
 */
import type { LayoutArchetype } from '../copy/types';
import type { SectionType } from '@shared/site-config';

export interface Blueprint {
  type: SectionType;
  variant?: string;
  /** fonte de conteúdo (ver generate.ts) */
  slot?: string;
  tone?: 'default' | 'alt' | 'surface' | 'accent' | 'dark';
  props?: Record<string, unknown>;
}

export const LAYOUTS: Record<LayoutArchetype, Blueprint[]> = {
  /** Impacto: fullscreen, marquee, serviços em linhas, números gigantes, lista editorial */
  impact: [
    { type: 'header', variant: 'transparent' },
    { type: 'hero-fullscreen', variant: 'bottom' },
    { type: 'marquee', variant: 'band' },
    { type: 'services', variant: 'rows', slot: 'services' },
    { type: 'about', variant: 'stack-media', slot: 'about', tone: 'alt' },
    { type: 'numbers', variant: 'big', slot: 'stats' },
    { type: 'projects', variant: 'list', slot: 'projects', tone: 'alt' },
    { type: 'process', variant: 'columns', slot: 'process' },
    { type: 'testimonials', variant: 'big', slot: 'testimonials', tone: 'alt' },
    { type: 'faq', variant: 'split', slot: 'faq' },
    { type: 'cta', variant: 'full', slot: 'finalCta' },
    { type: 'contact', variant: 'form', slot: 'contact' },
    { type: 'footer', variant: 'big' },
    { type: 'whatsapp-float' },
    { type: 'sticky-cta' },
  ],
  /** Local: direto ao ponto, WhatsApp em destaque, horários, mapa */
  local: [
    { type: 'header', variant: 'default' },
    { type: 'hero', variant: 'split' },
    { type: 'benefits', variant: 'grid', slot: 'benefits', tone: 'alt' },
    { type: 'services', variant: 'cards', slot: 'services' },
    { type: 'about', variant: 'split', slot: 'about', tone: 'alt' },
    { type: 'numbers', variant: 'inline', slot: 'stats' },
    { type: 'gallery', variant: 'editorial', slot: 'gallery' },
    { type: 'testimonials', variant: 'cards', slot: 'testimonials', tone: 'alt' },
    { type: 'faq', variant: 'stacked', slot: 'faq' },
    { type: 'cta', variant: 'card', slot: 'finalCta' },
    { type: 'contact', variant: 'map', slot: 'contact', tone: 'alt' },
    { type: 'footer', variant: 'columns' },
    { type: 'whatsapp-float' },
    { type: 'sticky-cta' },
  ],
  /** Editorial: manifesto, serviços alternados com imagens, equipe, timeline */
  editorial: [
    { type: 'header', variant: 'default' },
    { type: 'hero-split', variant: 'image-right' },
    { type: 'manifesto', variant: 'left', slot: 'manifesto' },
    { type: 'services', variant: 'alternating', slot: 'services', tone: 'alt' },
    { type: 'numbers', variant: 'grid', slot: 'stats' },
    { type: 'projects', variant: 'grid', slot: 'projects', tone: 'alt' },
    { type: 'process', variant: 'timeline', slot: 'process' },
    { type: 'testimonials', variant: 'big', slot: 'testimonials', tone: 'alt' },
    { type: 'faq', variant: 'split', slot: 'faq' },
    { type: 'cta', variant: 'band', slot: 'finalCta', tone: 'accent' },
    { type: 'contact', variant: 'form', slot: 'contact' },
    { type: 'footer', variant: 'columns' },
    { type: 'whatsapp-float' },
    { type: 'sticky-cta' },
  ],
  /** Catálogo: produtos/serviços em destaque, benefícios, comparação */
  catalog: [
    { type: 'header', variant: 'default' },
    { type: 'hero', variant: 'split' },
    { type: 'marquee', variant: 'band' },
    { type: 'catalog', variant: 'featured', slot: 'catalog' },
    { type: 'benefits', variant: 'list', slot: 'benefits', tone: 'alt' },
    { type: 'products', variant: 'grid-4', slot: 'products' },
    { type: 'about', variant: 'image-left', slot: 'about', tone: 'alt' },
    { type: 'testimonials', variant: 'slider', slot: 'testimonials' },
    { type: 'comparison', slot: 'comparison', tone: 'alt' },
    { type: 'faq', variant: 'stacked', slot: 'faq' },
    { type: 'cta', variant: 'card', slot: 'finalCta' },
    { type: 'contact', variant: 'simple', slot: 'contact', tone: 'alt' },
    { type: 'footer', variant: 'columns' },
    { type: 'whatsapp-float' },
    { type: 'sticky-cta' },
  ],
  /** Confiança: selos, processo, comparação, números em cards */
  trust: [
    { type: 'header', variant: 'default' },
    { type: 'hero', variant: 'split' },
    { type: 'services', variant: 'cards', slot: 'services', tone: 'alt' },
    { type: 'process', variant: 'columns', slot: 'process' },
    { type: 'about', variant: 'image-left', slot: 'about', tone: 'alt' },
    { type: 'numbers', variant: 'cards', slot: 'stats' },
    { type: 'benefits', variant: 'numbered', slot: 'benefits', tone: 'alt' },
    { type: 'testimonials', variant: 'slider', slot: 'testimonials' },
    { type: 'comparison', slot: 'comparison', tone: 'alt' },
    { type: 'faq', variant: 'split', slot: 'faq' },
    { type: 'cta', variant: 'band', slot: 'finalCta', tone: 'accent' },
    { type: 'contact', variant: 'form', slot: 'contact' },
    { type: 'footer', variant: 'columns' },
    { type: 'whatsapp-float' },
    { type: 'sticky-cta' },
  ],
  /** Showcase: visual, scroll horizontal, antes/depois, masonry */
  showcase: [
    { type: 'header', variant: 'transparent' },
    { type: 'hero-fullscreen', variant: 'center' },
    { type: 'manifesto', variant: 'center', slot: 'manifesto' },
    { type: 'horizontal-scroll', slot: 'hscroll', tone: 'alt' },
    { type: 'services', variant: 'minimal', slot: 'services' },
    { type: 'before-after', slot: 'beforeAfter', tone: 'alt' },
    { type: 'portfolio-masonry', slot: 'projects' },
    { type: 'statistics', variant: 'big', slot: 'stats', tone: 'alt' },
    { type: 'testimonials', variant: 'cards', slot: 'testimonials' },
    { type: 'cta', variant: 'full', slot: 'finalCta' },
    { type: 'contact', variant: 'form', slot: 'contact', tone: 'alt' },
    { type: 'footer', variant: 'big' },
    { type: 'whatsapp-float' },
    { type: 'sticky-cta' },
  ],
};

export const LAYOUT_LIST = Object.keys(LAYOUTS) as LayoutArchetype[];

export const LAYOUT_INFO: Record<LayoutArchetype, { name: string; description: string }> = {
  impact: { name: 'Impacto', description: 'Hero em tela cheia, números gigantes e narrativa forte.' },
  local: { name: 'Negócio local', description: 'Direto ao ponto: benefícios, WhatsApp, mapa e horários.' },
  editorial: { name: 'Editorial', description: 'Manifesto, serviços com imagens, processo em timeline.' },
  catalog: { name: 'Catálogo', description: 'Produtos e serviços em destaque, comparação e prova social.' },
  trust: { name: 'Confiança', description: 'Processo claro, diferenciais numerados, comparação.' },
  showcase: { name: 'Showcase', description: 'Visual: scroll horizontal, antes/depois, portfólio masonry.' },
};
