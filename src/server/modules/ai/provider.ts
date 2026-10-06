/**
 * AIProvider — interface abstrata. Toda função tem fallback sem IA (NoAIProvider), então o GZ OS
 * funciona por completo com AI_PROVIDER=none. Chaves vêm SOMENTE do .env.
 */
export interface AIProvider {
  readonly id: string;
  readonly available: boolean;
  /** melhora um texto mantendo o sentido (retorna o original se não houver IA) */
  improveCopy(text: string, ctx: AIContext): Promise<string>;
  /** gera headlines alternativas */
  headlines(ctx: AIContext, count?: number): Promise<string[]>;
  /** adapta o tom (formal, amigável, direto…) */
  adaptTone(text: string, tone: Tone, ctx: AIContext): Promise<string>;
  /** resume uma auditoria em linguagem de vendas */
  summarizeAudit(audit: AuditSummaryInput, ctx: AIContext): Promise<string>;
  /** texto de proposta (solução) */
  proposalText(ctx: AIContext & { problems: string[]; pages: string[] }): Promise<string>;
  /** sugere estrutura de seções */
  suggestStructure(ctx: AIContext): Promise<string[]>;
}

export type Tone = 'formal' | 'amigavel' | 'direto' | 'premium' | 'descontraido';

export interface AIContext {
  company: string;
  segment: string;
  city?: string;
  differentials?: string[];
  notes?: string;
}

export interface AuditSummaryInput {
  url: string;
  scores: Record<string, number>;
  opportunities: { title: string; detail: string; severity: string }[];
}

/** Chamada genérica de chat usada pelos providers reais */
export interface ChatBackend {
  chat(system: string, user: string, opts?: { maxTokens?: number; json?: boolean }): Promise<string>;
}
