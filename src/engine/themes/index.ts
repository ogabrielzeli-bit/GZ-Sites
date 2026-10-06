/**
 * Temas base do GZ Design System. Cada tema é uma direção de arte completa:
 * paleta, tipografia, raio, textura, estilo de botão, ritmo vertical e tratamento de imagem.
 * As seções leem as variáveis CSS; o tema decide a personalidade.
 */
import type { ThemeId } from '@shared/site-config';
import type { RadiusKey, SectionSpacing } from '../tokens';

export interface ThemeFont {
  /** nome da família (Google Fonts) */
  family: string;
  /** pesos a carregar */
  weights: number[];
  /** fallback */
  fallback: string;
}

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
  mode: 'dark' | 'light';
  colors: {
    bg: string;
    bgAlt: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
    accent: string;
    accentContrast: string;
    accent2: string;
  };
  fonts: { display: ThemeFont; body: ThemeFont };
  radius: RadiusKey;
  heading: {
    weight: number;
    transform: 'none' | 'uppercase';
    tracking: 'tight' | 'normal' | 'wide' | 'wider';
    lineHeight: 'tight' | 'snug';
    /** itálico em palavras destacadas (editorial/luxury) */
    italicAccent: boolean;
  };
  button: 'solid' | 'outline' | 'pill' | 'block' | 'underline';
  sectionSpacing: SectionSpacing;
  texture: 'none' | 'noise' | 'grid' | 'stripes' | 'carbon' | 'paper' | 'dots';
  imageTreatment: 'none' | 'duotone' | 'grayscale' | 'warm' | 'contrast';
  /** estilo dos cards (bordas, fundo) */
  card: 'flat' | 'bordered' | 'elevated' | 'glass' | 'none';
  /** seção hero sugerida */
  heroDefault: 'hero' | 'hero-split' | 'hero-fullscreen';
  /** paleta sugerida para placeholders */
  placeholderPalette: string[];
}

const inter: ThemeFont = { family: 'Inter', weights: [400, 500, 600], fallback: 'system-ui, sans-serif' };

export const THEMES: Record<ThemeId, Theme> = {
  'luxury-dark': {
    id: 'luxury-dark',
    name: 'Luxury Dark',
    description: 'Preto profundo, serifa elegante, dourado discreto. Para marcas que vendem exclusividade.',
    mode: 'dark',
    colors: {
      bg: '#0a0a0b',
      bgAlt: '#111113',
      surface: '#17171a',
      text: '#f2eee6',
      muted: '#9d978d',
      border: 'rgba(242,238,230,0.12)',
      accent: '#c8a75e',
      accentContrast: '#0a0a0b',
      accent2: '#e7d6ad',
    },
    fonts: {
      display: { family: 'Cormorant Garamond', weights: [500, 600], fallback: 'Georgia, serif' },
      body: inter,
    },
    radius: 'sm',
    heading: { weight: 500, transform: 'none', tracking: 'tight', lineHeight: 'tight', italicAccent: true },
    button: 'outline',
    sectionSpacing: 'generous',
    texture: 'noise',
    imageTreatment: 'warm',
    card: 'bordered',
    heroDefault: 'hero-fullscreen',
    placeholderPalette: ['#1a1712', '#3a2f1c', '#c8a75e', '#2b2520'],
  },
  'minimal-light': {
    id: 'minimal-light',
    name: 'Minimal Light',
    description: 'Branco, preto e muito espaço. Tipografia forte, sem ruído. Funciona para quase tudo.',
    mode: 'light',
    colors: {
      bg: '#ffffff',
      bgAlt: '#f6f6f4',
      surface: '#f1f1ee',
      text: '#101010',
      muted: '#6a6a66',
      border: 'rgba(16,16,16,0.1)',
      accent: '#101010',
      accentContrast: '#ffffff',
      accent2: '#2f5bff',
    },
    fonts: {
      display: { family: 'Manrope', weights: [600, 800], fallback: 'system-ui, sans-serif' },
      body: inter,
    },
    radius: 'md',
    heading: { weight: 800, transform: 'none', tracking: 'tight', lineHeight: 'tight', italicAccent: false },
    button: 'pill',
    sectionSpacing: 'normal',
    texture: 'none',
    imageTreatment: 'none',
    card: 'flat',
    heroDefault: 'hero',
    placeholderPalette: ['#e9e9e4', '#cfcfc8', '#2f5bff', '#101010'],
  },
  industrial: {
    id: 'industrial',
    name: 'Industrial',
    description: 'Grafite, laranja de segurança, condensada em caixa alta. Peso, estrutura e força.',
    mode: 'dark',
    colors: {
      bg: '#131313',
      bgAlt: '#1a1a1a',
      surface: '#202020',
      text: '#ececea',
      muted: '#9a9a96',
      border: 'rgba(236,236,234,0.14)',
      accent: '#ff5a1f',
      accentContrast: '#131313',
      accent2: '#ffd166',
    },
    fonts: {
      display: { family: 'Oswald', weights: [500, 700], fallback: 'Impact, sans-serif' },
      body: { family: 'Barlow', weights: [400, 500, 600], fallback: 'system-ui, sans-serif' },
    },
    radius: 'none',
    heading: {
      weight: 700,
      transform: 'uppercase',
      tracking: 'normal',
      lineHeight: 'tight',
      italicAccent: false,
    },
    button: 'block',
    sectionSpacing: 'normal',
    texture: 'stripes',
    imageTreatment: 'contrast',
    card: 'bordered',
    heroDefault: 'hero-split',
    placeholderPalette: ['#1f1f1f', '#3b3b3b', '#ff5a1f', '#2a2a2a'],
  },
  editorial: {
    id: 'editorial',
    name: 'Editorial',
    description: 'Papel, serifa clássica, colunas e filetes. Parece uma revista de arquitetura.',
    mode: 'light',
    colors: {
      bg: '#faf7f1',
      bgAlt: '#f2ede3',
      surface: '#ffffff',
      text: '#1b1a17',
      muted: '#6f6a60',
      border: 'rgba(27,26,23,0.14)',
      accent: '#b5342a',
      accentContrast: '#faf7f1',
      accent2: '#1b1a17',
    },
    fonts: {
      display: { family: 'Playfair Display', weights: [500, 700], fallback: 'Georgia, serif' },
      body: { family: 'Source Serif 4', weights: [400, 600], fallback: 'Georgia, serif' },
    },
    radius: 'none',
    heading: { weight: 500, transform: 'none', tracking: 'tight', lineHeight: 'tight', italicAccent: true },
    button: 'underline',
    sectionSpacing: 'generous',
    texture: 'paper',
    imageTreatment: 'none',
    card: 'none',
    heroDefault: 'hero-split',
    placeholderPalette: ['#e8e1d3', '#c9bfa9', '#b5342a', '#1b1a17'],
  },
  automotive: {
    id: 'automotive',
    name: 'Automotive',
    description: 'Preto carbono, vermelho, cortes diagonais e tipografia técnica. Velocidade e precisão.',
    mode: 'dark',
    colors: {
      bg: '#0c0e11',
      bgAlt: '#13161b',
      surface: '#1a1e24',
      text: '#f3f5f8',
      muted: '#98a0ab',
      border: 'rgba(243,245,248,0.12)',
      accent: '#e3191c',
      accentContrast: '#ffffff',
      accent2: '#2fd6ff',
    },
    fonts: {
      display: { family: 'Chakra Petch', weights: [600, 700], fallback: 'system-ui, sans-serif' },
      body: inter,
    },
    radius: 'sm',
    heading: {
      weight: 700,
      transform: 'uppercase',
      tracking: 'normal',
      lineHeight: 'tight',
      italicAccent: false,
    },
    button: 'solid',
    sectionSpacing: 'normal',
    texture: 'carbon',
    imageTreatment: 'contrast',
    card: 'glass',
    heroDefault: 'hero-fullscreen',
    placeholderPalette: ['#15181d', '#2a2f37', '#e3191c', '#1f242b'],
  },
  architecture: {
    id: 'architecture',
    name: 'Architecture',
    description: 'Monocromático, grid rígido, pesos leves e caixa alta espaçada. Silêncio e proporção.',
    mode: 'light',
    colors: {
      bg: '#f4f3f0',
      bgAlt: '#ebe9e4',
      surface: '#ffffff',
      text: '#1c1c1a',
      muted: '#75736d',
      border: 'rgba(28,28,26,0.16)',
      accent: '#1c1c1a',
      accentContrast: '#f4f3f0',
      accent2: '#8a7f6a',
    },
    fonts: {
      display: { family: 'Jost', weights: [300, 400, 500], fallback: 'system-ui, sans-serif' },
      body: { family: 'Jost', weights: [300, 400, 500], fallback: 'system-ui, sans-serif' },
    },
    radius: 'none',
    heading: {
      weight: 300,
      transform: 'uppercase',
      tracking: 'wider',
      lineHeight: 'snug',
      italicAccent: false,
    },
    button: 'underline',
    sectionSpacing: 'generous',
    texture: 'grid',
    imageTreatment: 'grayscale',
    card: 'none',
    heroDefault: 'hero-fullscreen',
    placeholderPalette: ['#d9d6cf', '#b9b5ab', '#8a7f6a', '#1c1c1a'],
  },
  'medical-clean': {
    id: 'medical-clean',
    name: 'Medical Clean',
    description: 'Branco, azul calmo, cantos suaves e muito ar. Transmite confiança e cuidado.',
    mode: 'light',
    colors: {
      bg: '#ffffff',
      bgAlt: '#f1f7fb',
      surface: '#ffffff',
      text: '#0f2238',
      muted: '#5b6b7c',
      border: 'rgba(15,34,56,0.1)',
      accent: '#0e8fd6',
      accentContrast: '#ffffff',
      accent2: '#22bfa4',
    },
    fonts: {
      display: { family: 'Plus Jakarta Sans', weights: [600, 700], fallback: 'system-ui, sans-serif' },
      body: inter,
    },
    radius: 'lg',
    heading: { weight: 700, transform: 'none', tracking: 'tight', lineHeight: 'snug', italicAccent: false },
    button: 'pill',
    sectionSpacing: 'normal',
    texture: 'none',
    imageTreatment: 'none',
    card: 'elevated',
    heroDefault: 'hero',
    placeholderPalette: ['#dbeefa', '#b6dcf3', '#0e8fd6', '#22bfa4'],
  },
  'local-business': {
    id: 'local-business',
    name: 'Local Business',
    description: 'Quente, direto e amigável. Botões grandes, WhatsApp em destaque, zero frescura.',
    mode: 'light',
    colors: {
      bg: '#fffcf7',
      bgAlt: '#fff3e3',
      surface: '#ffffff',
      text: '#23201b',
      muted: '#6e675d',
      border: 'rgba(35,32,27,0.12)',
      accent: '#e8550c',
      accentContrast: '#ffffff',
      accent2: '#25d366',
    },
    fonts: {
      display: { family: 'Nunito', weights: [700, 900], fallback: 'system-ui, sans-serif' },
      body: { family: 'Nunito', weights: [400, 600, 700], fallback: 'system-ui, sans-serif' },
    },
    radius: 'xl',
    heading: { weight: 900, transform: 'none', tracking: 'tight', lineHeight: 'snug', italicAccent: false },
    button: 'pill',
    sectionSpacing: 'compact',
    texture: 'dots',
    imageTreatment: 'warm',
    card: 'elevated',
    heroDefault: 'hero',
    placeholderPalette: ['#ffe4c8', '#ffc28a', '#e8550c', '#23201b'],
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'Ecommerce',
    description: 'Limpo, produto em primeiro lugar, etiquetas e preços claros. Pronto para vender.',
    mode: 'light',
    colors: {
      bg: '#ffffff',
      bgAlt: '#f5f5f7',
      surface: '#ffffff',
      text: '#111114',
      muted: '#66666e',
      border: 'rgba(17,17,20,0.1)',
      accent: '#5b2bff',
      accentContrast: '#ffffff',
      accent2: '#ff3d71',
    },
    fonts: {
      display: { family: 'Sora', weights: [600, 700], fallback: 'system-ui, sans-serif' },
      body: inter,
    },
    radius: 'md',
    heading: { weight: 700, transform: 'none', tracking: 'tight', lineHeight: 'snug', italicAccent: false },
    button: 'solid',
    sectionSpacing: 'compact',
    texture: 'none',
    imageTreatment: 'none',
    card: 'bordered',
    heroDefault: 'hero-split',
    placeholderPalette: ['#ece8ff', '#d4ccff', '#5b2bff', '#ff3d71'],
  },
  'high-contrast': {
    id: 'high-contrast',
    name: 'High Contrast Premium',
    description: 'Preto absoluto, branco e um ácido. Tipografia gigante e bordas duras. Impacto.',
    mode: 'dark',
    colors: {
      bg: '#000000',
      bgAlt: '#0d0d0d',
      surface: '#141414',
      text: '#ffffff',
      muted: '#9a9a9a',
      border: 'rgba(255,255,255,0.2)',
      accent: '#d4ff2b',
      accentContrast: '#000000',
      accent2: '#ffffff',
    },
    fonts: {
      display: { family: 'Syne', weights: [700, 800], fallback: 'system-ui, sans-serif' },
      body: { family: 'Archivo', weights: [400, 500, 600], fallback: 'system-ui, sans-serif' },
    },
    radius: 'none',
    heading: {
      weight: 800,
      transform: 'uppercase',
      tracking: 'tight',
      lineHeight: 'tight',
      italicAccent: false,
    },
    button: 'block',
    sectionSpacing: 'normal',
    texture: 'none',
    imageTreatment: 'grayscale',
    card: 'bordered',
    heroDefault: 'hero-fullscreen',
    placeholderPalette: ['#1a1a1a', '#333333', '#d4ff2b', '#ffffff'],
  },
};

export const THEME_LIST = Object.values(THEMES);

export function getTheme(id: string): Theme {
  return THEMES[id as ThemeId] ?? THEMES['minimal-light'];
}

/** URL do Google Fonts para as famílias do tema */
export function googleFontsUrl(theme: Theme, overrides?: { display?: string; body?: string }): string {
  const fams = new Map<string, Set<number>>();
  const add = (f: ThemeFont, override?: string) => {
    const fam = override || f.family;
    if (!fams.has(fam)) fams.set(fam, new Set());
    f.weights.forEach((w) => fams.get(fam)!.add(w));
  };
  add(theme.fonts.display, overrides?.display);
  add(theme.fonts.body, overrides?.body);
  const parts = Array.from(fams.entries()).map(
    ([fam, ws]) =>
      `family=${fam.replace(/ /g, '+')}:wght@${Array.from(ws)
        .sort((a, b) => a - b)
        .join(';')}`,
  );
  return `https://fonts.googleapis.com/css2?${parts.join('&')}&display=swap`;
}
