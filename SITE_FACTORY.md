# Site Factory

Como o GZ OS transforma dados em sites — prévias e projetos finais — e como editar o resultado.

## O engine em uma frase

`generateSiteConfig(dados) → site.config → renderSite(config) → arquivos estáticos`.

- `generateSiteConfig` (`src/engine/generate.ts`): escolhe tema + layout a partir do segmento (ou do que você pediu), seleciona copy da biblioteca do nicho, monta a lista de seções com props preenchidas, usa fotos/logo enviados.
- `renderSite` (`src/engine/render/site.ts`): valida o config (Zod), renderiza cada seção, gera CSS do tema, copia runtime, cria placeholders, favicon, robots, sitemap, `_headers`.

## site.config (fonte da verdade)

```jsonc
{
  "version": 1,
  "brand": { "name": "Serralheria Dois Irmãos", "tagline": "…", "logo": { "src": "assets/img/logo.webp", "alt": "…" } },
  "theme": { "id": "industrial", "overrides": { "colors": { "accent": "#ff5a1f" }, "fonts": { "display": "Oswald" }, "radius": "none" } },
  "business": { "segment": "serralheria", "city": "Curitiba", "yearsExperience": 12, "services": [ { "title": "Portões", "description": "…", "icon": "home" } ], "testimonials": [], "faqs": [], "stats": [], "steps": [], "projects": [], "hours": [] },
  "contact": { "whatsapp": "5541999998888", "phone": "(41) 3333-4444", "email": "…", "address": "…", "instagram": "@…", "whatsappMessage": "Olá! …" },
  "seo": { "title": "…", "description": "…", "keywords": [], "siteUrl": "https://dominio.com.br", "noindex": false },
  "animations": { "enabled": true, "intensity": "normal", "parallax": true, "magnetic": true, "textReveal": true },
  "integrations": { "form": "whatsapp", "analytics": { "provider": "none" } },
  "assets": { "images": [] },
  "pages": [ { "path": "/", "title": "Início", "sections": [ { "type": "header", "variant": "transparent", "props": {} }, { "type": "hero-fullscreen", "props": { "headline": "Projetos em serralheria feitos para *durar*.", "subheadline": "…", "primaryCta": { "label": "Pedir orçamento" } } }, … ] } ],
  "previewMode": false
}
```

Regras úteis:
- `*asteriscos*` em títulos destacam a palavra (`<em class="accent">`).
- Seções sem `items` usam os dados de `business` (ex.: `services` ← `business.services`).
- `props.navLabel` + `props.id` colocam a seção no menu.
- Várias páginas: adicione objetos em `pages` (`path: "/servicos"`); viram `servicos/index.html` e entram no menu.
- Imagens: `src` pode ser `assets/img/arquivo.webp` (dentro do projeto), `/files/uploads/...` (upload do GZ OS) ou URL absoluta. Sem imagem → placeholder SVG.

## Temas

| id | Direção |
| --- | --- |
| luxury-dark | preto profundo, serifa (Cormorant), dourado |
| minimal-light | branco, Manrope pesado, muito espaço |
| industrial | grafite, laranja, Oswald caixa alta, listras |
| editorial | papel, Playfair + Source Serif, filetes, capitular |
| automotive | carbono, vermelho, Chakra Petch itálico, cortes diagonais |
| architecture | monocromático, Jost leve espaçado, grid |
| medical-clean | branco, azul calmo, Plus Jakarta, cantos suaves |
| local-business | quente, Nunito 900, botões pill, WhatsApp verde |
| ecommerce | limpo, Sora, violeta, cards de produto |
| high-contrast | preto/branco/ácido, Syne gigante, bordas duras |

## Seções (35)

`header`, `hero`, `hero-video`, `hero-split`, `hero-fullscreen`, `manifesto`, `benefits`, `services`, `products`, `catalog`, `about`, `numbers`, `statistics`, `projects`, `gallery`, `portfolio-masonry`, `before-after`, `testimonials`, `faq`, `process`, `timeline`, `team`, `logos`, `marquee`, `comparison`, `pricing`, `hours`, `horizontal-scroll`, `cta`, `form`, `map`, `contact`, `footer`, `sticky-cta`, `whatsapp-float`.

Cada uma tem variantes (ex.: `services`: cards | rows | alternating | minimal). A lista completa com variantes aparece em **Projeto → Conteúdo & config → Seções disponíveis** e em `GET /api/meta`.

## Layouts (composições)

`impact`, `local`, `editorial`, `catalog`, `trust`, `showcase` (`src/engine/presets/layouts.ts`). Cada segmento prefere 3; a variação da prévia percorre tema × layout.

## Animações (runtime)

- `data-gz="reveal"` fade+lift; `data-gz="stagger"` filhos em cascata; `data-gz="text"` palavra a palavra (com `data-gz-scrub` segue o scroll); `data-gz="image"` cortina + zoom-out; `data-gz="clip"`.
- `data-gz-parallax="0.2"` (+ `data-gz-parallax-bg` para fundos); `data-gz-hscroll` scroll horizontal pinado (desktop); `data-gz-timeline`; `data-gz-counter`.
- `data-gz-magnetic` (botões), press+spring em `.btn`, header que muda ao rolar, menu mobile, slider, antes/depois, FAQ, formulário Enviar → Enviando → Enviado, CTA fixo mobile.
- Tudo respeita `prefers-reduced-motion` e usa só `transform/opacity`. Sem JS o conteúdo fica visível (os estados iniciais só se aplicam com `html.gz-js`).

## Projeto (pasta)

```
data/projects/<slug>/
  site.config.json    ← edite aqui
  assets/img/         ← fotos e logo
  dist/               ← saída do build (vai para o ar)
  qa/                 ← report.json, report.html, screenshots
  scripts/build.ts    ← build fora do GZ OS (export completo)
  netlify.toml · package.json · tsconfig.json · README.md
```

Fluxo no painel: **Criar projeto → (editar config) → Build site → Rodar QA → Corrigir automaticamente → Exportar / Publicar**.

Fora do GZ OS (export completo): `npm install && npm run build` gera `dist/` usando o engine copiado em `engine/`.

## Prévia vs projeto

| | Prévia | Projeto |
| --- | --- | --- |
| Onde | `data/previews/<id>/` | `data/projects/<slug>/` |
| URL | `/previews/<id>/` (pública) | `/projects-preview/<id>/` |
| `previewMode` | true (barra GZ, `noindex`, placeholders rotulados) | false |
| Imagens | referenciam uploads | copiadas para `assets/img` |
| Edição | "Ajustar dados" (formulário ou JSON) | `site.config.json` (JSON) |

## CLI

```bash
npm run gz:preview -- "Nome" segmento [cidade] [--theme=] [--layout=] [--out=] [--final]
npm run gz:build -- <slug>
npm run gz:qa -- <slug>
npm run gz:export -- <slug> [--full]
```
