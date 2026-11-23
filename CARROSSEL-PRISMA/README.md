# Carrossel Prisma — como usar

Seis slides animados (1080 × 1350, 8 s, 120 BPM, loop sem emenda), desenhados em Canvas 2D com som sintetizado
em Web Audio. Briefing em `BRIEF.md`, roteiro tempo a tempo em `STORYBOARD.md`.

## Arquivos prontos
- `out/slide-01.mp4` … `out/slide-06.mp4`: um vídeo por slide, para subir como carrossel no Instagram.
- `out/carrossel-completo.mp4`: os seis em sequência (48 s), para revisar.
- `out/panorama.png`: os seis lado a lado, mostrando a esteira e o prisma se desmontando nas costuras.
- `out/folha-01.png` … `out/folha-06.png`: folhas de contato (12 quadros por slide) tiradas dos MP4.

## Prévia ao vivo
```bash
node tools/serve.mjs      # abre um servidor local e imprime a URL
```
- `carrossel.html`: swipe como no Instagram, botão de som.
- `slide.html?n=3`: um slide em loop. `slide.html?n=3&t=4.0` congela num instante.

## Gerar de novo
Requer Node 20, Google Chrome em `/usr/bin/google-chrome`, ffmpeg com libx264 e o `puppeteer-core` instalado em
`../tools/visual`. O Chrome sobe com `--enable-gpu --use-angle=gl`, porque sem GPU cada quadro leva segundos.
Para forçar software: `GFLAGS= node tools/render.mjs`.
```bash
node tools/render.mjs            # todos os slides (~2 min cada, Chrome com GPU)
node tools/finish.mjs            # carrossel-completo.mp4 + panorama.png
node tools/render.mjs 2,5        # só alguns
node tools/sheet.mjs 4           # folha de contato de um slide em out/sheet-04.png
node tools/frame.mjs 6 4.1       # um quadro em resolução cheia
```
O render também mede a emenda do loop (`seam wrap`): diferença média de pixels entre o último quadro e o primeiro,
comparada com a de dois quadros vizinhos comuns.

## Estrutura
- `engine/core.js`: tempo, easing (back, elastic, bounce, spring), ruído periódico, câmera com tremor e parallax.
- `engine/draw.js`: robôs (PRI e mini-bots), prisma 3D a partir do símbolo oficial, estilhaços, raios, fagulhas,
  ondas de choque, fundo em camadas, esteira, prismas das costuras e HUD.
- `engine/audio.js`: bateria, baixo, arpejo, pad e efeitos, com a cauda dobrada sobre o início para o loop.
- `engine/stage.js`: pipeline de cada quadro (fundo, esteira, cena, frente, flash, aberração cromática, grão).
- `slides/s1.js` … `slides/s6.js`: a coreografia de cada slide.
