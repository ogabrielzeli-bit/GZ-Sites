# Relatório de qualidade — O instante que ninguém consegue ignorar

Filme revisto quadro a quadro nos pontos críticos (arremesso, soltura, aproximação, contato, quebra, corte para a página, site, cartela) e por diferença média entre quadros. O arquivo julgado é o Reels exportado, não um still isolado.

## Ficha

| | |
|---|---|
| Duração | 30,0 s (900 quadros) |
| Resolução | 1080×1920 |
| fps | 30 constantes |
| Vídeo | H.264 High, yuv420p, Rec.709 |
| Áudio | AAC-LC estéreo, 48 kHz, 192 kb/s |
| Pico do mix | 0,891 (−1,0 dBFS), sem clip |
| Narração | Não |
| Custo | R$ 0 / US$ 0 |

## Critérios

1. **Ação forte nos primeiros quadros; os 2 primeiros segundos criam curiosidade; parece real e profissional.** Passa. O quadro 0 já está no gesto: antebraço, punho e esfera de cromo, taça no fundo. No quadro 8 o braço está estendido com desfoque de movimento e a esfera ainda na mão, apontada para a taça. No quadro 12 a mão saiu e a esfera está sozinha no ar. A luz lê no telefone. A mão é um modelo, não um scan — ver limitações.

2. **A esfera avança; a distância até o vidro diminui; a tensão sobe; a espera interessa.** Passa. A diferença média entre quadros (amostra 180×320) é 11,7 do quadro 52 ao 180, 27,7 do 180 ao 300 e 13,1 do 300 ao 330. O vão medido chega a zero no quadro 330, aos 11,0 s. O whoosh cai de 0,39 de pico no primeiro segundo para ~0,03 entre 4 s e 10 s. Não há loop nem zoom em foto.

3. **O impacto é visível e coerente; o slow motion funciona; a destruição é um prêmio.** Passa, com limite de resolução da quebra. O contato está no quadro 330. As rachaduras são escuras e nascem junto do ponto de contato, não uma fita branca. Os cacos têm espessura e faces curvas. A esfera continua no quadro. A diferença 340–400 é 34,9: a quebra se move. São 20 cacos, não uma fratura fina.

4. **A destruição vira criação com continuidade e propósito.** Passa. Até 15,45 s a câmera do impacto segura os cacos subindo. Um travelling até o plano da página atravessava o vidro e perdia o assunto; foi substituído por um corte para o plano frontal, onde os mesmos cacos seguem até as linhas da página. A diferença 464–500 é 5,3 (linhas nascendo, cacos assentando). O crossfade para o site, quadros 548–578, usa o mesmo fio. Não é um corte para um computador aleatório nem um morph quebrado.

5. **A ligação com fazer sites se entende; o site parece caro; a identidade e a URL se leem.** Passa. A página é código (canvas), com a paleta real da GZ Sites, tipo nítido e sem métrica inventada. Título do filme: «O olhar chega. / E permanece.» A cartela desenha o GZ geométrico com o ponto `#0B6F66`, depois «GZ Sites», «Sites feitos para chamar atenção.» e gzsites.com.br, com margem larga.

6. **Fluido, sem quadros falhos, mix profissional, ainda bom no telefone.** Passa, com as ressalvas abaixo. Não há faixa de quantização no chão (o desfoque foi acumulado em float). O pico do impacto, 0,86, é o evento mais alto. A cartela no quadro 890 continua legível depois da grade. O plano da página, depois de assentar, fica quieto de propósito até o crossfade; a cartela final também segura, o que é o lugar dela.

7. **Um estranho assiste até o fim; o final recompensa; parece campanha, não montagem de IA.** Passa. Uma ação, um objeto, uma ideia: o instante que não se ignora vira uma página. Sem narração explicando o truque, sem glitch, sem depoimento, sem número inventado.

## Som

Contraste medido por segundo (RMS / pico, normalizado):

- 0 s: arremesso, pico 0,39
- 1–7 s: queda contínua até pico ~0,02
- 8–10 s: ar muito baixo, pico 0,033
- 11 s: impacto, pico 0,86
- 12–14 s: tinidos
- 15 s: silêncio (pico 0) no corte para a página
- 16–24 s: quinta justa e o tom da página
- 26,7 s: sino curto no monograma

Sem música de estoque. Sem voz.

## Limitações que ficam

- O punho é uma malha de surface nets, dedos fundidos, antebraço sem rosto. Lê como braço em movimento. Não é uma mão fotografada.
- A quebra tem 20 cacos com espessura. As rachaduras são tubos escuros, não uma simulação de fratura de alta resolução. A haste da taça permanece visível no macro e, em alguns quadros, cruza a esfera.
- A passagem do macro para a página é um corte, não um travelling. O travelling testado atravessava o plano e deixava o quadro vazio. O corte foi a solução que mantém o assunto.
- Não há voz humana brasileira neste ambiente. TTS foi recusado.
- O render é SwiftShader (Three.js), não um path tracer. Cromo, vidro e luz lêem no telefone; não são uma chapa de cinema.
- Depois que as linhas assentam, por volta de 17,2 s, a placa 3D fica quase parada até o crossfade aos 18,3 s. É uma espera curta sobre o desenho já fechado, não um quadro travado no meio da ação. A cartela final também permanece, de propósito.

## Veredito

O filme passa o conjunto dos critérios. Não há gasto pago pendente: o que ainda melhoraria (mão escaneada, fratura mais fina, travelling sem perder o assunto) é refinamento, não um furo que impeça a peça de funcionar.
