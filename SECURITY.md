# Segurança

Este documento cobre a segurança **dos sites gerados** e **do GZ OS**.

## Sites gerados (clientes)

| Prática | Como é aplicada |
| --- | --- |
| Nenhuma chave no frontend | O site é 100% estático. Formulários enviam via WhatsApp/mailto/Netlify Forms. Analytics só por ID público (Plausible/GA4), se configurado. |
| Security headers | `_headers` + `netlify.toml`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (câmera, microfone, geolocalização, pagamento desligados), `Strict-Transport-Security`. |
| CSP | `Content-Security-Policy` restrita: `default-src 'self'`, scripts só do próprio site (+ analytics escolhido), estilos/fontes do Google Fonts, imagens `self data: https:`, iframes só Google Maps, `form-action` restrito a `self`/WhatsApp, `object-src 'none'`, `base-uri 'self'`, `upgrade-insecure-requests`. |
| Sanitização / escaping | Todo texto do `site.config` passa por `escapeHtml` ao virar HTML (`src/engine/sections/types.ts`); atributos via `attrs()`; JSON-LD escapa `<`. Não há `innerHTML` com dados externos no runtime. |
| Links externos | `target="_blank"` sempre com `rel="noopener noreferrer"` (gerado e verificado no QA, com auto-fix). |
| Formulário | Validação no cliente, honeypot (`empresa-site`), `novalidate` + validação própria, estados de envio; Netlify Forms com `netlify-honeypot`. Sem backend próprio → sem superfície de injeção. |
| Sem execução arbitrária | O runtime é um bundle fixo (GSAP + interações); nada vem de dados do config como código. |
| Mixed content | QA e auditor detectam recursos `http://`. |
| Segredos no HTML | QA procura padrões de chaves (Stripe, AWS, chaves privadas) no HTML final. |

## GZ OS (painel + API)

| Tema | Medida |
| --- | --- |
| Credenciais | Nunca no código. `.env` (gitignored) com `.env.example`. Chaves de IA e Netlify só por `.env` ou por requisição (Netlify, não persistido). |
| Acesso ao painel | `GZ_ACCESS_TOKEN` (opcional, obrigatório se exposto): header `Authorization: Bearer`, `?token=` (vira cookie `HttpOnly; SameSite=Lax`) — `src/server/app.ts`. Por padrão escuta só em `127.0.0.1`. |
| Rate limiting | 600 req/min por IP na `/api` (em memória). |
| Validação | Toda entrada validada com Zod (`parse()`), limites de tamanho em strings/arrays; JSON body ≤ 10 MB. |
| Uploads | Tipos permitidos: jpeg/png/webp/avif/gif/svg e mp4/webm. Imagens ≤ 15 MB, vídeo ≤ 80 MB. Imagens são **reprocessadas** com sharp (remove metadados/payloads, gera WebP). SVG é sanitizado (remove `<script>`, handlers `on*`, `javascript:`). Nomes de arquivo são regenerados (slug + id). |
| Path traversal | `resolveStaticFile()` resolve e confere prefixo da pasta base; `safeJoin()`; downloads usam `path.basename`; importação de ZIP ignora entradas fora de `data/` (zip-slip). Testado em `tests/e2e`. |
| Headers do painel | `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: SAMEORIGIN` (exceto prévias/arquivos). `x-powered-by` desligado. |
| Auditor | Não destrutivo: só navega, lê DOM/headers/robots/sitemap. Não envia formulários, não tenta credenciais, não faz fuzzing. Timeouts e `ignoreHTTPSErrors` apenas para leitura. |
| Dependências | Poucas e conhecidas (express, zod, playwright, lighthouse, sharp, adm-zip, multer, gsap, react). Rode `npm audit` periodicamente. |
| Banco | SQLite local em `GZ_DATA_DIR`; prepared statements em todas as queries (sem concatenação de valores). |
| Logs | Erros de HTTP vão para o console; não há envio de telemetria. |

## Limitações conhecidas

- Sem autenticação multiusuário: o token é único (uso pessoal/equipe pequena). Para expor na internet, use HTTPS + token longo + firewall.
- Rate limit em memória (reinicia com o processo).
- Prévias são públicas por design (links para clientes). Não coloque dados sensíveis em prévias.

## Reportar problemas

Abra uma issue descrevendo o cenário; não inclua chaves ou dados de clientes.
