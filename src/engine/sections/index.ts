/**
 * Registro de todas as seções do GZ Engine.
 */
import type { SectionType } from '@shared/site-config';
import type { SectionDef } from './types';
import { HERO_SECTIONS } from './heroes';
import { CONTENT_SECTIONS } from './content';
import { MEDIA_SECTIONS } from './media';
import { CONVERSION_SECTIONS } from './conversion';
import { CHROME_SECTIONS } from './chrome';

const ALL: SectionDef[] = [
  ...CHROME_SECTIONS,
  ...HERO_SECTIONS,
  ...CONTENT_SECTIONS,
  ...MEDIA_SECTIONS,
  ...CONVERSION_SECTIONS,
];

export const SECTION_REGISTRY: Record<string, SectionDef> = Object.fromEntries(ALL.map((s) => [s.type, s]));

export function getSection(type: SectionType | string): SectionDef | undefined {
  return SECTION_REGISTRY[type];
}

/** Catálogo (para o dashboard/documentação): tipo, nome, descrição e variantes */
export function sectionCatalog() {
  return ALL.map((s) => ({
    type: s.type,
    name: s.name,
    description: s.description,
    variants: s.variants,
    overlay: !!s.overlay,
  }));
}

export * from './types';
