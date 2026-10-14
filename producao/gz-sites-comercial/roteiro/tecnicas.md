# Técnicas

Custo: R$ 0 / US$ 0. Nenhuma API de vídeo, nenhuma imagem paga, nenhuma locução.

## Ferramentas

| Camada | Ferramenta |
|---|---|
| Física e cena 3D | Three.js r170 vendored (`cenas/vendor/three.module.js`), relógio em `cenas/sim.mjs` |
| Render | Chrome headless, SwiftShader (WebGL 2), sem GPU. Captura em `edit/capture.mjs` (puppeteer-core), 1080×1920, JPEG qualidade 0,93 |
| Página e cartela | HTML canvas (`site/index.html`, `site/end.html`) |
| Som | Python + numpy, `audio/design.py`, 48 kHz estéreo, sem banco de música e sem TTS |
| Montagem | `edit/assemble.py` + ffmpeg 6.1, libx264, AAC |

## Relógio

Um único PCHIP em `WORLD_KEYS`. O voo físico cabe em ~0,125 s de mundo (da soltura em 0,26 s ao impacto em 0,385 s) e ocupa a tela de ~0,4 s a 11,0 s. O vão medido (`gap`) chega a 0 no quadro 330.

Constantes travadas: `BALL_R` 0,033, `BOWL_LOCAL_Y` 0,181, `SURFACE_R` 0,045, `W_RELEASE` 0,26, `W_IMPACT` 0,385, `P0` {0, 0,18, −0,06}, `P_REL` {0, 0,22, 0}, `V_REL` {0,02, 0,72, 6,2}, `G` 9,81. A taça segue `flightDir`.

## Desfoque

Média incremental no canvas 2D: fundo preto, cada subquadro entra com `source-over` e alfa `1/(i+1)`, o que dá peso igual `1/n`. Não se usa `lighter` — esse modo soma os passes e deixa fantasma aditivo no cromo e no antebraço.

Amostras: 8 no quadro 0; 64 enquanto a mão ainda pode estar no obturador (`screen < 0,25`); 8 até 0,48 s; 3 até 1,05 s; 1 no resto. O obturador, quando há mais de uma amostra, cobre meio quadro.

## Imagem

- Esfera: `MeshPhysical`, metalness 1, roughness baixa, raio 3,3 cm, a mesma malha o tempo todo.
- Taça: bojo com espessura e IOR 1,52. Na quebra, ~20 gomos com parede. Não é refração de herói.
- Mão: superfície implícita poligonizada em `cenas/build_hand.py`. Visível só nos primeiros 0,2 s, na borda do quadro.
- Ambiente: mapa equiretangular procedural, ACES, exposição 1,12.
- Site: canvas, fontes já servidas por gzsites.com.br, papel `#E4E5E0`, tinta `#111413`, acento `#0B6F66`. Sem métrica inventada.
- Cartela: monograma GZ, ponto `#0B6F66`, «GZ Sites», «Sites feitos para chamar atenção.», gzsites.com.br.

## Montagem

900 quadros, 30 fps, 1080×1920. JPEG 3D nos quadros 0–578. Crossfade 548–578 para o site. Site até 750. Crossfade 750–778 para a cartela. Cartela até 899. Grade leve na montagem. Master H.264 CRF 14, Rec.709, AAC 192 kbps, 48 kHz estéreo, versionado (~38 MB). Reels CRF 16 a partir do master. Sem ProRes. Sem marca d'água.

## Som

`audio/mix.wav`, 30,0 s, impacto alinhado a 11,0 s. Whoosh, ar baixo, corpo do impacto, tinidos, quinta grave, sino curto. Sem narração.
