# Troubleshooting

## Instalação / boot

**`Cannot find module 'node:sqlite'` ou `ExperimentalWarning: SQLite`**
Precisa de Node ≥ 22.13 (`node --version`). O aviso "experimental" é normal e inofensivo.

**`Executable doesn't exist` / `browserType.launch` ao auditar ou rodar QA**
Instale o navegador: `npx playwright install chromium` (Linux: `npx playwright install --with-deps chromium`). A versão do pacote `playwright` deve bater com a do navegador instalado; use a fixada no `package.json` (1.56.1).

**`sharp` falha ao instalar**
`npm rebuild sharp` ou `npm install --include=optional sharp`. Em Alpine use a imagem Playwright (Debian) do `DEPLOYMENT.md`.

**Porta ocupada**
Mude `PORT` no `.env` (API) ou rode `vite --port 5174` (dev). O proxy do Vite lê `PORT` do ambiente.

**Dashboard mostra "API ativa" em vez do painel**
Em produção rode `npm run build` antes de `npm start` (gera `dist-web/`). Em dev use `npm run dev` e abra `localhost:5173`.

## Auditoria

**"Não foi possível carregar"**
URL inválida, site fora do ar, bloqueio anti-bot ou DNS. Teste a URL no navegador. Aumente `AUDIT_TIMEOUT_MS`.

**Demora mais de 1 minuto**
Lighthouse em site pesado. Desligue em **Configurações → Preços → Auditoria** (ou `AUDIT_LIGHTHOUSE=false`): a Nota GZ continua, só sem métricas Lighthouse.

**Lighthouse "não rodou"**
Normalmente Chromium sem permissão ou falta de memória. A auditoria continua com heurísticas. Veja o erro em "Dados técnicos".

**Auditoria presa em "running" após reiniciar o servidor**
No boot elas são marcadas como falhas automaticamente. Rode de novo.

## Prévias e sites

**Fontes não carregam / site "feio"**
Sites usam Google Fonts. Sem internet ou atrás de proxy que bloqueia `fonts.googleapis.com`, o fallback do sistema é usado. No ar, funciona.

**Imagens aparecem como arte abstrata com rótulo "Foto: …"**
São placeholders: envie fotos na ficha do prospect (aba Ficha → Fotos) e gere a prévia de novo, ou edite `assets/img` no projeto.

**Animações não aparecem**
`prefers-reduced-motion` ligado no sistema desliga as animações (por design). Verifique também se `assets/gz-runtime.js` existe (rode `npm run build:runtime`).

**Mudei o `site.config.json` e nada mudou**
Clique em **Build site** (ou `npm run gz:build -- <slug>`). O `dist/` só muda no build.

**Erro "Dados inválidos" ao salvar o config**
A mensagem traz o caminho do campo (ex.: `pages.0.sections.3.type`). Confira os tipos de seção em `GET /api/meta` ou use **Corrigir automaticamente** (remove seções desconhecidas e variantes inválidas).

## QA

**FAIL em "recursos locais falharam"**
Algum `src`/`href` relativo aponta para arquivo inexistente no `dist/`. Veja a lista; normalmente é imagem removida de `assets/img`.

**WARNING "recursos externos não carregaram"**
Google Fonts/CDN inacessível no ambiente de QA (proxy/offline). Não afeta o site publicado.

**Formulário falha no QA**
Com `integrations.form = "whatsapp"` é preciso `contact.whatsapp`. Com `netlify` o teste faz um POST que só funciona na Netlify (localmente retorna erro e o check fica como aviso).

## Dados

**Perdi dados?**
Estão em `GZ_DATA_DIR` (padrão `./data`). O código nunca apaga essa pasta. Restaure um backup em **Configurações → Backup → Importar**.

**Migrations**
`npm run db:migrate` é idempotente. Se uma migration falhar no meio, ela é revertida (transação) — corrija e rode de novo.

**Mover para outra máquina**
Backup ZIP completo → nova instalação → Importar (modo "substituir"). Os caminhos de arquivos são reescritos para a nova pasta de dados.

## Hospedagem

**401 em tudo**
`GZ_ACCESS_TOKEN` definido: acesse `https://seu-host/?token=SEU_TOKEN` uma vez (vira cookie).

**Uploads grandes falham**
Limites: 15 MB imagem, 80 MB vídeo. Se houver proxy (Nginx), aumente `client_max_body_size`.
