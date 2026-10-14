# Relatório de qualidade

Este não é um comercial de alta velocidade terminado só porque existe um MP4. É o melhor filme local que dá para entregar com a fotografia travada. A mão, a fratura e a passagem para o site continuam abaixo de um anúncio de estúdio.

Custo: R$ 0 / US$ 0.

## O que foi revisto

- Sequência 3D completa: 579 JPEG, quadros 0000–0578, 1080×1920.
- Stills em resolução cheia: 0000, 0002, 0008, 0011, 0040, 0120, 0330, 0375, 0520, 0550, 0570.
- O vão medido no render travado: quadro 330 = 0,0000. Quadro 0000 ≈ 0,835 m. A distância cai o tempo todo até o contato.
- MP4 de Reels, stills em 0 s, 1,3 s, 4 s, 11 s, 12,5 s, 17 s, 21 s e 29 s.
- `ffprobe` dos dois arquivos.

| Tempo | O que se vê |
|---|---|
| 0 s | Antebraço na borda, esfera de cromo, taça. Sem fantasma aditivo. Sem marca d'água. |
| 1,3 s | Plano lateral. Esfera e taça com vão claro. A mão já saiu. |
| 4 s | O mesmo eixo, mais perto. O vão encolheu. |
| 11 s | Contato. A esfera encosta na boca da taça. |
| 12,5 s | Cacos grossos em volta da esfera. A haste continua. |
| 17 s | Cacos a caminho das linhas da página. A esfera ainda está no quadro, embaixo. |
| 21 s | Página legível: GZ.sites, «O olhar chega.», três ofícios. Sem métrica inventada. |
| 29 s | Cartela: monograma GZ, ponto verde, «Sites feitos para chamar atenção.», gzsites.com.br. |

## Arquivos

| Peça | Caminho | No git |
|---|---|---|
| Master H.264 CRF 10 | `producao/gz-sites-comercial/exports/GZ_Sites_Comercial_9x16_master.mp4` | Não. 127 MB, acima do limite de ~80 MB. Fica na máquina de render. |
| Reels CRF 16 | `producao/gz-sites-comercial/exports/GZ_Sites_Comercial_9x16.mp4` | Sim. ~18 MB. |
| Áudio | `producao/gz-sites-comercial/audio/mix.wav` | Sim. 30,0 s, 48 kHz, estéreo. |
| Decupagem | `producao/gz-sites-comercial/roteiro/storyboard.md` | Sim. |
| Técnicas | `producao/gz-sites-comercial/roteiro/tecnicas.md` | Sim. |
| Cena | `producao/gz-sites-comercial/cenas/film.js`, `cenas/sim.mjs`, `cenas/film.html` | Sim. |
| Página e cartela | `producao/gz-sites-comercial/site/index.html`, `site/end.html` | Sim. |
| Montagem | `producao/gz-sites-comercial/edit/assemble.py`, `edit/capture.mjs` | Sim. |

ffprobe do Reels: 30,016 s (o AAC acrescenta um priming; o master fecha em 30,000 s), 1080×1920, 30 fps, H.264 High, yuv420p, Rec.709, AAC LC estéreo 48 kHz. Sem faixa de marca d'água.

## O que ainda fica aquém

- A mão é um vislumbre na borda, com antebraço liso. Não é um arremesso anatômico.
- Os planos abertos deixam esfera e taça pequenos no campo escuro. O suspense lê melhor a partir de ~1,3 s, quando a câmera fecha.
- A taça é uma coupe reconhecível, sem refração de herói. Os cacos são cerca de 20 gomos grossos, não um vidro filmado em alta velocidade.
- Há risco de banda de JPEG nos degradês largos. A montagem soma um grão leve.
- A passagem 548–578 é um crossfade desenhado, não um morph. A esfera ainda pode estar no quadro por volta do 520. De ~18,3 s em diante a placa 3D segura: câmera e cacos já chegaram, e os quadros 550–578 saem iguais. A mudança visível nessa hora é o crossfade para o site.
- O site é legível e elegante, não é motion de nível Apple. Não há número inventado.
- Não há ProRes. O master é H.264 CRF 10; o Reels é CRF 16.

## O que não foi reaberto

Câmera e física não foram reabertas por gosto. O que se recapturou foi defeito: o composite `lighter` (fantasma aditivo) trocado pela média `source-over`, amostras a mais só no arremesso para dissolver as faixas do antebraço, e quadros que tinham sido sobrescritos fora do relógio travado (mão ainda em quadro depois da soltura, e o final 550–578 copiado 29 vezes). O contato no quadro 330 permaneceu em zero.
