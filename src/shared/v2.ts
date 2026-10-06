/**
 * Tipos e schemas do GZ OS V2 — Adaptive Creative Engine.
 * BusinessDNA, pesquisa de fontes públicas, direção criativa, assets analisados, unidades, publicação.
 */
import { z } from 'zod';

// ---------- Assets ----------
export interface ImageAnalysis {
  width: number;
  height: number;
  aspect: number;
  orientation: 'landscape' | 'portrait' | 'square';
  dominantColors: string[];
  luminance: number; // 0..1
  contrast: number; // 0..1 (desvio padrão normalizado)
  hasAlpha: boolean;
  quality: 'low' | 'medium' | 'high';
  heroScore: number; // 0..100
  galleryScore: number; // 0..100
}

export interface VideoAnalysis {
  duration: number;
  width: number;
  height: number;
  aspect: number;
  bytes: number;
  codec?: string;
  sizeWarning?: string;
  optimized?: string; // caminho público do webm otimizado
}

export const AssetRole = z.enum(['auto', 'hero', 'gallery', 'background', 'none']);
export type AssetRole = z.infer<typeof AssetRole>;

export interface ProspectAsset {
  path: string;
  name: string;
  kind?: 'image' | 'video';
  role?: AssetRole;
  width?: number;
  height?: number;
  thumb?: string;
  poster?: string;
  bytes?: number;
  analysis?: ImageAnalysis | VideoAnalysis;
  variants?: { width: number; path: string }[];
}

// ---------- Unidades ----------
export const LocationSchema = z.object({
  name: z.string().max(120).default(''),
  address: z.string().max(300).default(''),
  city: z.string().max(100).default(''),
  state: z.string().max(10).default(''),
  phone: z.string().max(40).default(''),
  whatsapp: z.string().max(40).default(''),
  mapsUrl: z.string().max(500).default(''),
  openingHours: z.string().max(300).default(''),
});
export type Location = z.infer<typeof LocationSchema>;

export const ServiceInput = z.object({
  title: z.string().max(120),
  description: z.string().max(400).default(''),
});

// ---------- Pesquisa de fontes públicas ----------
export interface ResearchSource {
  type: 'website' | 'instagram' | 'maps' | 'link';
  url: string;
  ok: boolean;
  error?: string;
  found: string[]; // campos encontrados nesta fonte
}
export interface ResearchFacts {
  services: string[];
  positioning: string[]; // frases da marca (title, h1, description)
  language: string[]; // palavras/expressões recorrentes
  locations: Location[];
  hours: string[];
  differentials: string[];
  contentTypes: string[]; // "fotos de serviços", "vídeos", "depoimentos", "produtos"
  colors: string[];
  socials: string[];
  phones: string[];
}
export interface Research {
  researchedAt: string;
  sources: ResearchSource[];
  facts: ResearchFacts;
}

// ---------- BusinessDNA ----------
export type VisualPersonality =
  'premium' | 'performance' | 'editorial' | 'clean' | 'warm' | 'bold' | 'technical' | 'minimal';
export type MotionPersonality =
  'elegant' | 'performance' | 'technical' | 'editorial' | 'playful' | 'minimal' | 'cinematic';
export type ContentDensity = 'low' | 'medium' | 'high';
export type PremiumLevel = 'standard' | 'premium' | 'luxury';

export interface BusinessDNA {
  industry: string;
  subIndustry: string;
  audience: string;
  positioning: string;
  visualPersonality: VisualPersonality;
  tone: 'formal' | 'confiante' | 'acolhedor' | 'direto' | 'sofisticado' | 'tecnico';
  conversionGoal: 'orcamento' | 'agendamento' | 'reserva' | 'contato' | 'compra' | 'visita';
  keyServices: string[];
  priorityServices: string[];
  assetProfile: {
    logo: boolean;
    photos: number;
    strongPhotos: number;
    videos: number;
    quality: 'none' | 'low' | 'medium' | 'high';
  };
  brandColors: string[];
  brandMode: 'dark' | 'light' | 'unknown';
  recommendedTypography: { display: string; body: string };
  imageryStyle: string;
  motionPersonality: MotionPersonality;
  contentDensity: ContentDensity;
  pageRhythm: 'calm' | 'dynamic' | 'dense';
  premiumLevel: PremiumLevel;
  primaryCTA: string;
  secondaryCTA: string;
  heroPreference: ('video' | 'cinematic' | 'editorial' | 'split' | 'showcase' | 'layered' | 'conversion')[];
  signals: string[]; // explicações legíveis das decisões
  researchSummary?: { found: string[]; sources: { type: string; url: string; ok: boolean }[] };
}

// ---------- Direção criativa ----------
export interface CreativeDirection {
  id: string;
  name: string;
  description: string;
  theme: string;
  palette: { bg: string; accent: string; text: string; surface: string };
  typography: { display: string; body: string };
  hero: string; // família de hero
  motion: MotionPersonality;
  composition: string; // arquétipo de composição
  score: number;
  why: string[];
}

export const CreativityLevel = z.enum(['conservador', 'equilibrado', 'ousado']);
export type CreativityLevel = z.infer<typeof CreativityLevel>;

// ---------- Memória criativa / prévia ----------
export interface PreviewMeta {
  directionId?: string;
  direction?: CreativeDirection;
  dna?: BusinessDNA;
  seed?: number;
  /** caminhos JSON (ex.: "pages.0.sections.1.props.headline") preservados ao regenerar */
  locks?: string[];
  fingerprint?: string;
  creativeScore?: number;
  assetsUsed?: string[];
}
export interface PublishedPreview {
  provider: string;
  url: string;
  siteId?: string;
  deployId?: string;
  slug: string;
  publishedAt: string;
}
