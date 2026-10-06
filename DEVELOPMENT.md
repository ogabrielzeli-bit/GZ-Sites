# Desenvolvimento

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
npm run dev
```

- `npm run dev` roda `tsx watch src/server/index.ts` (porta 4800) e `vite` (porta 5173, com proxy de `/api`, `/previews`, `/files`, `/projects-preview` para a API).
- O runtime do engine é compilado automaticamente no boot (`ensureRuntime()`), e também por `npm run build:runtime`.

## Scripts

| Script | Descrição |
| --- | --- |
| `npm run typecheck` | `tsc` nos dois projetos (`tsconfig.node.json`, `tsconfig.web.json`) |
| `npm run lint` / `npm run format` | ESLint 9 (flat config) / Prettier |
| `npm test` | Vitest unitário (`tests/unit`) — rápido, sem navegador |
| `npm run test:e2e` | Vitest E2E (`tests/e2e`) — sobe a API em pasta temporária, usa Playwright (≈1 min) |
| `npm run check` | typecheck + lint + unit |
| `npm run gz:qa` | QA do próprio GZ OS (check + QA de um site gerado, com Lighthouse) |

## Convenções

- TypeScript estrito, ESM, aliases `@shared/*`, `@engine/*`, `@server/*` (tsconfig paths; o Vite tem os mesmos aliases).
- Validação de entrada da API sempre com Zod (`parse(schema, req.body)` em `src/server/http.ts`).
- Handlers async envolvidos em `h()`; erros viram JSON `{ error, details }`.
- Código que roda **dentro de páginas** no Playwright fica em arquivos `.browser.js` (JS puro) avaliados como string — o `tsx` injeta helpers (`__name`) que quebram `page.evaluate(fn)`.
- Nada de credenciais no código. Tudo via `.env` (`src/server/env.ts`).

## Como adicionar…

### Uma seção nova
1. Crie em `src/engine/sections/<grupo>.ts` com `defineSection({ type, name, description, variants, props (Zod), render })`.
2. Adicione o `type` em `SECTION_TYPES` (`src/shared/site-config.ts`) e no array do grupo exportado (`*_SECTIONS`).
3. Estilos em `src/engine/css/base.css` (use variáveis `--c-*`, `--r-*`, `--s-section`).
4. Para a seção entrar nas prévias, inclua-a em um layout (`src/engine/presets/layouts.ts`) e trate o `slot` em `buildSection()` (`src/engine/generate.ts`).
5. Rode `npm test` (o teste de catálogo exige que todo `SECTION_TYPES` tenha definição).

### Um tema novo
1. Adicione o id em `THEME_IDS` (`src/shared/site-config.ts`).
2. Defina o tema em `src/engine/themes/index.ts` e extras opcionais em `THEME_EXTRAS` (`src/engine/css/index.ts`).
3. Referencie-o em `themes` dos segmentos que combinarem (`src/engine/copy/segments-*.ts`).

### Um segmento novo
1. Adicione em `SEGMENTS` (`src/shared/segments.ts`).
2. Crie o `SegmentCopy` em `src/engine/copy/segments-*.ts` e registre em `COPY_LIBRARY`.
3. Ícones padrão em `SEGMENT_ICONS` (`src/engine/sections/content.ts`).

### Uma regra de auditoria
Adicione um objeto em `RULES` (`src/server/modules/auditor/score.ts`): categoria, `check(report)` retornando `status`, `penalty`, `title`, opcional `opportunity`. Pesos por categoria em `WEIGHTS`.

### Um check de QA
Estático: `src/qa/static-checks.ts`. No navegador: função em `src/qa/qa.browser.js` + chamada via `inPage(page, 'nome')` em `src/qa/index.ts`.

### Uma migration
Adicione em `MIGRATIONS` (`src/server/db/migrations.ts`) com um `id` novo. Nunca edite migrations já aplicadas.

### Um endpoint
Rotas em `src/server/routes/*.ts`; registre em `app.ts`. Hooks de dados no front em `src/web/api.ts`.

## Testes

- `tests/unit/engine.test.ts`: todos os segmentos × temas × layouts renderizam sem avisos, determinismo, helpers.
- `tests/unit/copy-and-utils.test.ts`: biblioteca de copy, utils, schemas.
- `tests/unit/server-modules.test.ts`: banco/repos (SQLite em memória), mensagens, propostas, pontuação, QA estático, auto-fix, IA fallback, backup.
- `tests/e2e/api-flow.test.ts`: fluxo completo pela API (prospect → prévia → auditoria → mensagens → proposta → projeto → build → QA → export → backup) + proteção contra path traversal.

## Estrutura do dashboard

`src/web/pages/*`: Dashboard, Pipeline (dnd-kit), Prospects (+ `ProspectForm`), ProspectDetail (abas: Ficha, Auditoria, Prévias, Propostas, Mensagens, Projeto, Histórico), Projects, ProjectDetail (Visão geral, Conteúdo & config, GZ Quality Report, Arquivos), Settings (Agência, Preços, Mensagens, Propostas, IA, Backup). Componentes em `src/web/components/ui.tsx`.
