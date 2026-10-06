/**
 * Propostas comerciais: monta dados a partir do prospect + auditoria, renderiza HTML/texto/WhatsApp/PDF.
 * Template HTML com sintaxe mínima: {{var}}, {{#bloco}}…{{/bloco}} (lista ou condicional), {{.}} item.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import type { Audit, Proposal, ProposalInput, Prospect, Settings, Template } from '@shared/schemas';
import { escapeHtml, formatCurrency, formatDate } from '@shared/utils';
import { segmentLabel } from '@shared/segments';

export function defaultProposalData(
  prospect: Prospect,
  settings: Settings,
  audit?: Audit | null,
  previewId?: string | null,
): ProposalInput {
  const opps = audit?.opportunities ?? [];
  const seg = segmentLabel(prospect.segment);
  const price = prospect.potentialValue ?? settings.pricing.institutional;
  return {
    title: `Novo site para ${prospect.name}`,
    problems: opps.length
      ? opps.slice(0, 5).map((o) => o.title)
      : prospect.website
        ? [
            'Site difícil de usar no celular',
            'WhatsApp pouco acessível',
            'Visual desatualizado',
            'Sem otimização para o Google',
          ]
        : [
            'A empresa não aparece no Google quando alguém busca o serviço',
            'Clientes dependem só de indicação e redes sociais',
            'Sem canal direto de orçamento 24h',
          ],
    solution: `Um site profissional, rápido e feito para converter visitantes em contatos: visual premium alinhado ao segmento de ${seg.toLowerCase()}, botão de WhatsApp sempre visível, textos focados em venda e otimização para buscas locais em ${prospect.city ?? 'sua cidade'}.`,
    pages: [
      'Início (apresentação completa)',
      'Serviços',
      'Sobre a empresa',
      'Depoimentos',
      'Contato com WhatsApp e mapa',
    ],
    features: [
      'Design responsivo (celular, tablet e computador)',
      'Botão de WhatsApp flutuante e CTA fixo no mobile',
      'Formulário de contato com proteção anti-spam',
      'Otimização para Google (SEO local, sitemap, dados estruturados)',
      'Carregamento rápido e imagens otimizadas',
      'Certificado de segurança (HTTPS) e headers de proteção',
      'Hospedagem configurada e domínio apontado',
    ],
    deadlineDays: settings.pricing.defaultDeadlineDays,
    price,
    discount: 0,
    paymentTerms: settings.pricing.defaultPaymentTerms,
    maintenance: {
      enabled: true,
      monthlyPrice: settings.pricing.maintenanceMonthly,
      description: settings.maintenanceDescription,
    },
    notes: '',
    validDays: 7,
    template: 'classic',
    previewId: previewId ?? null,
    auditId: audit?.id ?? null,
    status: 'draft',
  };
}

function miniTemplate(body: string, data: Record<string, unknown>): string {
  // blocos
  body = body.replace(/\{\{#([a-z_0-9]+)\}\}([\s\S]*?)\{\{\/\1\}\}/gi, (_m, key: string, inner: string) => {
    const v = data[key];
    if (Array.isArray(v))
      return v.map((item) => inner.replace(/\{\{\.\}\}/g, escapeHtml(String(item)))).join('');
    if (v && v !== '0' && v !== 0) return inner;
    return '';
  });
  return body.replace(/\{\{([a-z_0-9]+)\}\}/gi, (_m, key: string) => {
    const v = data[key];
    if (v === undefined || v === null) return '';
    return typeof v === 'string' && key.startsWith('html_') ? v : escapeHtml(String(v));
  });
}

export function proposalVars(p: Proposal, prospect: Prospect, settings: Settings): Record<string, unknown> {
  const total = Math.max(0, p.price - (p.discount || 0));
  return {
    numero: String(p.number).padStart(3, '0'),
    data: formatDate(p.createdAt),
    empresa: prospect.name,
    cliente: prospect.contactName || prospect.name,
    cidade: prospect.city ?? '',
    site_atual: prospect.website ?? '',
    titulo: p.title,
    slogan: settings.slogan,
    agencia: settings.agencyName,
    whatsapp_agencia: settings.whatsapp,
    email_agencia: settings.email,
    assinatura: settings.signature,
    problemas: p.problems,
    solucao: p.solution,
    paginas: p.pages,
    funcionalidades: p.features,
    preco: formatCurrency(total, settings.currency, settings.locale),
    preco_cheio: formatCurrency(p.price, settings.currency, settings.locale),
    desconto: p.discount ? formatCurrency(p.discount, settings.currency, settings.locale) : '',
    prazo: p.deadlineDays,
    pagamento: p.paymentTerms,
    manutencao: p.maintenance?.enabled ? '1' : '',
    manutencao_preco: formatCurrency(p.maintenance?.monthlyPrice ?? 0, settings.currency, settings.locale),
    manutencao_descricao: p.maintenance?.description ?? '',
    observacoes: p.notes,
    validade: p.validDays,
  };
}

const PROPOSAL_CSS = `
*{box-sizing:border-box}body{margin:0;font-family:Inter,system-ui,-apple-system,sans-serif;color:#161616;background:#f5f4f0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.doc{max-width:860px;margin:0 auto;background:#fff;box-shadow:0 20px 60px -30px rgba(0,0,0,.25)}
section{padding:40px 56px;border-bottom:1px solid #ebe9e4}
.hero{background:#111;color:#fff;padding:72px 56px}.hero h1{font-size:44px;line-height:1.05;letter-spacing:-.03em;margin:12px 0 16px;font-weight:800}.hero em{font-style:normal;color:#d4ff2b}
.eyebrow{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#888;margin:0}.hero .eyebrow{color:#aaa}
.lead{font-size:18px;color:#bbb;margin:0;max-width:60ch}
h2{font-size:22px;letter-spacing:-.02em;margin:0 0 14px}h3{font-size:14px;letter-spacing:.1em;text-transform:uppercase;color:#777;margin:0 0 8px}
p{line-height:1.6;margin:0 0 10px}ul{margin:0;padding-left:20px;line-height:1.7}
.problems li{margin-bottom:4px}.cols{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:20px}
.invest{background:#fafaf7}.price{display:flex;justify-content:space-between;align-items:baseline;padding:20px 0;border-top:2px solid #111;border-bottom:1px solid #ddd;margin-bottom:16px}.price strong{font-size:36px;letter-spacing:-.03em}
.muted{color:#777}.cta{background:#111;color:#fff;border:0}.cta h2{font-size:28px}.cta p{color:#bbb}.sign{margin-top:24px;color:#fff!important;font-weight:600}
.brand{padding:18px 56px;display:flex;justify-content:space-between;font-size:12px;color:#888;letter-spacing:.08em;text-transform:uppercase}
@media print{body{background:#fff}.doc{box-shadow:none;max-width:none}section{page-break-inside:avoid}}
@media (max-width:640px){section,.hero{padding:28px 22px}.hero h1{font-size:30px}.cols{grid-template-columns:1fr}.brand{padding:14px 22px}}
`;

export function renderProposalHtml(
  p: Proposal,
  prospect: Prospect,
  settings: Settings,
  template: Template,
): string {
  const vars = proposalVars(p, prospect, settings);
  const body = miniTemplate(template.body, vars);
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Proposta ${escapeHtml(String(vars.numero))} · ${escapeHtml(prospect.name)} · ${escapeHtml(settings.agencyName)}</title><style>${PROPOSAL_CSS}</style></head><body><div class="doc"><div class="brand"><span>${escapeHtml(settings.agencyName)}</span><span>${escapeHtml(settings.slogan)}</span></div>${body}</div></body></html>`;
}

export function renderProposalText(p: Proposal, prospect: Prospect, settings: Settings): string {
  const v = proposalVars(p, prospect, settings);
  const lines = [
    `PROPOSTA Nº ${v.numero} — ${settings.agencyName}`,
    `${p.title}`,
    `Data: ${v.data}`,
    '',
    'O QUE ENCONTRAMOS',
    ...p.problems.map((x) => `- ${x}`),
    '',
    'A SOLUÇÃO',
    p.solution,
    '',
    'PÁGINAS',
    ...p.pages.map((x) => `- ${x}`),
    '',
    'FUNCIONALIDADES',
    ...p.features.map((x) => `- ${x}`),
    '',
    'INVESTIMENTO',
    `Site completo: ${v.preco}${p.discount ? ` (desconto de ${v.desconto} já aplicado)` : ''}`,
    `Prazo: até ${p.deadlineDays} dias úteis após a aprovação`,
    `Pagamento: ${p.paymentTerms}`,
    p.maintenance?.enabled
      ? `Manutenção (opcional): ${v.manutencao_preco}/mês — ${p.maintenance.description}`
      : '',
    p.notes ? `\nOBSERVAÇÕES\n${p.notes}` : '',
    '',
    `Validade: ${p.validDays} dias.`,
    `${settings.signature}`,
    `${settings.agencyName} · ${settings.whatsapp} · ${settings.email}`,
  ];
  return lines
    .filter((l) => l !== undefined)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function renderProposalWhatsapp(
  p: Proposal,
  prospect: Prospect,
  settings: Settings,
  link?: string,
): string {
  const v = proposalVars(p, prospect, settings);
  const first = (prospect.contactName || prospect.name).split(' ')[0];
  return [
    `${first}, segue a proposta do novo site da *${prospect.name}*:`,
    '',
    `✅ ${p.pages.length} páginas: ${p.pages
      .slice(0, 3)
      .map((x) => x.split(' (')[0])
      .join(', ')}${p.pages.length > 3 ? ' e mais' : ''}`,
    `✅ ${p.features
      .slice(0, 3)
      .map((f) => f.split(' (')[0])
      .join(', ')}`,
    `⏱️ Pronto em até ${p.deadlineDays} dias úteis`,
    `💰 Investimento: *${v.preco}*`,
    `💳 ${p.paymentTerms}`,
    p.maintenance?.enabled ? `🔧 Manutenção opcional: ${v.manutencao_preco}/mês` : '',
    link ? `\n📄 Proposta completa: ${link}` : '',
    '',
    `Válida por ${p.validDays} dias. Qualquer dúvida é só chamar!`,
  ]
    .filter((l) => l !== '')
    .join('\n');
}

export async function renderProposalPdf(html: string, outFile: string): Promise<string> {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: outFile,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
  } finally {
    await browser.close();
  }
  return outFile;
}
