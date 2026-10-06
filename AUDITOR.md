# GZ Prospect Auditor

Auditoria **não destrutiva** de um site, 100% por regras (sem IA), produzindo a **Nota GZ** e uma lista de oportunidades prontas para a conversa de vendas.

## Como rodar

- Painel: ficha do prospect → **Auditar site** (usa o site cadastrado ou pede a URL).
- CLI: `npm run gz:audit -- https://site.com.br [--no-lighthouse] [--out=pasta]`.
- API: `POST /api/prospects/:id/audit` `{ "url": "…" }` → job; `GET /api/audits/:id`.

Tempo: ~10–20 s sem Lighthouse, ~30–60 s com. Configure em **Configurações → Preços → Auditoria** (Lighthouse on/off, timeout) ou `AUDIT_LIGHTHOUSE` / `AUDIT_TIMEOUT_MS` no `.env`.

## O que é coletado (`collect.ts`)

1. **Carregamento** com Playwright (Chromium, viewport 1440×900, user-agent de desktop), espera `load`, rola a página inteira (dispara lazy loading), espera rede ociosa.
2. **DOM** (`collect.browser.js`): title, description, H1/headings, canonical, viewport, favicon, Open Graph, JSON-LD, lang, generator, contagem de palavras, links internos/externos, imagens (alt, lazy, superdimensionadas), formulários (campos, labels, submit), famílias de fonte, flex/grid, ano no rodapé, sinais legados (tabelas, `<font>`, Flash, jQuery 1.x/2.x, Bootstrap 3, Wix/Joomla…, excesso de inline style), hero image, blocos de texto longos, candidatos a CTA, links `tel:`/`wa.me`/`mailto`.
3. **Acima da dobra** (desktop): telefone visível, WhatsApp visível, CTA visível.
4. **Mobile** (390×844): overflow horizontal e largura excedente, textos < 12px, alvos de toque < 32px, menu mobile, elementos fixos cobrindo > 35% da tela, elementos cortados.
5. **Rede**: requisições, bytes por tipo, imagens mais pesadas, conteúdo misto, domínios de terceiros, imagens não otimizadas (> 300 KB sem WebP/AVIF).
6. **Console**: erros e exceções.
7. **Headers**: server, x-powered-by, CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.
8. **Segredos expostos** no HTML: padrões de chaves AWS/Stripe/Google, chaves privadas, tokens Slack, senhas em texto, strings de conexão.
9. **robots.txt / sitemap.xml** (inclusive `Disallow: /` global).
10. **Screenshots** full-page desktop (1440), tablet (820), mobile (390) → WebP + thumbnail.
11. **Lighthouse** mobile (`lighthouse.ts`, Chromium do Playwright): Performance, Accessibility, Best Practices, SEO, LCP, CLS, TBT, INP, FCP, Speed Index, TTFB.

## Pontuação (`score.ts`)

Cada regra retorna `pass | warn | fail | info` com uma **penalidade** em pontos na sua categoria. Nota da categoria = `100 − Σ penalidades` (limitada a 0–100).

| Categoria | Peso na Nota GZ | Exemplos de regras |
| --- | --- | --- |
| Visual | 20% | sinais legados (−12 cada), sem flex/grid (−15), ano antigo no rodapé (−10), sem hero image (−12), muitas fontes, inline styles, poucas imagens, Lighthouse BP/A11y |
| Mobile | 20% | sem viewport (−35), overflow horizontal (−25), fontes pequenas, alvos pequenos, sem menu, elementos fixos cobrindo, cortados, LH perf < 50 |
| Performance | 15% | LH Performance (até −55), LCP, CLS, TBT, peso da página (−10/−20), requests, imagens pesadas (−5 cada), superdimensionadas, sem lazy, scripts em excesso, TTFB |
| SEO | 15% | title (−20/−6), description (−14), H1 (−12), canonical, OG (−8), sitemap, robots bloqueando (−25), alt, schema.org (−6), favicon, viewport, lang, LH SEO |
| Conversão | 20% | WhatsApp ausente (−25) / escondido (−10), telefone escondido (−12), CTA ausente (−25) / fora da dobra (−15), formulário longo/sem labels, texto em excesso, pouco conteúdo, navegação confusa |
| Segurança | 10% | HTTPS ausente (−45), HSTS, CSP (−10), XFO, nosniff, referrer, permissions, mixed content (−20), segredos expostos (−30), versão exposta, erros de console |

**Oportunidades**: regras marcam `opportunity` com severidade (alto/médio/baixo). O relatório dedupe, ordena por severidade e impacto, e mostra as 8 principais — é o que entra nas mensagens (`{problema1..3}`) e na proposta.

## Relatório

- `data/audits/<id>/report.json` (`AuditReport` em `src/shared/schemas.ts`), screenshots `desktop.webp`, `tablet.webp`, `mobile.webp`, `thumb.webp`.
- No painel: nota geral, 6 anéis por categoria, Lighthouse, oportunidades, screenshots, lista de achados filtrável por categoria, dados técnicos.
- **Gerar resumo**: texto curto para o cliente (IA opcional; sem IA usa as piores categorias + top 3 oportunidades).

## Limites e ética

- Só leitura: nenhum POST, nenhum login, nenhuma tentativa de exploração. Headers e robots são lidos como qualquer navegador faria.
- Sites com proteção anti-bot (Cloudflare challenge) podem falhar ou dar notas distorcidas; verifique a screenshot.
- Lighthouse usa emulação mobile com throttling simulado — os números são comparáveis entre sites, não idênticos ao PageSpeed oficial.
- Em ambientes sem acesso a `fonts.googleapis.com`, recursos externos falham e aparecem como avisos.

## Ajustar as regras

Tudo está em `RULES` (`src/server/modules/auditor/score.ts`): mude penalidades, limiares ou textos das oportunidades. `WEIGHTS` controla o peso das categorias. Os testes em `tests/unit/server-modules.test.ts` cobrem um site "ruim" e um "bom".
