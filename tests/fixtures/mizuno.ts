/**
 * Fixture de TESTE — "Mizuno Estética Automotiva" (fictícia). Só para testes automatizados;
 * nunca inserir como prospect real.
 */
import type { Location, ProspectAsset } from '../../src/shared/v2';

const loc = (l: Partial<Location>): Location => ({
  name: '',
  address: '',
  city: '',
  state: '',
  phone: '',
  whatsapp: '',
  mapsUrl: '',
  openingHours: '',
  ...l,
});

export const MIZUNO = {
  name: 'Mizuno Estética Automotiva',
  segment: 'oficina' as const,
  city: 'Campinas',
  state: 'SP',
  whatsapp: '19999990000',
  contactName: 'Rafael',
  notes: 'estética automotiva premium: polimento técnico, PPF, vitrificação cerâmica',
  services: [
    { title: 'Polimento técnico', description: 'Remove riscos e devolve o brilho.' },
    { title: 'Vitrificação cerâmica' },
    { title: 'PPF' },
    { title: 'Higienização interna' },
  ] as { title: string; description?: string }[],
  differentials: ['Agendamento com hora marcada', 'Garantia de 12 meses'] as string[],
  locations: [
    loc({
      name: 'Centro',
      address: 'Rua Barão de Jaguara, 100',
      city: 'Campinas',
      state: 'SP',
      whatsapp: '19999990000',
      openingHours: 'seg–sex 8h–18h',
    }),
    loc({ name: 'Cambuí', address: 'Rua Coronel Quirino, 200', city: 'Campinas', state: 'SP' }),
  ],
};

export const MIZUNO_ASSETS: ProspectAsset[] = [
  {
    path: '/files/uploads/mizuno/video/hero.mp4',
    name: 'hero.mp4',
    kind: 'video',
    role: 'auto',
    width: 1920,
    height: 1080,
    poster: '/files/uploads/mizuno/video/hero-poster.webp',
    analysis: { duration: 12, width: 1920, height: 1080, aspect: 1.78, bytes: 4_000_000 },
  },
  {
    path: '/files/uploads/mizuno/fotos/a.webp',
    name: 'a.webp',
    kind: 'image',
    role: 'auto',
    width: 1600,
    height: 1000,
    analysis: {
      width: 1600,
      height: 1000,
      aspect: 1.6,
      orientation: 'landscape',
      dominantColors: ['#111111', '#d4a017'],
      luminance: 0.12,
      contrast: 0.7,
      quality: 'high',
      hasAlpha: false,
      heroScore: 0.9,
      galleryScore: 0.7,
    },
  },
  {
    path: '/files/uploads/mizuno/fotos/b.webp',
    name: 'b.webp',
    kind: 'image',
    role: 'auto',
    width: 1600,
    height: 1000,
    analysis: {
      width: 1600,
      height: 1000,
      aspect: 1.6,
      orientation: 'landscape',
      dominantColors: ['#222222'],
      luminance: 0.2,
      contrast: 0.5,
      quality: 'medium',
      hasAlpha: false,
      heroScore: 0.5,
      galleryScore: 0.8,
    },
  },
  {
    path: '/files/uploads/mizuno/fotos/c.webp',
    name: 'c.webp',
    kind: 'image',
    role: 'gallery',
    width: 1000,
    height: 1400,
  },
  {
    path: '/files/uploads/mizuno/fotos/d.webp',
    name: 'd.webp',
    kind: 'image',
    role: 'auto',
    width: 1600,
    height: 1000,
  },
  {
    path: '/files/uploads/mizuno/fotos/e.webp',
    name: 'e.webp',
    kind: 'image',
    role: 'auto',
    width: 1600,
    height: 1000,
  },
];
