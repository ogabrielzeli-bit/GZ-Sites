# GZ OS

**Site Factory + Prospect Auditor + Sales OS da GZ Sites.**
_Sua loja fecha. Seu site não._

GZ OS é um sistema interno que cobre o ciclo inteiro: encontrar a empresa → cadastrar → auditar o site atual → gerar prévia de site novo → proposta → fechar → gerar o site final → QA → exportar/publicar na Netlify.

Tudo funciona **sem IA**. IA é opcional (providers OpenAI/Anthropic/compatível), com fallback determinístico para cada função.

---

## O que tem dentro

| Módulo | O que faz | Como |
| --- | --- | --- |
| Dashboard / Pipeline | KPIs, kanban arrastável (Lead → … → Entregue), tarefas, follow-ups | React + TanStack Query + dnd-kit |
| Prospects (CRM) | Ficha completa, etapa, valor, histórico, uploads de logo/fotos | SQLite (`node:sqlite`) |
| **Prospect Auditor** | Nota GZ 0–100 em Visual, Mobile, Performance, SEO, Conversão, Segurança + oportunidades + screenshots | Playwright + Lighthouse + regras (`score.ts`) |
| **Gerador de prévia** | Site demonstrativo completo em segundos, por segmento (20 presets), 10 temas, 6 composições | GZ Engine (sem IA) |
| **GZ Design System** | 35 seções com variantes, tokens, GSAP (reveal, parallax, pin, magnetic, press+spring, text reveal) | `src/engine` |
| Copy sem IA | Biblioteca de frases por nicho com variáveis `{empresa} {cidade} {anos}` | `src/engine/copy` |
| Propostas | Geradas da auditoria + preços padrão; HTML, PDF, texto, versão WhatsApp; templates editáveis | Playwright PDF |
| Mensagens | 9 modelos (abordagem, follow-up, prévia, preço, fechamento, pós-venda…), editáveis | templates + variáveis |
| **Site Factory** | Projeto real em `data/projects/<slug>` (config + assets + scripts), build para `dist/` | `src/server/modules/factory` |
| **QA automático** | Build, lint HTML, links, console, 5 viewports, overflow, imagens, botões, formulário, a11y, headers, Lighthouse → **GZ Quality Report** | `src/qa` |
| Auto-fix | Correções seguras (alt, meta, rel noopener, lazy, headers, âncoras, variantes, WhatsApp) | `src/qa/autofix.ts` |
| Deploy | `netlify.toml`, `_headers` (CSP, HSTS…), `_redirects`, ZIP para arrastar na Netlify ou deploy por API com token do usuário | `factory` |
| Backup | JSON (banco) ou ZIP (banco + arquivos), importação merge/replace | `backup.ts` |
| IA opcional | `AIProvider` com NoAI / OpenAI / Anthropic / compatível (Ollama, Groq…) | `src/server/modules/ai` |

Documentação: [ARCHITECTURE.md](ARCHITECTURE.md) · [DEVELOPMENT.md](DEVELOPMENT.md) · [DEPLOYMENT.md](DEPLOYMENT.md) · [SECURITY.md](SECURITY.md) · [SITE_FACTORY.md](SITE_FACTORY.md) · [AUDITOR.md](AUDITOR.md) · [AI_OPTIONAL.md](AI_OPTIONAL.md) · [TROUBLESHOOTING.md](TROUBLESHOOTING.md) · [GZ_OS_HANDOFF.md](GZ_OS_HANDOFF.md)

---

## INSTALAR

Requisitos: **Node.js ≥ 22.13** (usa o SQLite nativo do Node) e npm.

```bash
git clone <este-repositório> gz-os
cd gz-os
npm install
npx playwright install chromium      # navegador usado pelo auditor, QA, PDF e screenshots
cp .env.example .env                 # opcional; funciona sem .env
```

## RODAR

Desenvolvimento (API + dashboard com hot reload):

```bash
npm run dev
```

- Dashboard: **http://localhost:5173**
- API: http://localhost:4800

Produção local / hospedado:

```bash
npm run build      # compila runtime do engine + dashboard
npm start          # serve tudo em http://localhost:4800
```

Os dados ficam em `./data` (banco, uploads, auditorias, prévias, projetos). A pasta é ignorada pelo Git: atualizar o código nunca apaga seus prospects.

## CRIAR CLIENTE

No painel: **Novo Prospect** → informe só o que tiver (nome é o único obrigatório) → **Criar prospect**.

Pela API:

```bash
curl -X POST localhost:4800/api/prospects -H 'content-type: application/json' \
  -d '{"name":"Serralheria Dois Irmãos","segment":"serralheria","city":"Curitiba","whatsapp":"41999998888","website":"serralheria.com.br","instagram":"@serralheria"}'
```

## AUDITAR SITE

No painel: ficha do prospect → **Auditar site** (15–60 s). Resultado: Nota GZ, 6 notas por categoria, oportunidades, achados detalhados e screenshots desktop/tablet/mobile.

Pela linha de comando (sem precisar cadastrar):

```bash
npm run gz:audit -- https://site-do-cliente.com.br
npm run gz:audit -- https://site-do-cliente.com.br --no-lighthouse   # mais rápido
```

## GERAR PRÉVIA

No painel: **Gerar prévia** (abre em nova aba; link público em `/previews/<id>/`). Cada clique gera uma composição diferente; na aba Prévias você escolhe o tema e pode **Ajustar dados** (headline, serviços, WhatsApp ou o JSON completo).

CLI:

```bash
npm run gz:preview -- "Barbearia do Rei" barbearia Curitiba --theme=high-contrast --out=./minha-previa
npx serve ./minha-previa
```

## GERAR SITE

1. Mude o prospect para **Fechado** (ou clique **Fechar cliente**).
2. **Criar projeto** → informe domínio (opcional).
3. Na página do projeto: **Build site** → `data/projects/<slug>/dist/`.
4. Edite textos/seções em **Conteúdo & config** (`site.config.json`) e faça build de novo.

CLI: `npm run gz:build -- <slug>`

## RODAR QA

Painel: **Rodar QA** → aba **GZ Quality Report** (PASS / WARNING / FAIL) → **Corrigir automaticamente** para os itens com auto-fix.

CLI:

```bash
npm run gz:qa -- <slug>            # QA de um projeto
npm run gz:qa                      # QA do próprio GZ OS: typecheck + lint + testes + QA de um site gerado
```

## EXPORTAR

- **Exportar ZIP (Netlify)**: conteúdo do `dist/` pronto para arrastar.
- **Exportar projeto completo**: config + assets + engine + scripts (`npm install && npm run build` fora do GZ OS).

CLI: `npm run gz:export -- <slug>` ou `npm run gz:export -- <slug> --full`

## DEPLOY NETLIFY

**Sem token:** app.netlify.com → _Add new site_ → _Deploy manually_ → arraste o ZIP exportado (ou a pasta `dist/`).

**Com token (opcional):** botão **Publicar na Netlify** → cole um Personal Access Token (usado só naquela requisição) ou defina `NETLIFY_AUTH_TOKEN` no `.env`. Guarde o Site ID retornado para republicar no mesmo site.

Veja [DEPLOYMENT.md](DEPLOYMENT.md) para hospedar o próprio GZ OS.

---

## Comandos

| Comando | Função |
| --- | --- |
| `npm run dev` | API + dashboard (dev) |
| `npm run build` / `npm start` | produção |
| `npm run check` | typecheck + lint + testes unitários |
| `npm test` / `npm run test:e2e` | testes unitários / E2E (API real + Playwright) |
| `npm run gz -- <cmd>` | CLI: `migrate`, `build`, `qa`, `export`, `preview`, `audit`, `backup` |
| `npm run db:migrate` | aplica migrations |

## 100% sem IA

Cadastro, pipeline, auditoria, notas, oportunidades, screenshots, prévias, copy, temas, propostas, mensagens, projetos, build, QA, auto-fix, export, deploy, backup.

## Com IA opcional (fallback sem IA sempre existe)

Melhorar copy, headlines, adaptar tom de mensagens, resumir auditoria, texto da solução na proposta, sugerir estrutura. Configure em **Configurações → IA opcional** + chave no `.env`.

## Custos recorrentes

Nenhum obrigatório. Opcionais: hospedagem do GZ OS (se quiser acesso remoto), API de IA (se ligar), domínio/Netlify dos clientes (Netlify tem plano gratuito).
