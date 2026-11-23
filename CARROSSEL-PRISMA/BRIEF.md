# BRIEF — Carrossel animado Prisma Technologies

## Marca
**Prisma Technologies** — desenvolvimento de software sob medida. Seis desenvolvedores com habilidades
diferentes e uma mesma direção: transformar ideias em soluções que impulsionam negócios.

## Campanha
> **Toda a estrutura tecnológica da sua empresa em um lugar só.**

Cinco frentes, um fornecedor:

1. Desenvolvimento de software e sistemas
2. Edição de vídeo
3. Marketing para redes sociais
4. Tráfego pago
5. Análise de dados

Oferta: **R$ 2.000 por mês**.

## Objetivo
Parar a rolagem no Instagram e fazer a pessoa ver o carrossel inteiro, de preferência duas vezes.
Tem que parecer anúncio animado de agência de primeira linha, não post parado com dois elementos deslizando.

## Clima
Ousado, tecnológico, cores marcantes dentro da paleta da marca. Tipografia grande, grossa, pesada.
Robôs como personagens: a robô principal (PRI) e um enxame de mini-robôs que constroem tudo na tela.

## Paleta (tokens do site)
| Papel | Cor |
|---|---|
| Fundo (ink) | `#0b1220` / `#101a30` |
| Acento principal (lime) | `#b8ff3a` |
| Acento secundário (lilac) | `#7b6cff` |
| Profundidade (violet deep) | `#4b39d9` |
| Verde do símbolo | `#5fd08a` / `#9be07a` |
| Texto | `#f4f5f8` |

Símbolo: o prisma de quatro faces do logo (lime vazada, lilac, verde, violeta), redesenhado em código
como modelo 3D a partir das coordenadas do PNG oficial.

## Tipografia
- **Oswald 700**: manchetes, enorme e condensada.
- **Exo 2 800/900**: marca, números, preço.
- **Roboto Mono**: HUD, código, métricas.

## Formato
- 6 slides, **1080 × 1350 px (4:5)**. O pedido dizia "1080x2350 (4:5)"; 4:5 em 1080 de largura é 1350, então
  segui a proporção 4:5, que é a do feed.
- Um MP4 por slide, **8 s cada = 4 compassos a 120 BPM** (1 tempo = 0,5 s, 1 compasso = 2 s).
- 30 fps, H.264 yuv420p, AAC 48 kHz estéreo.
- **Loop sem emenda**: o quadro em t = 8 s é idêntico ao quadro em t = 0. Fundos, partículas e câmera são
  funções periódicas de período 8 s. Toda animação de evento termina no mesmo estado em que começa.
- Tudo em HTML + CSS + JS com **Canvas 2D**. Robôs, prisma, painéis, gráficos e tipografia desenhados em
  código. Nenhuma foto, nenhum asset rasterizado além das fontes.
- Som e música **sintetizados em código** (Web Audio, `OfflineAudioContext`): bateria, baixo, arpejo, pad e
  efeitos (laser, vidro quebrando, impacto, carimbo, whoosh, teclado, moeda, power-down).

## Carrossel sem emenda
- **Linha de montagem**: uma esteira corre na base dos seis slides, alinhada em altura, e atravessa cada
  borda.
- **O prisma sendo desmontado**: em cada costura entre dois slides há um prisma em cima da esteira, cortado
  pela borda (metade em cada slide). Da costura 1|2 até a 5|6 ele aparece cada vez mais desmontado. Quem passa o
  dedo vê o símbolo se desfazendo. No slide 6 ele é remontado inteiro: "em um lugar só".
- **Passagem de bastão**: no fim de cada slide um robô voa pela borda direita. O slide seguinte começa com ele
  entrando pela esquerda, na mesma altura.

## Regras de movimento
- Easing de verdade: back (overshoot), elastic, bounce, squash & stretch. Zero movimento linear em objetos.
- Três camadas de profundidade com parallax: fundo (grade, poeira, tipografia gigante vazada), meio (ação) e
  frente (bokeh, fagulhas).
- Partículas sempre presentes: robôs, raios, fagulhas, estilhaços.
- Impacto tem consequência: tremor de câmera, flash, onda de choque, poeira ao pousar.
- Tipografia sempre se mexe (cai, carimba, queima, fatia, rola como caça-níquel, monta em pixels). Nunca fade
  simples.
- Pelo menos três coisas se movendo em qualquer quadro.
- Todo acerto cai numa batida (grade de 0,5 s, subdivisões em 0,25 s).

## Entregáveis (nesta pasta)
- `BRIEF.md`, `STORYBOARD.md`
- `slide.html?n=1..6`: render de um slide, com `window.__frame(t)` para captura quadro a quadro.
- `carrossel.html`: prévia ao vivo com swipe, como no Instagram, com som.
- `engine/`, `slides/`: código-fonte.
- `tools/render.mjs`: gera `out/slide-01.mp4` … `out/slide-06.mp4`, a prévia `out/carrossel-completo.mp4`
  e as folhas de contato para revisão.
