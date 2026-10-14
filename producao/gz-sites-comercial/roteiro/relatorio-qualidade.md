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
| Master H.264 CRF 14 | `producao/gz-sites-comercial/exports/GZ_Sites_Comercial_9x16_master.mp4` | Sim. ~38 MB. O CRF 10 passava de 100 MB. |
| Reels CRF 16 | `producao/gz-sites-comercial/exports/GZ_Sites_Comercial_9x16.mp4` | Sim. ~18 MB. |
| Áudio | `producao/gz-sites-comercial/audio/mix.wav` | Sim. 30,0 s, 48 kHz, estéreo. |
| Decupagem | `producao/gz-sites-comercial/roteiro/storyboard.md` | Sim. |
| Técnicas | `producao/gz-sites-comercial/roteiro/tecnicas.md` | Sim. |
| Cena | `producao/gz-sites-comercial/cenas/take.js`, `cenas/clock.mjs`, `cenas/film.html` | Sim. O HTML carrega `take.js`. |
| Página e cartela | `producao/gz-sites-comercial/site/index.html`, `site/end.html` | Sim. |
| Montagem | `producao/gz-sites-comercial/edit/assemble.py`, `edit/capture.mjs` | Sim. |

ffprobe do Reels: 30,016 s (o AAC acrescenta um priming; o master fecha em 30,000 s), 1080×1920, 30 fps, H.264 High, yuv420p, Rec.709, AAC LC estéreo 48 kHz. Sem faixa de marca d'água.

## O que ainda fica aquém

- A mão é um modelo de cápsulas, com antebraço liso e dedos fundidos. No quadro 8 o braço está estendido, com desfoque, soltando a esfera. Não é um scan.
- Os planos abertos deixam esfera e taça pequenos no campo escuro. O suspense lê melhor a partir de ~1,3 s, quando a câmera fecha.
- A taça é uma coupe reconhecível, sem refração de herói. Os cacos são cerca de 20 gomos grossos, não um vidro filmado em alta velocidade.
- Há risco de banda de JPEG nos degradês largos. A montagem soma um grão leve.
- Aos 15,45 s a câmera corta do macro para o plano da página. O crossfade 548–578 é desenhado, não um morph. A placa 3D assenta por volta de 17,2 s e segura até esse crossfade. A esfera ainda está no quadro nesse plano.
- O site é legível e elegante, não é motion de nível Apple. Não há número inventado.
- Não há ProRes. O master versionado é H.264 CRF 14; o Reels é CRF 16.

## O que não foi reaberto

O contato no quadro 330 permaneceu em zero. O que mudou na cena final foi o plano depois da quebra: um travelling que atravessava o vidro esvaziava o quadro, e no lugar entrou um corte para o plano frontal aos 15,45 s. O crossfade para o site continua nos quadros 548–578.
