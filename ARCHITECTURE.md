# Arquitetura do GZ OS

## Visão geral

```
┌──────────────┐   HTTP/JSON   ┌──────────────────────┐
│  Dashboard   │ ────────────▶ │  Servidor Express     │
│  React/Vite  │               │  src/server           │
└──────────────┘               │  ├─ routes (API)       │
                               │  ├─ modules            │
                               │  │   auditor  (Playwright + Lighthouse + regras)
                               │  │   previews / factory (usam o engine)
                               │  │   proposals / messages / uploads / backup / ai
                               │  ├─ jobs (fila em processo)
                               │  └─ db (SQLite via node:sqlite + migrations)
                               └──────────┬───────────┘
                                          │
            ┌─────────────────────────────┼──────────────────────────┐
            ▼                             ▼                          ▼
     src/engine (GZ Engine)          src/qa (GZ QA)              data/ (fora do Git)
     tokens · themes · sections      static-checks · browser     gz.db · uploads · audits
     copy · presets · render         checks · lighthouse ·       previews · projects
     runtime (GSAP, esbuild)         autofix · report            exports · backups
```

Uma única aplicação Node (ESM, TypeScript executado com `tsx`), um único `package.json`. Sem workers externos, sem Redis, sem serviços pagos.

## Pastas

| Pasta | Conteúdo |
| --- | --- |
| `src/shared` | Tipos e schemas Zod compartilhados (prospect, auditoria, proposta, projeto, settings), `site-config.ts` (schema do site), segmentos, etapas, utils puras |
| `src/engine` | Motor de sites: `tokens.ts`, `themes/`, `css/` (base.css + extras por tema), `sections/` (35 seções), `copy/` (20 segmentos), `presets/layouts.ts` (6 composições), `placeholders.ts`, `icons.ts`, `generate.ts` (dados → site.config), `render/site.ts` (site.config → arquivos), `runtime/` (JS do cliente) |
| `src/server` | `index.ts` (boot), `app.ts` (Express), `context.ts`, `env.ts`, `jobs.ts`, `http.ts`, `db/` (database, migrations, repos), `routes/` (prospects, projects, system), `modules/` |
| `src/qa` | QA automático reutilizado pelo painel e pelo CLI |
| `src/cli` | `gz` CLI |
| `src/web` | Dashboard React (Vite + Tailwind 4) |
| `tests/unit`, `tests/e2e` | Vitest |
| `data/` | Dados do usuário (gitignored). Configurável via `GZ_DATA_DIR` |

## Fluxo de dados

1. **Prospect** é a entidade central (`prospects`). Tudo referencia `prospect_id`.
2. **Auditoria** (`audits`): job assíncrono → `runAudit()` → `report.json` + screenshots em `data/audits/<id>/`; scores/opportunities salvos na linha.
3. **Prévia** (`previews`): `generateSiteConfig(prospect)` → `renderSite(config)` → arquivos em `data/previews/<id>/`, servidos em `/previews/<id>/` (públicos, para enviar ao cliente). O `config` fica salvo para edição.
4. **Proposta** (`proposals`): dados JSON (problemas da auditoria, preços das configurações). Render em HTML (template editável), texto, WhatsApp e PDF (Playwright).
5. **Projeto** (`projects`): pasta real em `data/projects/<slug>/` com `site.config.json`, `assets/`, `scripts/build.ts`, `netlify.toml`, `README.md`. Build → `dist/`. QA → `qa/report.{json,html}`.
6. **Histórico** (`activities`): toda ação relevante é logada. **Tarefas** (`tasks`). **Templates** (`templates`: mensagens e propostas). **Settings** (linha única JSON).

## GZ Engine

- **site.config** (Zod em `src/shared/site-config.ts`): `brand`, `theme`, `business`, `contact`, `seo`, `animations`, `integrations`, `assets`, `pages[].sections[]`.
- **Seções**: cada uma declara `type`, `variants`, `props` (Zod) e `render(props, ctx, variant) → string HTML`. Dados ausentes caem no `business.*` (ex.: `services` sem `items` usa `business.services`).
- **Temas**: 10 direções de arte (cores, fontes Google, raio, textura, estilo de botão/card, espaçamento, tratamento de imagem). CSS = variáveis do tema + `base.css` + extras do tema.
- **Copy**: por segmento, listas de frases com `{variáveis}`; seleção determinística (hash do nome + variação). Frases que exigem `{anos}` só entram se houver anos.
- **Layouts**: 6 arquétipos (impact, local, editorial, catalog, trust, showcase). Cada segmento prefere 3 temas e 3 layouts; `layoutVariant` percorre as combinações.
- **Placeholders**: SVG abstratos determinísticos (6 estilos) quando não há fotos; marcados "Foto: …" na prévia.
- **Runtime**: `runtime/client/index.ts` (GSAP + ScrollTrigger) compilado por esbuild para `runtime/dist/gz-runtime.js` (~120 KB min) e copiado para cada site. Respeita `prefers-reduced-motion`, só anima `transform/opacity`.
- **Saída**: HTML estático por página, `assets/site.css`, `assets/gz-runtime.js`, placeholders, favicon SVG, `robots.txt`, `sitemap.xml`, `_headers`, `_redirects`.

## Auditor

`collect.ts` (Playwright: DOM, rede, console, mobile, screenshots) → `lighthouse.ts` (Chromium do Playwright via chrome-launcher) → `score.ts` (≈60 regras, penalidades por categoria, pesos, oportunidades). Código executado dentro da página fica em `collect.browser.js` (JS puro, avaliado como string, para não depender do bundler).

## QA

`src/qa/index.ts`: checks estáticos (config, build, lint HTML, links internos) → servidor estático local (`static-server.ts`, aplica `_headers`) → Playwright em 5 viewports (console, recursos, overflow, tap targets, fontes, imagens, botões, formulário, a11y) → Lighthouse → `report.json` + `report.html`. `autofix.ts` opera no config (fonte da verdade) e no `dist/`.

## Jobs

`JobQueue` em memória, concorrência 1, status consultável em `/api/jobs/:id` e embutido nas respostas de prospect/projeto (`activeJobs`). Auditorias "running" após restart são marcadas como falhas no boot.

## Decisões

- **SQLite nativo (`node:sqlite`)**: zero binário nativo, zero dependência; `Database` é uma camada fina (`run/get/all/transaction`) para trocar por Postgres no futuro.
- **HTML estático em vez de React nos sites**: performance, SEO, zero JS além do runtime; código editável via `site.config.json`.
- **Sem IA no caminho crítico**: `AIProvider` com `NoAIProvider` padrão; cada função tem fallback.
- **Dados fora do código**: `data/` + migrations versionadas.
