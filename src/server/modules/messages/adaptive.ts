/**
 * Mensagens adaptativas (sem IA): o texto muda conforme o que realmente existe no prospect —
 * site auditado ou não, prévia gerada/publicada, proposta, unidades, vídeos, pesquisa pública.
 * Regra: curto, humano, nunca inventa fato. Só menciona o que está no banco.
 */
import type { Audit, Preview, Proposal, Prospect, Settings } from '@shared/schemas';
import { formatCurrency } from '@shared/utils';

export type AdaptiveKind =
  'primeira-abordagem' | 'enviar-previa' | 'follow-up' | 'enviar-preco' | 'fechamento';
export const ADAPTIVE_KINDS: { id: AdaptiveKind; label: string }[] = [
  { id: 'primeira-abordagem', label: 'Primeira abordagem' },
  { id: 'enviar-previa', label: 'Enviar prévia' },
  { id: 'follow-up', label: 'Follow-up' },
  { id: 'enviar-preco', label: 'Enviar preço' },
  { id: 'fechamento', label: 'Fechamento' },
];

export interface AdaptiveContext {
  prospect: Prospect;
  settings: Settings;
  audit?: Audit | null;
  preview?: Preview | null;
  proposal?: Proposal | null;
  baseUrl?: string;
  now?: Date;
}

const first = (n?: string) => (n || '').trim().split(' ')[0];
const greet = (d: Date) => (d.getHours() < 12 ? 'Bom dia' : d.getHours() < 18 ? 'Boa tarde' : 'Boa noite');

/** Facts the message may mention — each only if present in the data. */
function facts(c: AdaptiveContext) {
  const p = c.prospect;
  const audit = c.audit && c.audit.status === 'done' ? c.audit : null;
  const opps = audit?.opportunities?.slice(0, 2).map((o) => o.title.toLowerCase()) ?? [];
  const previewUrl = c.preview?.published?.url || (c.preview ? `${c.baseUrl ?? ''}${c.preview.url}` : '');
  const videos = p.photos.filter((a) => a.kind === 'video').length;
  const dna = c.preview?.meta?.dna ?? p.creative?.dna;
  const research = p.research;
  return {
    nome: first(p.contactName),
    empresa: p.name,
    cidade: p.city,
    hasSite: !!p.website,
    audit,
    opps,
    nota: audit?.scores?.overall,
    previewUrl,
    published: !!c.preview?.published,
    direction: c.preview?.meta?.direction?.name,
    units: p.locations.length,
    videos,
    services: (dna?.priorityServices?.length ? dna.priorityServices : p.services.map((s) => s.title)).slice(
      0,
      2,
    ),
    researchFound: research ? research.sources.filter((s) => s.ok).length : 0,
    proposal: c.proposal,
  };
}

export function composeMessage(kind: AdaptiveKind, c: AdaptiveContext): string {
  const f = facts(c);
  const s = c.settings;
  const d = c.now ?? new Date();
  const me = s.ownerName ? `${s.ownerName}, da ${s.agencyName}` : `da ${s.agencyName}`;
  const L: string[] = [];
  const svc = f.services.length ? ` com ${f.services.join(' e ').toLowerCase()}` : '';

  if (kind === 'primeira-abordagem') {
    L.push(`${greet(d)}${f.nome ? `, ${f.nome}` : ''}! Sou ${me}.`);
    if (f.hasSite && f.audit && f.opps.length)
      L.push(
        `Dei uma olhada no site da ${f.empresa} e notei dois pontos que podem estar custando cliente: ${f.opps.join(' e ')}.`,
      );
    else if (f.hasSite)
      L.push(
        `Vi o site da ${f.empresa} e acho que dá para deixar ele vendendo mais, principalmente no celular.`,
      );
    else
      L.push(
        `Procurei a ${f.empresa}${f.cidade ? ` em ${f.cidade}` : ''} e não encontrei um site — hoje muita gente decide por ali antes de chamar no WhatsApp.`,
      );
    if (f.previewUrl) L.push(`Montei uma prévia de como poderia ficar${svc}: ${f.previewUrl}`);
    else
      L.push(
        `Posso montar uma prévia sem compromisso${svc ? `, já mostrando ${f.services.join(' e ').toLowerCase()}` : ''}. Quer ver?`,
      );
  } else if (kind === 'enviar-previa') {
    L.push(
      `${f.nome ? `${f.nome}, ficou` : 'Ficou'} pronta a prévia da ${f.empresa}${f.direction ? ` (estilo ${f.direction.toLowerCase()})` : ''}:`,
    );
    L.push(f.previewUrl || '[gere uma prévia antes de enviar]');
    const extras: string[] = [];
    if (f.videos) extras.push(`usei ${f.videos === 1 ? 'o vídeo' : 'os vídeos'} que você mandou no topo`);
    if (f.units > 1) extras.push(`as ${f.units} unidades já aparecem com endereço e WhatsApp`);
    if (extras.length) L.push(`Detalhe: ${extras.join(' e ')}.`);
    L.push(
      f.published
        ? 'Abre direto no celular. Me diz o que mudaria.'
        : 'É só um rascunho: textos e fotos a gente ajusta juntos. O que achou?',
    );
  } else if (kind === 'follow-up') {
    L.push(
      `Oi${f.nome ? ` ${f.nome}` : ''}, tudo bem? Passando para saber se conseguiu ver ${f.previewUrl ? 'a prévia' : 'minha mensagem'}.`,
    );
    if (f.previewUrl) L.push(`Link de novo, para facilitar: ${f.previewUrl}`);
    L.push('Se quiser ajustar algo ou tiver dúvida, é só responder aqui.');
  } else if (kind === 'enviar-preco') {
    const price = f.proposal?.price ?? c.prospect.potentialValue ?? s.pricing.institutional;
    L.push(
      `${f.nome ? `${f.nome}, segue` : 'Segue'} o valor para o site da ${f.empresa}: ${formatCurrency(price, s.currency, s.locale)}.`,
    );
    L.push(
      `Entrega em até ${f.proposal?.deadlineDays ?? s.pricing.defaultDeadlineDays} dias, ${(f.proposal?.paymentTerms || s.pricing.defaultPaymentTerms).toLowerCase()}.`,
    );
    if (f.previewUrl) L.push(`O que você viu na prévia (${f.previewUrl}) já está incluso.`);
    L.push('Posso te mandar a proposta completa?');
  } else {
    L.push(
      `${f.nome ? `${f.nome}, para` : 'Para'} começar o site da ${f.empresa} é só me confirmar o "vamos" por aqui.`,
    );
    L.push(`Aí eu te passo os próximos passos${f.units > 1 ? ' e confirmo os dados das unidades' : ''}.`);
  }
  if (s.signature && kind !== 'follow-up') L.push(s.signature);
  return L.join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
