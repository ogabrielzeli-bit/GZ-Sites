# GZ OS V2 — Adaptive Creative Engine

Como o GZ OS decide **o que** cada site vira (e por que dois clientes nunca recebem o mesmo site). Tudo por regras determinísticas: **nenhuma etapa exige IA**, nenhuma chave de API vai para o frontend.

## Fluxo em uma linha

```
Ficha (+ fotos/vídeos/unidades) → [Pesquisa pública] → BusinessDNA → 3 Direções criativas
   → Composição adaptativa (seções, hero, motion, paleta) → Prévia (+ Creative QA)
   → Regenerar (locks) / Editar / Trocar direção → Publicar link público → Mensagem adaptativa
```

No painel: **Prospect → Prévias → "Criar com direção criativa"**. A prévia abre em `/preview/<id>` (página com dispositivos, score, bloqueios, regenerar, publicar).

## 1. Pesquisa pública (`src/server/modules/research.ts`)

Roda quando o prospect tem **site, Instagram, Google Maps ou links** e ainda não foi pesquisado (ou ao clicar "Pesquisar de novo"). Visita cada fonte com Playwright (máx. 6, ~15 s cada) e **só extrai o que está publicado**: serviços (títulos/itens com palavras de serviço), frases de posicionamento (title/h1/description), horários, telefones, endereços, unidades, redes sociais, cores do CSS e tipos de conteúdo (fotos, vídeos, depoimentos, produtos).

- Instagram: só a bio pública (`og:description`); se a página pedir login, a fonte é marcada **bloqueada** e ignorada.
- Cada fonte registra `{ok, error, found[]}`; o painel mostra **o que foi encontrado e de onde**.
- Nunca inventa: se nada verificável for encontrado, o site usa apenas os dados da ficha.
- Salvo em `prospects.research`; alimenta o DNA (serviços, posicionamento, cores, unidades).

## 2. BusinessDNA (`src/engine/dna.ts`)

Perfil do negócio derivado por regras, sem IA:

| Campo | Como é decidido |
| --- | --- |
| `industry` / `subIndustry` | segmento + palavras-chave em nome, serviços, observações e pesquisa (ex.: "polimento/PPF/vitrificação" em oficina → **Estética automotiva**; "luxo/premium" → nível luxury; "24h/emergência" → urgência) |
| `visualPersonality`, `motionPersonality`, `tone`, `conversionGoal` | tabela base por segmento (20) + ajustes da sub-indústria |
| `keyServices` / `priorityServices` | serviços cadastrados > pesquisa; ranqueados por relevância ao nicho |
| `assetProfile` + `heroPreference` | vídeo enviado → hero em **vídeo** primeiro; fotos fortes (análise sharp: heroScore) → cinematic/layered; sem fotos → editorial/split |
| `brandColors` / `brandMode` | cores informadas > cores dominantes do logo > cores do site pesquisado |
| `signals[]` | explicação legível de cada decisão (aparece no painel) |

## 3. Direções criativas (`src/engine/creative.ts`)

Catálogo de 14 direções (tema + família de hero + motion + composição + estratégia de paleta + ousadia). Cada uma tem uma função `fit(dna)`; as 3 de maior score **com tema/hero/composição distintos** são propostas, cada uma com `why[]`. A configuração **Criatividade** (Conservador / Equilibrado / Ousado, em Configurações) penaliza direções mais ousadas que o nível. **"Escolha por mim"** usa a primeira.

Paleta: cor da marca vira destaque só se tiver contraste ≥ 3:1 com o fundo do tema; fundo da marca só se combinar com o modo (claro/escuro) do tema.

## 4. Composição adaptativa (`src/engine/compose.ts`)

8 arquétipos de composição (automotive-showcase, editorial-portfolio, trust-booking, local-conversion, catalog-sales, cinematic-story, technical-grid, minimal-luxury). Cada um reage a: vídeo disponível, quantidade/força das fotos (galeria filmstrip/stacked/editorial ou antes-e-depois), nº de serviços, densidade de conteúdo, nº de unidades (seção **Nossas unidades**), criatividade (marquee extra) e **seed** (regenerar = seed+1: troca variantes, inverte duas seções do miolo, liga/desliga marquee).

Famílias de hero: `video`, `cinematic` (fullscreen), `editorial` (tipografia gigante), `showcase` (serviços em cards), `layered` (fotos em camadas), `numbers` (split + números), `conversion`. Headline e CTA final são gerados a partir dos **serviços reais** e do objetivo de conversão (várias estruturas, siglas preservadas).

Motion: o perfil (`elegant`, `performance`, `technical`, `editorial`, `playful`, `minimal`, `cinematic`) vai para `<html data-motion>`; o runtime GSAP muda distância, duração, easing, stagger, zoom de imagem e cursor glow por perfil.

**Locks**: caminhos JSON (`pages.0.sections.1.props.headline`, `pages.0.sections.4`) preservados ao regenerar (`applyLocks`). A página da prévia tem cadeados por título/subtítulo e por seção.

## 5. Vídeo (`src/server/modules/assets.ts`, `uploads.ts`)

Upload aceita MP4/WebM/MOV/M4V até 80 MB. Com `ffmpeg`/`ffprobe` no sistema (ou `FFMPEG_PATH`): metadados (duração, resolução, codec), **poster WebP** e, em segundo plano, **otimização para MP4 720p sem áudio (≤ 45 s)** quando é MOV, > 12 MB ou > 1080p — a prévia usa a versão otimizada quando existe. Sem ffmpeg, o vídeo entra assim mesmo (sem poster/otimização; aviso no painel).

Papéis por asset (Ficha): **Automático / Hero / Galeria / Fundo / Não usar**. O hero em vídeo renderiza `<video autoplay muted loop playsinline poster>` com fallback de imagem; o runtime pausa fora da tela e desliga com `prefers-reduced-motion`/Save-Data. O arquivo é copiado para `assets/video/` do site (funciona publicado).

## 6. Publicar prévia (`src/server/modules/publish.ts`)

Providers plugáveis: **Netlify** (`NETLIFY_AUTH_TOKEN` no `.env` do backend; site `<cliente>-preview`, atualizado no mesmo site a cada publicação) e **mock** (`PUBLISH_PROVIDER=mock`: copia para `data/published/<slug>/`, servido em `/published/<slug>/`). Sem provider configurado, o botão fica desabilitado com a mensagem do que configurar. O resultado fica em `previews.published` (URL, provider, slug, data) e é usado pelas mensagens.

## 7. Mensagens adaptativas (`src/server/modules/messages/adaptive.ts`)

5 tipos (primeira abordagem, enviar prévia, follow-up, preço, fechamento). Cada frase é condicional ao que **existe no banco**: site auditado (cita 2 oportunidades reais) ou sem site; prévia local ou publicada (link certo); vídeo usado; nº de unidades; proposta (preço/prazo) ou tabela padrão; nome do responsável. Curtas, humanas, sem inventar. Na aba Mensagens: "Mensagem adaptativa" → Copiar / Usar no editor / WhatsApp.

## 7b. Política "só fatos" (copy)

No fluxo V2 (`factsOnly`), o site **nunca** usa a copy genérica da biblioteca de segmentos para alegar algo específico. Regras aplicadas em `src/engine/generate.ts` + `factualContent()` em `compose.ts`:

- **Entra**: serviços cadastrados (descrição só se informada), diferenciais informados ou extraídos de fonte verificada, unidades/endereço/horário, cidade, posicionamento da pesquisa, frases genéricas sem alegação ("Chame no WhatsApp", "Como funciona").
- **Nunca entra**: garantia, anos de experiência, certificações, equipe especializada, equipamentos modernos, peças de qualidade, números, avaliações/depoimentos, diferenciais inventados, badges do hero. Seções que dependeriam disso (depoimentos, números, equipe, comparativo, "projetos" fictícios) são **omitidas**; "Sobre", FAQ, marquee e "Como funciona" são montados a partir dos dados reais.
- **Guarda**: `unverifiedClaims()` em `src/qa/creative.ts` varre toda a copy do site contra os fatos fornecidos e vira o check **"Copy sem alegações não fornecidas"** do Creative QA (para estética automotiva também bloqueia linguagem de oficina mecânica/diagnóstico). O modo clássico V1 continua com a biblioteca completa.

## 8. Creative QA (`src/qa/creative.ts`)

Score 0–100 por prévia: assets reais, hero alinhado ao DNA, headline com serviços, variedade de seções, contraste (WCAG) da paleta, CTA + contato + WhatsApp, unidades quando há várias, sem lorem, e **similaridade** com as outras prévias do cliente (fingerprint de seções/variantes; ≥ 85% = aviso "quase igual"). Visível na página da prévia.

## 9. API (resumo)

```
POST /api/prospects/:id/directions            { refresh?, research? } → research, dna, directions[3]
POST /api/prospects/:id/previews              { directionId | 'auto', seed?, locks? }  (sem directionId = fluxo V1)
POST /api/previews/:id/regenerate             { locks?, directionId? } → nova prévia (seed+1)
PUT  /api/previews/:id/locks                  { locks[] }
GET  /api/previews/:id/creative-qa
GET  /api/publish/status · POST /api/previews/:id/publish
PATCH /api/prospects/:id/uploads              { path, role }
POST /api/prospects/:id/messages/adaptive     { kind, previewId?, proposalId? }
```

## 10. O que é só regra vs. o que a IA pode melhorar (opcional)

Tudo acima funciona com `AI_PROVIDER=none`. A IA (quando configurada) continua restrita ao que já existia: resumo de auditoria e adaptação de tom de mensagens. DNA, direções, composição, copy, QA e publicação **não usam IA**.

## 10b. Vídeo: como o tipo do asset sobrevive de ponta a ponta

Upload valida o MIME e grava `kind`, `mime` e o arquivo com extensão derivada do MIME (`.mp4/.webm/.mov`); nomes são slugificados (sem espaços). Ao ler do banco, `normalizeAsset()` recompõe `kind` para assets antigos (gravado > MIME > extensão do caminho gravado pelo servidor; nunca pelo nome original). O composer só considera `kind: 'video'` para o hero; o fluxo V1 descarta vídeos das fotos; e o renderer **recusa** renderizar um caminho de vídeo como `<img>` (placeholder + aviso). O `<video>` sai com `<source>` WebM (se houver) antes do MP4, caminho copiado para `assets/video/` e URL encodada.

## 11. Limitações conhecidas

- Pesquisa depende do site permitir acesso; Instagram quase sempre só entrega a bio; Google Maps só o título. Fontes bloqueadas são ignoradas (e mostradas como tal).
- Playwright headless não reproduz H.264; o autoplay foi validado em teste com WebM e por atributos/arquivo no MP4. Em navegadores reais, MP4 H.264 toca normalmente.
- A publicação Netlify foi implementada sobre a mesma API já usada pelo deploy de projetos, mas **não foi executada contra a Netlify real** neste ambiente (sem token/rede). O provider mock cobre o fluxo ponta a ponta nos testes.
- O editor de conteúdo continua o formulário/JSON da V1 (atalho "Editar conteúdo" na página da prévia); não há editor visual drag-and-drop.
- Fingerprint/similaridade comparam estrutura (seções, variantes, tema, motion), não pixels.
