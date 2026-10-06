/**
 * Schemas Zod das entidades do GZ OS (validação de entrada da API e tipos compartilhados web/servidor).
 */
import { z } from 'zod';
import { SEGMENT_IDS } from './segments';
import { STAGE_IDS } from './stages';
import { THEME_IDS } from './site-config';
import { CreativityLevel, LocationSchema, ServiceInput, type BusinessDNA, type CreativeDirection, type PreviewMeta, type ProspectAsset, type PublishedPreview, type Research } from './v2';

const optStr = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .or(z.literal(''))
  .transform((v) => (v ? v : undefined));

export const ProspectInput = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(200),
  segment: z.enum(SEGMENT_IDS).default('servicos'),
  city: optStr,
  state: optStr,
  country: z.string().trim().max(100).default('Brasil'),
  instagram: optStr,
  website: optStr,
  whatsapp: optStr,
  phone: optStr,
  email: optStr,
  contactName: optStr,
  notes: z.string().max(20000).optional().default(''),
  links: z.array(z.object({ label: z.string().max(100), url: z.string().max(1000) })).default([]),
  leadSource: optStr,
  stage: z.enum(STAGE_IDS).default('lead'),
  potentialValue: z.number().nonnegative().nullable().optional(),
  closedValue: z.number().nonnegative().nullable().optional(),
  lastContactAt: z.string().nullable().optional(),
  nextFollowupAt: z.string().nullable().optional(),
  tags: z.array(z.string().max(50)).default([]),
  services: z.array(ServiceInput).default([]),
  differentials: z.array(z.string().max(200)).default([]),
  brandColors: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).default([]),
  locations: z.array(LocationSchema).default([]),
});
export type ProspectInput = z.infer<typeof ProspectInput>;

export const ProspectUpdate = ProspectInput.partial();

export interface Prospect {
  id: string;
  name: string;
  slug: string;
  segment: string;
  city?: string;
  state?: string;
  country: string;
  instagram?: string;
  website?: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  contactName?: string;
  notes: string;
  links: { label: string; url: string }[];
  leadSource?: string;
  stage: string;
  potentialValue: number | null;
  closedValue: number | null;
  lastContactAt: string | null;
  nextFollowupAt: string | null;
  tags: string[];
  logoPath: string | null;
  photos: ProspectAsset[];
  services: { title: string; description: string }[];
  differentials: string[];
  brandColors: string[];
  locations: import('./v2').Location[];
  research: Research | null;
  creative: { dna?: BusinessDNA; direction?: CreativeDirection; lastPreviewId?: string } | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------- Auditoria ----------------
export const AuditCategory = z.enum(['visual', 'mobile', 'performance', 'seo', 'conversion', 'security']);
export type AuditCategory = z.infer<typeof AuditCategory>;

export interface AuditScores {
  visual: number;
  mobile: number;
  performance: number;
  seo: number;
  conversion: number;
  security: number;
  overall: number;
}

export interface AuditOpportunity {
  id: string;
  title: string;
  detail: string;
  category: AuditCategory;
  severity: 'high' | 'medium' | 'low';
  /** impacto estimado na nota (usado para ordenar) */
  impact: number;
}

export interface AuditFinding {
  id: string;
  category: AuditCategory;
  status: 'pass' | 'warn' | 'fail' | 'info';
  title: string;
  detail?: string;
  value?: string | number | boolean | null;
}

export interface AuditReport {
  url: string;
  finalUrl: string;
  fetchedAt: string;
  durationMs: number;
  httpStatus: number | null;
  https: boolean;
  redirectedToHttps: boolean;
  headers: Record<string, string>;
  page: {
    title: string | null;
    description: string | null;
    h1: string[];
    headings: { tag: string; text: string }[];
    canonical: string | null;
    viewport: string | null;
    favicon: boolean;
    openGraph: Record<string, string>;
    structuredData: string[];
    lang: string | null;
    generator: string | null;
    wordCount: number;
    linksInternal: number;
    linksExternal: number;
    imagesTotal: number;
    imagesWithoutAlt: number;
    imagesLazy: number;
    imagesOversized: { src: string; natural: string; rendered: string; bytes?: number }[];
    forms: { fields: number; hasLabels: boolean; hasSubmit: boolean }[];
    fontsFamilies: number;
    hasTelLink: boolean;
    hasWhatsappLink: boolean;
    hasEmailLink: boolean;
    ctaCandidates: { text: string; href: string; visibleAboveFold: boolean }[];
    phoneVisibleAboveFold: boolean;
    whatsappVisibleAboveFold: boolean;
    ctaAboveFold: boolean;
    year: number | null;
    usesTables: boolean;
    legacySignals: string[];
    scriptsCount: number;
    inlineStylesCount: number;
    usesFlexOrGrid: boolean;
    hasHeroImage: boolean;
    textBlocksLong: number;
  };
  mobile: {
    horizontalOverflow: boolean;
    overflowWidth: number;
    viewportWidth: number;
    smallFontElements: number;
    smallTapTargets: number;
    hasMobileMenu: boolean;
    overlappingElements: number;
    clippedElements: number;
    smallestFontPx: number | null;
  };
  network: {
    requests: number;
    transferBytes: number;
    byType: Record<string, { count: number; bytes: number }>;
    heaviestImages: { url: string; bytes: number; type: string }[];
    mixedContent: string[];
    thirdPartyDomains: string[];
    unoptimizedImages: number;
  };
  console: { errors: string[]; warnings: number };
  security: {
    https: boolean;
    hsts: boolean;
    csp: boolean;
    xFrameOptions: boolean;
    xContentTypeOptions: boolean;
    referrerPolicy: boolean;
    permissionsPolicy: boolean;
    mixedContent: number;
    exposedSecrets: string[];
    serverHeader: string | null;
    poweredBy: string | null;
  };
  seoFiles: { robots: boolean; sitemap: boolean; robotsBlocksAll: boolean };
  lighthouse: {
    ran: boolean;
    error?: string;
    performance?: number;
    accessibility?: number;
    bestPractices?: number;
    seo?: number;
    lcp?: number;
    cls?: number;
    tbt?: number;
    inp?: number;
    fcp?: number;
    speedIndex?: number;
    ttfb?: number;
  };
  findings: AuditFinding[];
  scores: AuditScores;
  opportunities: AuditOpportunity[];
}

export interface Audit {
  id: string;
  prospectId: string;
  url: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  scores: AuditScores | null;
  report: AuditReport | null;
  screenshots: { device: string; path: string; width: number; height: number }[];
  opportunities: AuditOpportunity[];
  error: string | null;
  createdAt: string;
  finishedAt: string | null;
}

// ---------------- Prévia ----------------
export const PreviewInput = z.object({
  theme: z.enum(THEME_IDS).optional(),
  /** direção criativa escolhida (id) ou 'auto' */
  directionId: z.string().optional(),
  seed: z.number().int().optional(),
  locks: z.array(z.string()).optional(),
  /** variação de layout do preset (0..n) — troca a composição das seções */
  layoutVariant: z.number().int().min(0).max(9).optional(),
  /** configuração completa para regenerar com ajustes do usuário */
  config: z.unknown().optional(),
  notes: z.string().max(5000).optional(),
});
export interface Preview {
  id: string;
  prospectId: string;
  theme: string;
  segment: string;
  layoutVariant: number;
  config: unknown;
  path: string;
  url: string;
  notes: string;
  meta: PreviewMeta;
  published: PublishedPreview | null;
  createdAt: string;
}

// ---------------- Proposta ----------------
export const ProposalInput = z.object({
  title: z.string().max(200).optional(),
  problems: z.array(z.string().max(500)).default([]),
  solution: z.string().max(5000).default(''),
  pages: z.array(z.string().max(200)).default([]),
  features: z.array(z.string().max(300)).default([]),
  deadlineDays: z.number().int().positive().default(15),
  price: z.number().nonnegative().default(0),
  discount: z.number().nonnegative().default(0),
  paymentTerms: z.string().max(1000).default(''),
  maintenance: z
    .object({
      enabled: z.boolean().default(true),
      monthlyPrice: z.number().nonnegative().default(0),
      description: z.string().max(1000).default(''),
    })
    .default({ enabled: true, monthlyPrice: 0, description: '' }),
  notes: z.string().max(5000).default(''),
  validDays: z.number().int().positive().default(7),
  template: z.string().default('classic'),
  previewId: z.string().nullable().optional(),
  auditId: z.string().nullable().optional(),
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected']).default('draft'),
});
export type ProposalInput = z.infer<typeof ProposalInput>;
export interface Proposal extends ProposalInput {
  id: string;
  prospectId: string;
  number: number;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
}

// ---------------- Projeto (Site Factory) ----------------
export const ProjectInput = z.object({
  name: z.string().trim().min(1).max(200),
  domain: optStr,
  segment: z.string().optional(),
  config: z.unknown().optional(),
  notes: z.string().max(5000).optional(),
});
export interface ProjectQaSummary {
  status: 'pass' | 'warning' | 'fail';
  ranAt: string;
  reportPath: string;
  counts: { pass: number; warning: number; fail: number };
  lighthouse?: { performance?: number; accessibility?: number; seo?: number; bestPractices?: number };
}
export interface Project {
  id: string;
  prospectId: string | null;
  name: string;
  slug: string;
  domain?: string;
  config: unknown;
  path: string;
  status: 'draft' | 'built' | 'qa-pass' | 'qa-warning' | 'qa-fail' | 'exported';
  lastBuildAt: string | null;
  lastQa: ProjectQaSummary | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// ---------------- Tarefas ----------------
export const TaskInput = z.object({
  prospectId: z.string().nullable().optional(),
  title: z.string().trim().min(1).max(300),
  dueAt: z.string().nullable().optional(),
  done: z.boolean().default(false),
});
export interface Task {
  id: string;
  prospectId: string | null;
  prospectName?: string | null;
  title: string;
  dueAt: string | null;
  done: boolean;
  createdAt: string;
}

// ---------------- Histórico ----------------
export type ActivityType =
  | 'prospect.created'
  | 'prospect.updated'
  | 'prospect.stage'
  | 'prospect.price'
  | 'prospect.contact'
  | 'audit.started'
  | 'audit.done'
  | 'audit.failed'
  | 'preview.created'
  | 'proposal.created'
  | 'proposal.updated'
  | 'proposal.sent'
  | 'client.closed'
  | 'project.created'
  | 'project.built'
  | 'qa.ran'
  | 'autofix.ran'
  | 'deploy.prepared'
  | 'note'
  | 'message.generated'
  | 'research.done'
  | 'preview.published'
  | 'video.optimized';
export interface Activity {
  id: string;
  prospectId: string | null;
  type: ActivityType;
  description: string;
  data: Record<string, unknown>;
  createdAt: string;
}

// ---------------- Templates ----------------
export const TemplateKind = z.enum(['message', 'proposal']);
export const TemplateInput = z.object({
  kind: TemplateKind,
  key: z.string().regex(/^[a-z0-9\-_.]+$/),
  name: z.string().min(1).max(200),
  body: z.string().max(50000),
  category: z.string().max(100).optional(),
  sortOrder: z.number().int().optional(),
});
export interface Template {
  id: string;
  kind: 'message' | 'proposal';
  key: string;
  name: string;
  body: string;
  category: string;
  sortOrder: number;
  updatedAt: string;
}

// ---------------- Configurações ----------------
export const SettingsSchema = z.object({
  agencyName: z.string().default('GZ Sites'),
  slogan: z.string().default('Sua loja fecha. Seu site não.'),
  logoPath: z.string().nullable().default(null),
  whatsapp: z.string().default(''),
  email: z.string().default(''),
  website: z.string().default(''),
  instagram: z.string().default(''),
  ownerName: z.string().default(''),
  signature: z.string().default('Equipe GZ Sites'),
  currency: z.string().default('BRL'),
  locale: z.string().default('pt-BR'),
  pricing: z
    .object({
      landingPage: z.number().default(1500),
      institutional: z.number().default(2500),
      premium: z.number().default(4500),
      ecommerce: z.number().default(6500),
      maintenanceMonthly: z.number().default(150),
      hostingMonthly: z.number().default(0),
      defaultDeadlineDays: z.number().int().default(15),
      defaultPaymentTerms: z.string().default('50% na aprovação da proposta e 50% na entrega do site.'),
    })
    .default({
      landingPage: 1500,
      institutional: 2500,
      premium: 4500,
      ecommerce: 6500,
      maintenanceMonthly: 150,
      hostingMonthly: 0,
      defaultDeadlineDays: 15,
      defaultPaymentTerms: '50% na aprovação da proposta e 50% na entrega do site.',
    }),
  maintenanceDescription: z
    .string()
    .default('Atualizações de conteúdo, monitoramento, backups, correções e suporte via WhatsApp.'),
  defaultTheme: z.enum(THEME_IDS).default('minimal-light'),
  dashboardTheme: z.enum(['dark', 'light']).default('dark'),
  creativity: CreativityLevel.default('equilibrado'),
  ai: z
    .object({
      /** provider ativo (none = sem IA). As chaves ficam no .env, nunca aqui. */
      provider: z.enum(['none', 'openai', 'anthropic', 'openai-compatible']).default('none'),
      model: z.string().default(''),
      baseUrl: z.string().default(''),
    })
    .default({ provider: 'none', model: '', baseUrl: '' }),
  audit: z
    .object({
      lighthouse: z.boolean().default(true),
      timeoutMs: z.number().int().default(45000),
    })
    .default({ lighthouse: true, timeoutMs: 45000 }),
});
export type Settings = z.infer<typeof SettingsSchema>;
export const SettingsUpdate = SettingsSchema.partial();

// ---------------- Dashboard ----------------
export interface DashboardData {
  counts: {
    prospects: number;
    audited: number;
    previews: number;
    proposalsSent: number;
    closed: number;
    inProduction: number;
    delivered: number;
    tasksPending: number;
  };
  pipelineValue: number;
  soldValue: number;
  byStage: { stage: string; count: number; value: number }[];
  recentActivity: Activity[];
  tasks: Task[];
  followups: { id: string; name: string; nextFollowupAt: string; stage: string }[];
}
