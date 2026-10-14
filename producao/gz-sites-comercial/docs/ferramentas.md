# Ferramentas e técnicas

Custo: R$ 0 / US$ 0. Nenhuma geração paga, nenhum crédito de vídeo.

## O que existia

Não havia `GZ_Sites_Comercial_FINAL_9x16.mp4` no repositório nem no home, nem um vídeo de referência de projétil. Nada da versão rejeitada foi reaproveitado. O diagnóstico dos 12 defeitos veio do pedido: esfera sem energia, câmera que não vendia a trajetória, quadro congelado, clímax fraco, salto sem lógica para o digital, narração artificial, cara de demo de IA, som sem contraste.

## Máquina

Linux, 4 CPUs, sem GPU (`/dev/dri` ausente). Blender não está instalado. Render 3D em Chrome headless com SwiftShader (WebGL 2), Three.js r170 vendored em `cenas/vendor/three.module.js`. Captura por `edit/capture.mjs` (puppeteer-core + Chrome do sistema), canvas em resolução nativa — sem upscale.

Um quadro de prova em 1080×1920 ficou na casa de 0,3–2,5 s. O filme inteiro em EEVEE/Cycles sem GPU não cabia no prazo com qualidade. A escolha foi híbrida: simulação e materiais no Three, página e cartela em canvas 2D, som em numpy.

## Imagem

- Relógio único em `cenas/clock.mjs`, carregado por `cenas/take.js` (`film.html` aponta para esse módulo; `film.js` é a mesma cena). PCHIP crescente. O contato é aos 11,0 s. A esfera não para.
- Esfera: `MeshPhysical`, metalness 1, roughness 0,065, raio 3,3 cm, a mesma malha o tempo todo.
- Taça: perfil de bojo com espessura e IOR 1,52. Na quebra, o bojo vira 20 cacos (10 gomos × 2 faixas) com parede interna, normais soldadas. A rachadura nasce no ponto de contato. A esfera continua, mais lenta no relógio de tela, para permanecer no quadro.
- Mão: superfície implícita (cápsulas + smooth-min) poligonizada por surface nets em `cenas/build_hand.py` → `cenas/hand.obj`. Punho fechado e antebraço, sem rosto. Não é um scan. Sai do quadro depois da soltura.
- Ambiente: mapa equiretangular procedural (softbox quente, recorte frio, sala grafite), ACES, exposição 1,12. Poeira em pontos. Desfoque de movimento por acumulação em float — `globalAlpha` em canvas de 8 bits quantizava o chão em faixas.
- Transição: a câmera do impacto segura até 15,45 s. O travelling que atravessava o plano da página perdia o assunto e foi trocado por um corte para o plano frontal, com os cacos a caminho das mesmas linhas de `site/index.html`. Crossfade para o canvas nos quadros 548–578. Não é morph generativo.
- Site: HTML/canvas, fontes OFL (Archivo, Newsreader, Schibsted Grotesk, IBM Plex Mono), cores do gzsites.com.br — papel `#E4E5E0`, tinta `#111413`, acento `#0B6F66`. Sem foto de terceiros, sem métrica inventada. O título desta página é «O olhar chega. / E permanece.» A frase da cartela é a do pedido.
- Cartela: traço vetorial do monograma GZ no canvas, ponto `#0B6F66`, depois «GZ Sites», a frase do filme e a URL. Texto nítido, não um passe 3D com denoiser.
- Grade leve e dither na montagem (`edit/assemble.py`), Rec.709, yuv420p.

## Som

`audio/design.py`, 48 kHz estéreo, numpy. Sem música de estoque e sem narração.

1. Whoosh do braço e transiente da soltura.
2. Whoosh com filtro variável contínuo (um polo, sem cortes de bloco) que desce com o tempo.
3. Ar muito baixo entre ~7,5 s e 11 s.
4. Impacto: corpo em 72/48 Hz, rachaduras espaçadas, parciais inarmônicos de vidro.
5. Tinidos de caco.
6. Quinta justa baixa (196/294 Hz) na passagem para a página.
7. Sino curto no monograma (a partir de 26,7 s).

Pico limitado a −1 dBFS se passar. O silêncio é de propósito: o RMS do filme fica baixo porque a maior parte da tensão não tem trilha.

## Montagem

ffmpeg 6.1, libx264 high, AAC 192 kbps, 48 kHz, 30 fps constantes, `+faststart`. Master CRF 14 (~38 MB; o CRF 10 passava de 100 MB e o GitHub recusa o push). Reels CRF 16, a partir do master. Sem marca d'água.

## Narração

Não entrou. Não há neste ambiente uma voz masculina brasileira que soe humana. TTS robótico era exatamente o defeito 9. A frase proposta não foi dita. A imagem carrega o argumento.
