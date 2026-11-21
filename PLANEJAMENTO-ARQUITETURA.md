# Prisma Technologies — Planejamento da arquitetura front-end

> Documento de planejamento. Nenhum código de produção foi escrito ainda.
> Fonte da verdade visual: `Landing Page v6.html` (bundle exportado; o conteúdo real foi extraído e analisado — ver Apêndice A).
> Meta: reproduzir o modelo **exatamente igual** (layout, textos, cores, tipografia, tempos de animação) em **React (JavaScript)**, com o elemento 3D (o prisma) feito em **Three.js**.

---

## 1. Resumo do que existe no modelo

O arquivo é uma página única, escura, com uma sequência de "construção" na abertura: cinco agentes (pequenos triângulos com rótulo tipo `ag.01 type(hero.title)`) "constroem" a hero na frente do usuário. Depois, cada seção é "construída" pelos agentes quando entra na tela.

| Bloco | id | Fundo | Agentes (`data-ags`) | Conteúdo |
|---|---|---|---|---|
| Hero | `#topo` | escuro `#0B1220` | sequência própria (5 agentes) | logo, kicker, H1, parágrafo, 2 botões, **prisma**, rede de nós animada, "Role" |
| Sobre | `#sobre` | escuro | `[2,3]` | foto da equipe, "Somos 6 desenvolvedores", 4 pilares |
| 01 Software | `#software` | **claro** `#F4F5F8` | `[0,1]` | 4 cards de serviço + 3 projetos (2 com vídeo) |
| 02 Motion e Vídeo | `#motion` | escuro | `[2,3]` | 6 cards + 3 projetos (placeholders) |
| 03 Landing Pages | `#landing` | **claro** | `[4,0]` | 6 cards + 3 projetos (placeholders) |
| Contato | `#contato` | escuro + brilho lima | `[1,2]` | "Mais que código, soluções reais." + 2 CTAs |
| Rodapé | `#rodape` | escuro | `[1]` | copyright + slogan |

Elementos fixos (fora do fluxo): botão **Menu** (topo direito), **drawer** lateral do menu + backdrop, **FAB** "Iniciar projeto" (aparece após a intro), **canvas dos agentes** (tela inteira, `pointer-events:none`), **chip de status** (`>_ ag.01 › type(hero.title)  42%` + barra), **cover** preto que some no primeiro frame.

---

## 2. Stack

| Item | Escolha | Motivo |
|---|---|---|
| Build | **Vite** | rápido, simples, code-splitting nativo |
| UI | **React 18.3.1** (JavaScript/JSX) | mesma versão usada pelo modelo |
| 3D | **three** + **@react-three/fiber 8** + **@react-three/drei 9** | R3F é a forma idiomática de usar Three.js em React; v8 é a linha compatível com React 18 |
| Estilo | **CSS Modules** + variáveis CSS (tokens) | o modelo usa valores exatos (clamp, rgba); CSS puro preserva tudo 1:1, sem tradução para utilitários |
| Fontes | **@fontsource** (Roboto, Oswald, Exo 2, Roboto Mono) | self-hosted, mesmos pesos do modelo |
| Rotas | **react-router-dom 6** | o menu aponta para "Serviços" e "Projetos" (páginas ainda não existem — ver §11) |
| Estado | refs + 1 Context | animação roda por frame; `setState` por frame seria lento |
| Qualidade | ESLint + Prettier | padrão |

Versões exatas são fixadas no `package.json` na Fase 1.

**Regra de ouro:** tudo que é animação por frame (rede, agentes, revelação de texto, prisma) é **imperativo via refs** dentro de um único loop `requestAnimationFrame`, igual ao modelo. React só monta a estrutura e o conteúdo.

---

## 3. Design tokens (extraídos do modelo)

### Cores

| Token | Valor | Uso |
|---|---|---|
| `--ink` | `#0B1220` | fundo escuro, texto em seção clara |
| `--paper` | `#F4F5F8` | texto claro, fundo de seção clara |
| `--lime` | `#B8FF3A` | cor de destaque, CTAs, links |
| `--lilac` | `#7B6CFF` | segunda cor de marca, números do menu |
| `--violet-deep` | `#4B39D9` | rótulo "Projeto 0X" em seção clara |
| `--card-light-hover` | `#FFFFFF` | hover de card em seção clara |
| `--placeholder-light` | `#E9EBF0` | fundo de placeholder de projeto |
| `--text-dim` | `rgba(244,245,248,0.78)` / `0.7` / `0.5` | parágrafos, rodapé |
| `--text-dim-light` | `rgba(11,18,32,0.7)` | parágrafos em seção clara |
| `--line` | `rgba(244,245,248,0.06–0.16)` | bordas e divisores |
| `--line-light` | `rgba(11,18,32,0.16)` | bordas em seção clara |
| pilares | `#B8FF3A`, `#9BE07A`, `#9A8CFF`, `#7B6CFF` | losangos dos 4 pilares |
| seleção | `rgba(184,255,58,0.35)` | `::selection` |

Cor dos agentes: interpolação linear lima → lilás, `mix(i/4)` para i = 0..4.

### Tipografia

| Família | Pesos | Uso |
|---|---|---|
| Oswald | 400, 500, 600 | títulos (H1/H2/H3), botões, menu — sempre `uppercase` |
| Roboto | 300, 400, 500 | corpo |
| Roboto Mono | 400 | tags, "01 / Software", rótulos dos agentes, chip |
| Exo 2 | 500, 700 | wordmark "PRISMA / TECHNOLOGIES" |

Tamanhos-chave: H1 `clamp(42px,5.6vw,76px)` lh 1.04 · H2 seção `clamp(34px,4.4vw,60px)` lh 1.05 · H2 sobre `clamp(32px,4vw,52px)` · H2 contato `clamp(36px,5vw,64px)` · kicker 12px `letter-spacing:0.36em` · botões 14px `letter-spacing:0.24em`.

### Layout

- Gutter lateral: `clamp(20px,5vw,72px)` · largura máxima: `1240px` (contato: `820px`)
- Padding vertical das seções: `clamp(80px,13vh,150px)` (sobre `clamp(72px,12vh,140px)`, contato `clamp(80px,14vh,160px)`)
- Grids responsivos sem media query: `repeat(auto-fit, minmax(min(100%, Npx), 1fr))` com N = 420 (hero), 400 (sobre), 440 (cabeçalho de seção), 300 (cards e projetos)
- Raio: `2px` (botões, ícones), `3px` (chip)
- Cards em grade "colada": `gap:0` + `box-shadow:0 0 0 0.5px <line>` (borda de meio pixel compartilhada)
- Detalhe de canto: cantoneira lima de 2px no canto inferior esquerdo (56px na foto, 32px nos projetos)

---

## 4. Estrutura de pastas

```
prisma/
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── favicon.svg                  # o ícone do prisma (4 polígonos)
└── src/
    ├── main.jsx                     # monta <App/>, importa fontes e CSS global
    ├── App.jsx                      # rotas
    ├── pages/
    │   └── Home.jsx                 # a landing (todas as seções + overlays)
    ├── styles/
    │   ├── tokens.css               # variáveis da §3
    │   ├── global.css               # reset, html/body, a, ::selection, scroll-behavior
    │   └── fonts.css                # imports @fontsource
    ├── assets/
    │   ├── img/equipe.jpg
    │   └── video/ponto.mp4, connect-app.mp4
    ├── data/
    │   └── content.js               # TODOS os textos, cards, projetos, menu, ícones (paths SVG)
    ├── engine/                      # lógica de animação pura (sem React)
    │   ├── math.js                  # clamp, seg, easeOut, mix, rgba
    │   ├── timeline.js              # constantes PRISM0, PRISM1, GATHER, END, SPEED + tabela da hero
    │   ├── reveal.js                # revelação de texto linha a linha (clip-path) + posição do cursor
    │   ├── trace.js                 # tracePt / drawTrace (contorno desenhado em volta de blocos)
    │   ├── network.js               # rede de nós da hero (Canvas 2D)
    │   ├── agents.js                # estado dos 5 agentes, movimento, rastro, rótulos
    │   ├── drawAgentBot.js          # desenho do agente (triângulo com miolo escuro)
    │   ├── sparks.js                # partículas de faísca (burst)
    │   ├── heroJobs.js              # lista de tarefas da intro (quem faz o quê e quando)
    │   └── sections.js              # scanner de [data-b] e agendamento por seção
    ├── context/
    │   └── BuildContext.jsx         # complete, skip, refs registradas, API do prisma
    ├── hooks/
    │   ├── useBuildLoop.js          # o ÚNICO requestAnimationFrame da página
    │   ├── useScrollLock.js         # trava scroll/teclas durante a intro
    │   └── useIntroSeen.js          # sessionStorage 'prisma-hero-built'
    └── components/
        ├── ui/
        │   ├── Button.jsx           # variantes primary (lima) / ghost (borda)
        │   ├── Tag.jsx              # chip mono "web apps"
        │   ├── SectionLabel.jsx     # losango + "01 / Software"
        │   ├── CornerAccent.jsx     # cantoneira lima
        │   ├── Logo.jsx             # SVG do prisma + wordmark
        │   └── Icon.jsx             # <svg> 24x24 com path e pathLength=1
        ├── hero/
        │   ├── Hero.jsx
        │   ├── HeroNetwork.jsx      # <canvas> da rede
        │   └── prism/
        │       ├── Prism3D.jsx      # <Canvas> R3F + câmera ortográfica
        │       ├── PrismModel.jsx   # malha, faces, arestas, furo, brilhos
        │       ├── prismGeometry.js # vértices e faces (ver §6)
        │       ├── gradientMaterial.js  # shader de gradiente linear igual ao SVG
        │       ├── usePrismBuild.js # aplica o progresso b ∈ [0,1] por frame
        │       └── PrismFallback.jsx    # o SVG original (sem WebGL / reduced motion)
        ├── sections/
        │   ├── About.jsx
        │   ├── ServiceSection.jsx   # genérica: Software, Motion e Landing usam a mesma
        │   ├── ServiceCard.jsx
        │   ├── ProjectCard.jsx      # vídeo OU placeholder "[ comprovação 0X ]"
        │   ├── Contact.jsx
        │   └── Footer.jsx
        └── overlay/
            ├── MenuButton.jsx
            ├── MenuDrawer.jsx       # drawer + backdrop
            ├── Fab.jsx
            ├── AgentsCanvas.jsx     # <canvas> fixo, tela inteira
            ├── StatusChip.jsx
            └── Cover.jsx
```

---

## 5. Árvore de componentes

```
<BuildProvider>
  <Home>
    <main ref=root>                       (pointer-events:none durante a intro)
      <Hero>
        <HeroBackground> 2 radiais + <HeroNetwork/>
        <Logo/>
        kicker (linha + texto) · <h1> · <p> · <Button primary/> <Button ghost/>
        <Prism3D/>  ← Three.js
        link "Role"
      </Hero>
      <About/>                            data-sec, agents [2,3]
      <ServiceSection id="software" light agents=[0,1] .../>
      <ServiceSection id="motion"         agents=[2,3] .../>
      <ServiceSection id="landing"  light agents=[4,0] .../>
      <div glow> <Contact/> <Footer/> </div>
    </main>
    <MenuButton/> <MenuDrawer/>
    <Fab/>
    <AgentsCanvas/>                       z 55
    <StatusChip/>                         z 60
    <Cover/>                              z 100
  </Home>
</BuildProvider>
```

Camadas (z-index do modelo): agentes 55 · FAB 58 · chip 60 · botão menu 72 · backdrop 73 · drawer 74 · cover 100.

### Contrato de construção das seções

Mantemos o mecanismo do modelo, que é simples e garante a mesma ordem:

- Cada seção leva `data-sec` e `data-ags="[a,b]"` (e `data-light` se for clara).
- Cada elemento animável leva `data-b="type" | "block" | "icon"`.
- `engine/sections.js` faz `querySelectorAll('[data-b]')` na montagem, na ordem do DOM.

Os componentes só repassam esses atributos. Nada de registrar item a item via React — evita divergência de ordem.

| Tipo | Efeito | Duração |
|---|---|---|
| `type` | texto revelado linha a linha com `clip-path` + cursor piscando (110 ms) | `min(900, 260 + 10 × caracteres)` ms |
| `block` | contorno lima desenhado em volta; opacidade entra nos últimos 28% | 600 ms |
| `icon` | `stroke-dashoffset` 1→0 + flash `drop-shadow` lima | 420 ms |

Itens são distribuídos em rodízio entre os agentes da seção (`i % pair.length`), com 70 ms entre itens do mesmo agente. A seção dispara quando `top < 80% da altura da tela`. Ao terminar cada item, solta um burst de faíscas. Quando todas as seções terminam, os agentes somem.

---

## 6. O prisma em Three.js (a peça principal)

O modelo desenha o prisma em SVG 2D. Vamos refazê-lo como **malha 3D real**, mas com **vista frontal idêntica ao SVG**. Visto de frente, ele precisa ficar pixel a pixel igual ao original.

### 6.1 Geometria

O desenho é uma pirâmide de base quadrilátera vista de frente, com a ponta (C) virada para a câmera. Coordenadas no espaço do SVG (`viewBox="0 -6 200 206"`, y para baixo):

| Vértice | SVG (x, y) | Papel | z (3D) |
|---|---|---|---|
| A | (118, 6) | ápice superior | 0 |
| L | (6, 138) | esquerda | 0 |
| R | (194, 150) | direita | 0 |
| B | (122, 184) | base | 0 |
| C | (124, 118) | ponta central, virada para a câmera | +0.35 (ajustável) |

| Face | Vértices | Gradiente |
|---|---|---|
| `faceL` | A, L, C | `#C6FF4D → #8CF25C → #46D9B8` (x1 .05 y1 1 → x2 .75 y2 0) |
| `faceR` | A, C, R | `#78C4FF → #7B6CFF → #5A43F0` (.1,0 → .9,1) |
| `botL` | L, C, B | `#A8F53C → #3CC79A` (0,0 → 1,1) |
| `botR` | C, R, B | `#9488FF → #3F2DC4` (0,0 → 1,1) |

Peças extras:

- **Furo** (`hole`): triângulo (110,42) (46,120) (114,104) apoiado no plano de `faceL` (z calculado por baricêntrica + 0.002), gradiente `#16203A → #0B1220`, contorno lima opacidade 0.35, largura 0.8.
- **Arestas internas** (`inner`): de C até A, L, R e B. Branco, opacidade 0.55, largura 0.9.
- **Contorno** (`edges`): A → L → B → R → A. Gradiente `#EFFFD0 → #B8FF3A → #A79DFF`, largura 1.6.
- **Rim**: A→L e A→C, branco 0.95 → 0.1, largura 1.3.
- **Brilhos** (`sheen`, `sheen2`): triângulos (118,6 124,118 140,92) e (118,6 90,40 106,46), branco 0.75 → 0.
- **Ápice** (`apex`): sprite radial em A, r = 15 (branco → `#EFFFD0` 0.85 → lima 0).
- **Sombra/brilho** (`glow`): elipse em (112,192), rx 96, ry 10, radial lilás 0.55 → lima 0.18 → 0.

Conversão SVG → mundo: `x = (sx - 100) / 100`, `y = -(sy - 97) / 100` (97 = centro vertical do viewBox). Assim 1 unidade do SVG = 0.01 no mundo.

### 6.2 Câmera e render

- `OrthographicCamera` enquadrando exatamente o viewBox (largura 2.0, altura 2.06), olhando para −z. Com câmera ortográfica frontal, o z de C não altera a silhueta. Por isso a vista fica igual ao SVG.
- Materiais **sem luz** (ShaderMaterial). Cor = gradiente, igual ao SVG. Nada de iluminação que mude os tons.
- `gl={{ alpha: true, antialias: true }}`, `dpr={[1, 2]}`, fundo transparente.
- Tamanho do container: `width: min(380px, 70vw)`, `aspect-ratio: 200 / 206`, igual ao modelo.

### 6.3 Shader de gradiente fiel ao SVG

O SVG usa `gradientUnits="objectBoundingBox"`. O shader faz o mesmo:

1. Cada vértice leva um atributo `aSvg` com a coordenada SVG original.
2. Uniforms por face: `uBBox` (min/max da face), `uG0`, `uG1` (x1,y1 / x2,y2), até 3 stops (cor + offset + opacidade).
3. No fragment: `uv = (aSvg - min) / (max - min)`, `t = dot(uv - G0, G1 - G0) / dot(G1 - G0, G1 - G0)`, interpola os stops.

Linhas: `Line` do drei (Line2 com espessura em pixels). O efeito de "desenhar" usa `dashed` + `dashOffset` animado, ou `geometry.setDrawRange`. Gradiente de linha via `vertexColors`.

### 6.4 Animação de construção (idêntica ao modelo)

Progresso `b = seg(t, PRISM0=2600, PRISM1=6600)`. Cada peça tem uma janela dentro de b (`PW`) e usa `easeOut`:

| Peça | Janela em b | Efeito |
|---|---|---|
| `edges` | 0 → .30 | contorno sendo desenhado |
| `inner` | .10 → .38 | arestas internas sendo desenhadas |
| `faceL` | .30 → .52 | fade + desliza de (−10, −4) até 0 |
| `faceR` | .38 → .60 | fade + desliza de (10, −4) |
| `botL` | .48 → .68 | fade + desliza de (−8, 10) |
| `botR` | .55 → .75 | fade + desliza de (8, 10) |
| `hole` | .66 → .82 | fade + escala 0.4 → 1 (a partir do centro) |
| `sheen` / `sheen2` | .80 → .98 | opacidade até 0.55 / 0.45 |
| `rim` | .80 → .98 | aparece; `edges` cai para 45% e `inner` para 60% |
| `apex` + `glow` | .88 → 1 | aparecem |

Deslocamentos em unidades SVG (× 0.01 no mundo, y invertido).

Depois de pronto (b ≥ 1):

- corpo flutua: `translateY = sin(T × 0.9) × 5` unidades SVG;
- ápice pulsa: `0.55 + 0.45 × sin(T × 2)²`;
- **flash** no fim da intro: 900 ms decaindo.

O brilho externo é um **CSS `filter` no elemento do canvas** (o fundo é transparente, então funciona igual ao SVG): `drop-shadow(0 0 (30 + 30f)px rgba(123,108,255,0.3 + 0.4f))` e, durante o flash, `brightness(1 + 0.7f)`. Isso evita bloom em pós-processamento e fica idêntico.

### 6.5 Ponte 3D → agentes

Os agentes precisam saber **onde na tela** está o ponto do prisma que estão "construindo". `Prism3D` expõe pelo `BuildContext`:

```js
prismApi.getPoint(key, b, agentIndex, T) // → [clientX, clientY] | null
```

- Linhas (`edges`, `inner`, `rim`): ponto na polilinha no progresso atual da peça.
- Faces/furo/brilhos: ponto baricêntrico oscilando (`u = .5 + .45 sin(5T + 1.7i)`, `v = .5 + .45 sin(3.3T + i)`, refletido se `u + v > 1`), igual ao modelo.
- Ápice: vértice A.

O ponto 3D é projetado com `vector.project(camera)` e convertido para coordenadas de tela usando o `getBoundingClientRect()` do canvas.

`prismApi.getCenter()` devolve o centro do prisma na tela (ponto de reunião dos agentes no `commit()`).

### 6.6 Extra 3D (desligado por padrão)

Para manter "exatamente igual", a vista fica frontal e parada. Uma flag `PRISM_PARALLAX` (padrão `false`) permite depois uma rotação leve (±6°) seguindo o mouse. Isso mostra a profundidade real da malha sem mudar o layout.

### 6.7 Fallback

`PrismFallback.jsx` = o SVG original do modelo, com a mesma animação. Usado quando:

- não há WebGL;
- `prefers-reduced-motion: reduce` (mostra pronto, sem animação);
- enquanto o chunk do Three.js carrega (`React.lazy` + `Suspense`).

---

## 7. Motor de animação (um loop só)

`useBuildLoop` roda um único `requestAnimationFrame` e chama, em ordem:

1. `network.draw(dt)` — rede da hero
2. `hero.apply(t, now)` — revelações da hero + progresso do prisma
3. `agents.draw(dt, t, now)` — canvas fixo: contornos, cursores, seções, agentes, faíscas, chip

O frame do R3F roda no próprio loop do fiber. Ele **lê** `t` do `BuildContext` via ref, sem `setState`.

Relógio: `t = max(0, now - t0) × SPEED`, com `SPEED = 2.1`. `dt` é limitado a 50 ms. Com a aba oculta, cai para `setTimeout` de 33 ms.

### 7.1 Linha do tempo da intro (unidades de `t`; tempo real = t / 2.1)

| t (ms) | Real ≈ | Evento |
|---|---|---|
| 0 → 2000 | 0 → 0,95 s | fundo da hero (radiais + rede) aparece |
| 400 → 1400 | | logo: fade + escala 0.7 → 1 (`ag.01 mount(nav.logo)`) |
| 1600 → 2000 | | linha do kicker cresce (`scaleX`) |
| 1800 → 2500 | | kicker digitado (`ag.04 type(hero.kicker)`) |
| 2100 → 4600 | | H1 digitado (`ag.01 type(hero.title)`) |
| 2600 → 6600 | 1,24 → 3,14 s | prisma construído (ag.03, ag.04, ag.05) |
| 4000 → 5400 | | parágrafo digitado (`ag.02 type(hero.text)`) |
| 5100 → 5700 | | contorno do botão primário (`ag.03 draw(btn.primary)`) |
| 5400 → 6000 | | contorno do botão secundário (`ag.02 draw(btn.secondary)`) |
| 5650 / 5950 | | botões aparecem (300 ms cada) |
| 6700 → 7300 | | agentes giram em volta do prisma (`commit()`) |
| **7300 (END)** | **≈ 3,5 s** | intro completa: flash, burst, destrava o scroll |
| END + 900 | | FAB aparece; "Role" aparece |
| END + 1100 | | chip some |

Início com atraso de 250 ms. Tabela completa de tarefas dos agentes: `buildHeroJobs()` do modelo (Apêndice B), portada 1:1 para `engine/heroJobs.js`.

### 7.2 Regras da intro

- Scroll travado (`overflow:hidden` em html/body) e `wheel`/`touchmove`/teclas (`Space`, `PageUp/Down`, setas, `Home`, `End`, `Tab`) bloqueados até `complete`.
- `<main>` com `pointer-events:none` durante a intro.
- `history.scrollRestoration = 'manual'` + `scrollTo(0,0)` na montagem.
- `sessionStorage['prisma-hero-built'] = '1'` ao terminar. Na próxima visita da sessão, pula direto para o estado final (sem flash nem burst).
- **Adição (não existe no modelo):** `prefers-reduced-motion` pula a intro, igual ao caso da sessão já vista.

### 7.3 Agentes

- 5 agentes `ag.01`…`ag.05`. Entram de cima (`y = −40 − 24i`).
- Movimento: suavização exponencial até o alvo (`k = 1 − e^(−dt·13)` com tarefa, 8 no commit, 3.5 ocioso). Tremor de ±1,5 px quando trabalhando.
- Rastro de 8 pontos. Feixe com gradiente do agente até o ponto de trabalho + ponto branco + faíscas aleatórias.
- Rótulo mono 10px, fundo `rgba(11,18,32,.75)`, vira para a esquerda se encostar na borda.
- Depois da intro: ociosos ficam na borda direita com alpha 0.28. Somem quando todas as seções terminam.
- Desenho: triângulo de 6,5 px na cor do agente com miolo `#0B1220` e sombra brilhante (`drawAgentBot`). Os sprites pixel-art (`BOTS`) existem no modelo mas **não são usados** — ficam fora do porte.

---

## 8. Conteúdo (`data/content.js`)

Todo o texto sai dos componentes e vai para um único arquivo. Isso permite editar o portfólio sem tocar em JSX. Estrutura:

```js
export const hero = { kicker, title: ['Tecnologia que conecta pessoas, processos e ', 'resultados.'], text, ctas: [...] };
export const about = { image, alt, label: 'Quem somos', title, text, pillars: [...] };
export const services = [
  { id: 'software', index: '01', label: 'Software', light: true, agents: [0, 1],
    title: 'Sistemas que trabalham do jeito que o seu negócio funciona.',
    text: '...', tags: ['web apps', 'automação', 'APIs'],
    cards: [{ title: 'Sistemas web', text: '...', icon: 'M3 4h18v12H3z M8 20h8 M12 16v4' }, ...],
    projects: [{ n: '01', title: 'Sistema de ponto', meta: 'Cliente · ano · ...', video: ponto }, ...] },
  { id: 'motion', ... }, { id: 'landing', ... },
];
export const contact = { title: ['Mais que código,', 'soluções reais.'], text, email: 'contato@prisma.tech', whatsapp: '#' };
export const menu = { items: [...4], services: [...3] };
```

Os paths SVG dos 16 ícones já foram extraídos do modelo e vão literais para esse arquivo.

---

## 9. Responsividade

O modelo resolve quase tudo com `clamp()` e `auto-fit/minmax`, sem breakpoints. A arquitetura mantém isso: **zero media queries obrigatórias**. Só o necessário:

- `@media (prefers-reduced-motion: reduce)` — ver §6.7 e §7.2.
- A rede de nós recalcula no `resize` (`n = min(90, w·h/16000)`).
- O canvas dos agentes ajusta o tamanho pelo DPR (máximo 2) a cada frame se mudar.

Larguras de verificação: **1440, 1024, 768, 390, 360 px**.

---

## 10. Performance

- Three.js/R3F em **chunk separado** (`React.lazy`), carregado só pela hero. O SVG de fallback cobre o carregamento.
- `frameloop="always"` só durante a intro e enquanto a hero está visível. Fora disso, `frameloop="demand"` (com `IntersectionObserver`).
- DPR limitado a 2 em todos os canvas.
- Vídeos: `muted playsInline autoPlay loop preload="metadata"` + `poster`. Hoje têm ~5 MB cada: reencodar (H.264 ≤ 1,5 MB, e WebM como alternativa) e tocar só quando visíveis.
- Foto da equipe (320 KB): gerar WebP/AVIF com `srcset`.
- Fontes: só os subsets `latin` e `latin-ext`.
- Meta: LCP < 2,5 s em 4G; 60 fps na intro em notebook médio.

---

## 11. Pontas soltas encontradas no modelo

Itens que precisam de decisão ou conteúdo. Não bloqueiam a arquitetura.

1. **Refs `links` e `cta` não existem no template.** A nav do topo foi removida, mas as tarefas `ag.02 render(nav.links)` e `ag.03 draw(nav.cta)` continuam na lista. No modelo elas não fazem nada (o agente fica ocioso nesse intervalo). Para ficar igual, portamos assim mesmo. Alternativa: remover as duas.
2. **Páginas inexistentes:** o menu aponta para `Servicos.dc.html?s=...` e `Projetos.dc.html`, que não estão no arquivo. Plano: rotas `/servicos/:slug` e `/projetos` como placeholders. Até existirem, os links de serviço fazem scroll para `#software`, `#motion`, `#landing`.
3. **Placeholders:** 7 projetos com "[ comprovação 0X ]" / "Nome do projeto" / "Cliente · ano · breve descrição". O Projeto 03 de Software também é placeholder.
4. **WhatsApp** com `href="#"` — falta o número.
5. Arrays `nav` e `services` do componente original não são usados no template. Ficam fora do porte.
6. Título da aba do bundle é "Bundled Page" — definir `<title>` e meta tags (OG, descrição).

---

## 12. Fases de execução

| Fase | Entrega | Pronto quando |
|---|---|---|
| **1. Base** | Vite + React, tokens, fontes, estrutura de pastas, `content.js`, assets extraídos | `npm run dev` abre página vazia com fontes e cores certas |
| **2. Layout estático** | Todas as seções, menu, drawer, FAB, rodapé, sem animação | Screenshot lado a lado com o modelo nas 5 larguras, sem diferença visível |
| **3. Prisma 3D** | Geometria, shader de gradiente, linhas, furo, brilhos, flutuação, fallback SVG | Vista frontal sobreposta ao SVG original com diferença ≤ 1 px nas bordas |
| **4. Motor** | Loop único, rede, reveal de texto, trace, faíscas, agentes, chip, cover, travas de scroll | Intro com os mesmos tempos da §7.1 (comparar gravações quadro a quadro) |
| **5. Construção das seções** | Scanner de `data-b`, agendamento por seção, burst, saída dos agentes | Cada seção constrói igual ao modelo ao rolar |
| **6. Acabamento** | reduced-motion, sessão vista, lazy-load, vídeos otimizados, SEO, acessibilidade (foco do drawer, `Esc` fecha, `aria-expanded`) | Lighthouse ≥ 90 em performance e acessibilidade |
| **7. Deploy** | Build estático (Vercel ou similar) | URL pública |

---

## 13. Critérios de "exatamente igual"

- Mesmos textos, ordem e quebras (`text-wrap: balance/pretty` mantidos).
- Mesmas cores, fontes, pesos, tamanhos, espaçamentos e bordas da §3.
- Mesmos estados de hover (copiados dos atributos `style-hover` do modelo).
- Mesma intro: duração ≈ 3,5 s, mesma ordem e mesmos rótulos dos agentes.
- Prisma 3D com silhueta, cores e animação iguais ao SVG na vista frontal.
- Validação: gravação de tela do modelo e da versão React, lado a lado, nas larguras 1440 e 390.

---

## Apêndice A — Como o modelo foi lido

`Landing Page v6.html` é um bundle: o HTML real fica num `<script type="__bundler/template">` (JSON) e os assets num `<script type="__bundler/manifest">` (base64, alguns com gzip). Conteúdo:

| UUID | Tipo | Uso |
|---|---|---|
| `8c4283f9…` | JPEG 320 KB | foto da equipe (seção Sobre) |
| `6a8ad73a…` | MP4 4,7 MB | Projeto 01 — Sistema de ponto |
| `84f39043…` | MP4 5,2 MB | Projeto 02 — Connect App |
| `d5faaac2…` | JS | runtime do editor (não vai para o projeto) |
| `1c929f89…`, `0ba4709c…` | JS | React 18.3.1 e ReactDOM UMD (substituídos pelo npm) |
| 28 × woff2 | fontes | substituídas por @fontsource |

Script de extração (usado na análise; será reutilizado na Fase 1 para tirar imagem e vídeos):

```python
import re, json, base64, gzip, sys, os
src, out = sys.argv[1], sys.argv[2]
h = open(src, encoding='utf-8').read()
def blk(t):
    m = re.search(r'<script type="' + re.escape(t) + r'">(.*?)</script>', h, re.S)
    return m.group(1) if m else None
man = json.loads(blk('__bundler/manifest'))
open(os.path.join(out, 'template.html'), 'w').write(json.loads(blk('__bundler/template')))
for k, v in man.items():
    b = base64.b64decode(v['data'])
    if v.get('compressed'): b = gzip.decompress(b)
    open(os.path.join(out, k + '.' + v['mime'].split('/')[-1]), 'wb').write(b)
```

## Apêndice B — Tarefas dos agentes na intro (porte 1:1)

| Agente | Início → fim (t) | Rótulo | Alvo |
|---|---|---|---|
| ag.01 | 400 → 1400 | `mount(nav.logo)` | centro do logo |
| ag.02 | 700 → 1800 | `render(nav.links)` | (ref inexistente, ver §11.1) |
| ag.03 | 1300 → 2000 | `draw(nav.cta)` | (ref inexistente, ver §11.1) |
| ag.04 | 1600 → 2500 | `type(hero.kicker)` | cursor do kicker |
| ag.01 | 2100 → 4600 | `type(hero.title)` | cursor do H1 |
| ag.02 | 4000 → 5400 | `type(hero.text)` | cursor do parágrafo |
| ag.03 | 5100 → 5700 | `draw(btn.primary)` | contorno do botão 1 |
| ag.02 | 5400 → 6000 | `draw(btn.secondary)` | contorno do botão 2 |
| ag.04 | b 0 → .30 | `trace(prism.edges)` | ponta do contorno |
| ag.04 | b .30 → .48 | `fill(face.left)` | dentro de faceL |
| ag.04 | b .48 → .66 | `fill(base.left)` | dentro de botL |
| ag.04 | b .66 → .82 | `carve(negative)` | dentro do furo |
| ag.05 | b .10 → .38 | `trace(prism.core)` | ponta das arestas internas |
| ag.05 | b .38 → .60 | `fill(face.right)` | dentro de faceR |
| ag.05 | b .60 → .78 | `fill(base.right)` | dentro de botR |
| ag.05 | b .80 → .98 | `polish(edges)` | rim |
| ag.03 | b .78 → .90 | `polish(glass)` | sheen |
| ag.03 | b .90 → 1 | `ignite(apex)` | ápice |

`b` convertido para t: `t = 2600 + b × 4000`. Offsets do rótulo em relação ao alvo (ox, oy) seguem o modelo.
