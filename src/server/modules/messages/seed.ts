/**
 * Templates iniciais de mensagens (WhatsApp) e de proposta. Inseridos uma vez; o usuário edita pelo painel.
 * Variáveis: {nome} {empresa} {cidade} {agencia} {apresentacao} {responsavel_agencia} {assinatura} {whatsapp_agencia} {link_previa} {link_proposta}
 *            {preco} {prazo} {nota} {problema1} {problema2} {problema3} {segmento} {site_atual} {saudacao}
 */
import type { TemplateRepo } from '../../db/repos';

export const DEFAULT_MESSAGE_TEMPLATES = [
  {
    key: 'primeira-abordagem',
    name: 'Primeira abordagem',
    category: 'Prospecção',
    sortOrder: 1,
    body: `{saudacao}, {nome}! Tudo bem?

{apresentacao}. Estava pesquisando {segmento} em {cidade} e encontrei a {empresa}.

Dei uma olhada no site de vocês e fiz uma análise rápida: hoje ele está com nota {nota}/100 no nosso diagnóstico. Os pontos que mais pesam são:
• {problema1}
• {problema2}
• {problema3}

Isso costuma fazer o cliente desistir antes de chamar no WhatsApp.

Posso te mostrar, sem compromisso, como ficaria um site novo da {empresa}? Já tenho uma prévia pronta.`,
  },
  {
    key: 'primeira-abordagem-sem-site',
    name: 'Primeira abordagem (sem site)',
    category: 'Prospecção',
    sortOrder: 2,
    body: `{saudacao}, {nome}! Tudo bem?

{apresentacao}. Encontrei a {empresa} pelo Instagram e vi que vocês ainda não têm um site.

Hoje, quando alguém pesquisa "{segmento} em {cidade}" no Google, aparecem os concorrentes que têm site. Vocês ficam de fora dessa busca.

Montei uma prévia de como ficaria o site da {empresa}. Posso te mandar o link? Leva 1 minuto para ver no celular.`,
  },
  {
    key: 'follow-up',
    name: 'Follow-up',
    category: 'Prospecção',
    sortOrder: 3,
    body: `Oi, {nome}! Passando para saber se conseguiu ver a mensagem sobre o site da {empresa}.

Sei que a rotina é corrida. Se preferir, me diz um horário bom e eu te ligo rapidinho para explicar. Ou posso só mandar a prévia para você ver quando der.

{assinatura}`,
  },
  {
    key: 'enviar-previa',
    name: 'Enviar prévia',
    category: 'Apresentação',
    sortOrder: 4,
    body: `{nome}, ficou pronta a prévia do novo site da {empresa}:

{link_previa}

Abre no celular mesmo. Repara no botão de WhatsApp fixo, na velocidade e em como os serviços ficam claros logo de cara.

As fotos e textos são ilustrativos, a gente troca por material de vocês. O que achou?`,
  },
  {
    key: 'enviar-preco',
    name: 'Enviar preço',
    category: 'Negociação',
    sortOrder: 5,
    body: `Perfeito, {nome}. Segue como funciona:

• Site completo da {empresa}, como na prévia, com textos e fotos de vocês
• Pronto em até {prazo} dias úteis após a aprovação
• Investimento: {preco}
• Pagamento: {pagamento}
• Inclui domínio configurado, hospedagem segura e botão de WhatsApp em tudo que é lugar

Mandei a proposta completa aqui: {link_proposta}

Qualquer dúvida é só chamar. Fechando essa semana, já começo a montar.`,
  },
  {
    key: 'visualizou-nao-respondeu',
    name: 'Visualizou e não respondeu',
    category: 'Negociação',
    sortOrder: 6,
    body: `Oi, {nome}! Vi que você conseguiu abrir a prévia da {empresa}.

Ficou alguma dúvida ou algo que você mudaria? Posso ajustar cores, textos ou fotos antes de qualquer decisão. Sem compromisso.`,
  },
  {
    key: 'negociacao',
    name: 'Negociação',
    category: 'Negociação',
    sortOrder: 7,
    body: `Entendo, {nome}. Vamos achar um formato que caiba para a {empresa}.

Algumas opções:
1. Começar com uma versão mais enxuta (1 página) e crescer depois
2. Parcelar o investimento em mais vezes
3. Fechar agora com as condições de {preco} e eu incluo a manutenção dos 3 primeiros meses

Qual delas faz mais sentido para você?`,
  },
  {
    key: 'fechamento',
    name: 'Fechamento',
    category: 'Fechamento',
    sortOrder: 8,
    body: `Fechado, {nome}! Obrigado pela confiança. 🙌

Próximos passos:
1. Envio o link para o pagamento da primeira parte
2. Você me manda logo, fotos e os textos que já tiver (pode ser por aqui mesmo)
3. Em até {prazo} dias úteis o site da {empresa} está no ar

Qualquer coisa, estou por aqui. Vamos fazer um site que vende!`,
  },
  {
    key: 'pos-venda',
    name: 'Pós-venda',
    category: 'Pós-venda',
    sortOrder: 9,
    body: `Oi, {nome}! O site da {empresa} está no ar há algumas semanas. Como está sendo?

Se tiver qualquer ajuste, texto ou foto para trocar, é só me mandar. E se puder me indicar para algum amigo empresário, eu agradeço demais.

{assinatura}`,
  },
];

export const DEFAULT_PROPOSAL_TEMPLATES = [
  {
    key: 'classic',
    name: 'Clássica',
    category: 'Proposta',
    sortOrder: 1,
    body: `<!-- Template de proposta (HTML). Variáveis em {{chaves}} são preenchidas pelo GZ OS. Blocos: {{#problemas}}…{{/problemas}} -->
<section class="hero">
  <p class="eyebrow">Proposta nº {{numero}} · {{data}}</p>
  <h1>Novo site para <em>{{empresa}}</em></h1>
  <p class="lead">{{slogan}}</p>
</section>
<section>
  <h2>O que encontramos</h2>
  <p>Analisamos o cenário atual da {{empresa}}{{#site_atual}} e o site {{site_atual}}{{/site_atual}}. Os pontos que mais prejudicam novos clientes:</p>
  <ul class="problems">{{#problemas}}<li>{{.}}</li>{{/problemas}}</ul>
</section>
<section>
  <h2>A solução</h2>
  <p>{{solucao}}</p>
  <div class="cols">
    <div><h3>Páginas</h3><ul>{{#paginas}}<li>{{.}}</li>{{/paginas}}</ul></div>
    <div><h3>Funcionalidades</h3><ul>{{#funcionalidades}}<li>{{.}}</li>{{/funcionalidades}}</ul></div>
  </div>
</section>
<section class="invest">
  <h2>Investimento</h2>
  <div class="price"><span>Site completo</span><strong>{{preco}}</strong></div>
  {{#desconto}}<p class="muted">Desconto aplicado: {{desconto}}</p>{{/desconto}}
  <p><strong>Prazo:</strong> até {{prazo}} dias úteis após a aprovação.</p>
  <p><strong>Pagamento:</strong> {{pagamento}}</p>
  {{#manutencao}}<p><strong>Manutenção (opcional):</strong> {{manutencao_preco}}/mês — {{manutencao_descricao}}</p>{{/manutencao}}
</section>
{{#observacoes}}<section><h2>Observações</h2><p>{{observacoes}}</p></section>{{/observacoes}}
<section class="cta">
  <h2>Vamos começar?</h2>
  <p>Esta proposta é válida por {{validade}} dias. Para aprovar, basta responder no WhatsApp.</p>
  <p class="sign">{{assinatura}}<br>{{agencia}} · {{whatsapp_agencia}} · {{email_agencia}}</p>
</section>`,
  },
];

export function seedTemplates(repo: TemplateRepo) {
  for (const t of DEFAULT_MESSAGE_TEMPLATES) repo.seed({ kind: 'message', ...t });
  for (const t of DEFAULT_PROPOSAL_TEMPLATES) repo.seed({ kind: 'proposal', ...t });
}
