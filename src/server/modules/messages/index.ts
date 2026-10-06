/**
 * Gerador de mensagens: template + dados do prospect/auditoria/proposta → texto natural.
 */
import type { Audit, Preview, Proposal, Prospect, Settings, Template } from '@shared/schemas';
import { segmentLabel } from '@shared/segments';
import { formatCurrency } from '@shared/utils';

export interface MessageContext {
  prospect: Prospect;
  settings: Settings;
  audit?: Audit | null;
  preview?: Preview | null;
  proposal?: Proposal | null;
  baseUrl?: string;
}

function saudacao(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

function firstName(name?: string): string {
  return (name || '').trim().split(' ')[0] || '';
}

export function buildMessageVars(c: MessageContext): Record<string, string> {
  const p = c.prospect;
  const s = c.settings;
  const opps = c.audit?.opportunities ?? [];
  const base = c.baseUrl ?? '';
  const nome = firstName(p.contactName) || p.name;
  const price = c.proposal?.price ?? p.potentialValue ?? s.pricing.institutional;
  return {
    saudacao: saudacao(),
    nome,
    responsavel: nome,
    empresa: p.name,
    cidade: p.city || 'sua cidade',
    segmento: segmentLabel(p.segment).toLowerCase(),
    site_atual: p.website || '',
    agencia: s.agencyName,
    responsavel_agencia: s.ownerName || s.agencyName,
    apresentacao: s.ownerName ? `Me chamo ${s.ownerName}, da ${s.agencyName}` : `Sou da ${s.agencyName}`,
    assinatura: s.signature,
    whatsapp_agencia: s.whatsapp,
    email_agencia: s.email,
    nota: c.audit?.scores ? String(c.audit.scores.overall) : '—',
    problema1: opps[0]?.title ?? 'Site difícil de usar no celular',
    problema2: opps[1]?.title ?? 'WhatsApp pouco acessível',
    problema3: opps[2]?.title ?? 'Visual desatualizado',
    link_previa: c.preview ? `${base}${c.preview.url}` : '[link da prévia]',
    link_proposta: c.proposal ? `${base}/api/proposals/${c.proposal.id}/html` : '[link da proposta]',
    preco: formatCurrency(price, s.currency, s.locale),
    prazo: String(c.proposal?.deadlineDays ?? s.pricing.defaultDeadlineDays),
    pagamento: c.proposal?.paymentTerms || s.pricing.defaultPaymentTerms,
    manutencao: formatCurrency(
      c.proposal?.maintenance?.monthlyPrice ?? s.pricing.maintenanceMonthly,
      s.currency,
      s.locale,
    ),
  };
}

export function renderTemplate(body: string, vars: Record<string, string>): string {
  return body
    .replace(/\{([a-z_0-9]+)\}/gi, (m, k: string) => (k in vars ? vars[k] : m))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function renderMessage(template: Template, c: MessageContext): string {
  return renderTemplate(template.body, buildMessageVars(c));
}
