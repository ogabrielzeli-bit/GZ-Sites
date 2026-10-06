# GZ OS — Handoff para o próximo agente/desenvolvedor

Leia isto antes de mexer no código. Resume o que existe, como está organizado, as decisões tomadas e o que ainda vale fazer.

## 1. O que é

Sistema interno da GZ Sites (slogan: _Sua loja fecha. Seu site não._) que cobre prospecção → auditoria → prévia → proposta → fechamento → site final → QA → deploy. Uma app Node/TypeScript (Express + React), SQLite nativo, Playwright, Lighthouse, GSAP. **Sem dependência de IA em runtime** (ver `AI_OPTIONAL.md`).

## 2. Mapa rápido

```
src/shared     schemas Zod + tipos (fonte da verdade dos contratos API/engine)
src/engine     gerador de sites (tokens, temas, seções, copy, presets, render, runtime GSAP)
               V2: dna.ts (BusinessDNA), creative.ts (direções), compose.ts (composição adaptativa + locks), sections/v2.ts
src/server     API Express, SQLite, jobs, módulos (auditor, previews, factory, proposals, messages, uploads, backup, ai)
               V2: research.ts (pesquisa pública), creative.ts (fluxo), publish.ts (Netlify/mock), assets.ts (imagem/vídeo), messages/adaptive.ts
src/qa         QA automático + auto-fix + relatório (usado pelo painel e CLI); V2: creative.ts (Creative Quality Score)
src/cli        `npm run gz -- <cmd>`
src/web        dashboard React/Vite/Tailwind 4; V2: pages/Creative.tsx (direção, /preview/:id, assets, mensagens, unidades)
tests          vitest unit (58) + e2e (18, API real + Playwright); fixture de teste tests/fixtures/mizuno.ts (nunca inserir como real)
data/          dados do usuário (gitignored)
```

Documentos: `README.md` (uso), `CREATIVE_ENGINE.md` (V2: DNA, direções, vídeo, publicação, mensagens), `ARCHITECTURE.md`, `DEVELOPMENT.md` (como adicionar seção/tema/segmento/regra), `SITE_FACTORY.md`, `AUDITOR.md`, `SECURITY.md`, `DEPLOYMENT.md`, `TROUBLESHOOTING.md`, `AI_OPTIONAL.md`.

## 3. Comandos que importam

```bash
npm run dev            # dev (5173 + 4800)
npm run check          # typecheck + lint + unit  ← rode antes de commitar
npm run test:e2e       # fluxo completo pela API (~1 min)
npm run gz:qa          # QA do GZ OS inteiro (inclui Lighthouse em site gerado)
npm run build && npm start   # produção
```

## 4. Contratos centrais

- **`SiteConfig`** (`src/shared/site-config.ts`): tudo que um site é. Prévias e projetos armazenam esse JSON. Mudanças aqui afetam engine, API, painel e export — mantenha compatibilidade (defaults no Zod) ou crie migração de config.
- **`SectionDef`** (`src/engine/sections/types.ts`): `type`, `variants`, `props` (Zod), `render(props, ctx, variant)`. `RenderContext` dá `config`, `theme`, `assets.image()` (placeholder automático), `contact`, `primaryCta`, `nav`.
- **`SegmentCopy`** (`src/engine/copy/types.ts`): biblioteca de frases por nicho. Variáveis `{empresa} {cidade} {anos} …`; `*destaque*`.
- **`AuditReport`** (`src/shared/schemas.ts`) + regras em `src/server/modules/auditor/score.ts`.
- **`QaReport`/`QaCheck`** (`src/qa/types.ts`).
- **API**: ver `src/server/routes/*.ts`. Padrão: Zod `parse()`, `h()` async, erros `{ error, details }`. Jobs longos (auditoria, QA) respondem `202 { job }` e o painel faz polling de `activeJobs`.

## 5. Decisões e armadilhas

- **`page.evaluate` com funções TS quebra sob `tsx`** (`__name is not defined`). Por isso o código de navegador fica em `*.browser.js` e é avaliado como string (`inPage()`), tanto no auditor quanto no QA. Não "refatore" isso de volta para funções inline.
- **`node:sqlite`** exige Node ≥ 22.13; emite `ExperimentalWarning` (normal). `Database` em `src/server/db/database.ts` é a única camada que fala SQL — repos usam `run/get/all/transaction`.
- **Caminhos absolutos no banco** (`previews.path`, `projects.path`, `audits.screenshots[].path`): o import de backup reescreve para o `GZ_DATA_DIR` atual (`backup.ts`).
- **Prévias são públicas** (`/previews/:id/`) mesmo com `GZ_ACCESS_TOKEN` — para enviar o link ao cliente.
- **Runtime GSAP** compilado por esbuild para `src/engine/runtime/dist/gz-runtime.js` (gitignored). `ensureRuntime()` recompila quando as fontes mudam; o boot do servidor e os testes chamam isso.
- **Fontes Google** são carregadas pelos sites gerados; em ambientes sem acesso externo (sandbox/proxy) aparecem avisos no QA/auditoria — não é bug.
- **Determinismo**: `generateSiteConfig` usa hash do nome + variação; mesma entrada → mesmo site. Não introduza `Math.random()`.
- **Auto-fix** só faz mudanças seguras; nunca altera layout/design. Opera no config e reconstrói; ajustes de HTML (rel, lazy, alt vazio) são reaplicados no `dist/` após o build.
- **Project standalone export** copia `src/engine` + `src/shared` para `engine/` dentro do ZIP; o `scripts/build.ts` do projeto importa `../engine/engine/index`. Se renomear pastas do engine, atualize `STANDALONE_BUILD` em `src/server/modules/factory/index.ts`.
- **Express 5**: rotas com `/{*splat}`; `req.query` é somente leitura; `path-to-regexp` novo.
- **Tailwind 4**: `@apply` não aceita classes compostas definidas em CSS (`card`), só utilitários.
- **Vite proxy** usa chaves com barra final (`/api/`, `/previews/`…): `/api` capturava `/api.ts` do próprio dashboard.
- **Rota do painel `/preview/:id` é singular** de propósito: `/previews/<id>/` é o site estático público. Não troque.
- **Prévias V1 e V2 convivem** na mesma tabela: `previews.meta` vazio = V1 (tema/variação); com `direction` = V2. `POST /previews` sem `directionId` mantém o fluxo V1.
- **Segredos só no backend**: `NETLIFY_AUTH_TOKEN`/`PUBLISH_PROVIDER` vêm do `.env`; o painel só lê `GET /publish/status`.
- **Vídeo** depende de `ffmpeg`/`ffprobe` do sistema (ou `FFMPEG_PATH`) para poster/otimização; sem eles, degrada sem erro. O ffmpeg embutido do Playwright é só WebM e não serve.
- **Pesquisa pública é extrativa** (regex/DOM, sem IA) e por fonte isolada: uma fonte bloqueada vira `{ok:false,error}` e o resto segue.

## 6. Estado atual (testado)

- Fluxo completo validado por E2E (API) e por um roteiro Playwright no painel real: novo prospect → auditar → prévia → proposta (HTML/PDF/texto/WhatsApp) → mensagens → fechar → projeto → build → QA → export ZIP → pipeline → settings.
- 20 segmentos × 10 temas × 6 layouts renderizam sem avisos (teste unitário).
- QA de um site gerado: Lighthouse ~85–100 / 91 / 100 / 100 no ambiente de teste; 0 overflow em 5 viewports.
- Lint, typecheck e Prettier limpos.
- **V2 (branch `claude/gz-os-v2-adaptive`)**: 21 testes unitários (DNA, direções, composição, vídeo, unidades, locks/regeneração, Creative QA, mensagens adaptativas, publicação mock, backup) + 9 E2E (upload real de logo/fotos/WebM → direções → prévia com hero em vídeo tocando no Chromium → locks/regenerar → publicar mock → mensagem → fluxo V1 intacto). Revisão visual Playwright de 3 arquétipos (oficina com vídeo, arquitetura, clínica) em 1920/1440/820/430/390: sem overflow, sem erros de JS, sites estruturalmente diferentes.

## 7. Backlog sugerido (por valor)

0. **V2 pendências**: testar publicação Netlify real com token; editor visual de seções integrado à página da prévia; hero `layered`/`showcase` em mais composições; pesquisa com mais extratores (cardápio, catálogo); similaridade visual por screenshot.

1. **Editor visual de seções** no painel (hoje: formulário rápido + JSON). Reordenar/ativar seções com drag-and-drop, trocar variante por select.
2. **Fotos de banco de imagens** opcional (Unsplash/Pexels via chave do usuário) como alternativa aos placeholders — provider plugável como a IA.
3. **Mais páginas por padrão** (Serviços, Sobre, Contato) nos projetos; o engine já suporta `pages[]`.
4. **Auditoria em lote** (lista de URLs → prospects automáticos) e importação CSV de leads.
5. **Netlify Forms + e-mail**: notificação quando o formulário do cliente recebe lead.
6. **Multiusuário** (se a equipe crescer): hoje é token único.
7. **Visual regression**: comparar screenshots do QA entre builds.
8. **Mais temas/seções**: o padrão é simples de estender (`DEVELOPMENT.md`).
9. **i18n dos sites** (hoje pt-BR fixo em copy; `seo.lang` existe).
10. **Code-splitting do dashboard** (bundle ~540 KB; aceitável para uso interno).

## 8. Como validar uma mudança

1. `npm run check`.
2. Se tocou engine/CSS: `npm run gz:preview -- "Teste" <segmento> Cidade --out=/tmp/x` e abra no navegador em 390/1440; ou `npm run gz:qa`.
3. Se tocou API: `npm run test:e2e`.
4. Se tocou painel: `npm run dev` e percorra Novo Prospect → Auditar → Prévia → Proposta → Projeto → QA.

## 9. Dados de exemplo

Não há seed de dados fake (por decisão). Para testar, crie um prospect e use `example.com` como site, ou aponte a auditoria para uma prévia gerada (`http://localhost:4800/previews/<id>/`).

## 10. Contato do projeto

Agência: GZ Sites · configurações em **Configurações → Agência** (nome, slogan, WhatsApp, e-mail, assinatura, preços).
