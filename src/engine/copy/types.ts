/**
 * Estrutura da biblioteca de copy por segmento.
 * Variáveis disponíveis nos textos: {empresa} {cidade} {anos} {regiao} {responsavel}
 * Frases que usam {anos} são descartadas quando a empresa não informou anos de experiência.
 * Use *asteriscos* para marcar a palavra destacada no título (vira <em class="accent">).
 */
import type { SegmentId } from '@shared/segments';
import type { ThemeId } from '@shared/site-config';
import type { PlaceholderStyle } from '../placeholders';

export type LayoutArchetype = 'impact' | 'local' | 'editorial' | 'catalog' | 'trust' | 'showcase';

export interface SegmentCopy {
  segment: SegmentId;
  /** temas preferidos, em ordem (o primeiro é o padrão) */
  themes: ThemeId[];
  /** composições de página preferidas, em ordem */
  layouts: LayoutArchetype[];
  placeholderStyle: PlaceholderStyle;
  hero: { eyebrow: string[]; headline: string[]; sub: string[]; badges: string[] };
  cta: { primary: string[]; secondary: string[] };
  manifesto: string[];
  about: {
    eyebrow: string;
    title: string[];
    paragraphs: string[][];
    highlights: { title: string; text: string }[];
  };
  servicesHead: { eyebrow: string; title: string[]; intro: string[] };
  services: { title: string; description: string; icon: string; price?: string }[];
  benefitsHead: { eyebrow: string; title: string[]; intro: string[] };
  benefits: { title: string; description: string; icon: string }[];
  processHead: { eyebrow: string; title: string[]; intro: string[] };
  steps: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
  stats: { value: string; label: string; suffix?: string }[];
  testimonialsHead: { eyebrow: string; title: string[] };
  testimonials: { quote: string; author: string; role?: string; rating?: number }[];
  projectsHead: { eyebrow: string; title: string[]; intro: string[] };
  projects: { title: string; category: string; description: string }[];
  finalCta: { eyebrow: string; title: string[]; text: string[] };
  contactIntro: string[];
  marquee: string[];
  keywords: string[];
  whatsappMessage: string;
  comparison?: {
    title: string;
    left: { title: string; items: string[] };
    right: { title: string; items: string[] };
  };
  /** descrição meta (SEO) */
  seoDescription: string[];
}
