# Prisma — Tasks de implementação

Derivado de `PLANEJAMENTO-ARQUITETURA.md` (leia-o antes de qualquer task). Fonte da verdade visual: `Landing Page v6.html`.
Cada task passa por 3 agentes: **implementação → code review + comparação visual (em paralelo) → correção**, repetindo até os dois aprovarem (máx. 3 rodadas).

## Grafo de dependências

```
T01 Fundação
 ├── T02 Hero (estático) ─────────────┐
 ├── T03 Sobre ───────────────────────┼──────────────┐
 ├── T04 Seções de serviço ───────────┼──────────────┤
 ├── T05 Contato + Rodapé ────────────┼──────────────┤
 ├── T06 Overlays + Menu ─────────────┤              │
 ├── T07 Motor (engine puro) ─────────┤              │
 └── T08 Prisma 3D (Three.js) ────────┴─ T09 Intro ──┴─ T10 Construção das seções ─ T11 Performance/A11y/SEO ─ T12 QA final
```

Ondas: **1:** T01 · **2:** T02–T08 em paralelo · **3:** T09 · **4:** T10 · **5:** T11 · **6:** T12.

---

## Regras para todas as tasks

1. **Referência:** o HTML real do modelo está em `reference/extracted/template.html` (JSX-like com estilos inline; atributos `style-hover` = estado de hover; `sc-camel-view-box` = `viewBox`; `sc-camel-path-length` = `pathLength`). O script de animação original está no final do mesmo arquivo (`<script data-dc-script>`). Copie valores **exatos** (cores, clamp, letter-spacing, sombras).
2. **Arquivos:** cada task só cria/edita os arquivos listados em "Arquivos". Se precisar mudar arquivo de outra task, faça a menor edição possível e registre no relatório. **Não rode `npm install`** fora de T01/T11/T12.
3. **IDs:** use os mesmos `id` do modelo (`topo`, `sobre`, `software`, `motion`, `landing`, `contato`, `rodape`). A comparação visual depende disso.
4. **Atributos de construção:** mantenha `data-sec`, `data-ags`, `data-light`, `data-b="type|block|icon"` exatamente nos mesmos elementos do modelo (T10 depende disso). Ícones SVG de card: `<path pathLength="1" strokeDasharray="1">`.
5. **Estilo:** CSS Modules por componente + `src/styles/tokens.css`. Sem Tailwind. Hover via `:hover` no CSS.
6. **Animação por frame:** nada de `setState` por frame. Use `src/engine/loop.js` (`subscribe(cb)`) e refs.
7. **Conteúdo:** todo texto vem de `src/data/content.js`.
8. **Servidor de dev compartilhado:** `tools/visual/ensure-dev.sh` (porta 5173). Nunca mate esse servidor.
9. **Preview isolado:** `http://localhost:5173/preview.html?c=<caminho em src/components sem .jsx>` renderiza só aquele componente dentro do wrapper raiz (fundo `#0B1220`, Roboto, `overflow-x:hidden`). Ex.: `?c=sections/About`. Evita que erro de outra task quebre sua verificação.
10. **Comparação visual:** `node tools/visual/compare.mjs` (documentação no topo do arquivo). Saída em `tools/visual/out/<nome>/…/side.png` (original | nosso | diff). Use `--name <TASK>-r<rodada>-<algo>`.
11. **Critério visual padrão:** em cada largura (1440, 1024, 768, 390): `sizeMatch` verdadeiro (ou altura ±2 px) e `diffPercent ≤ 1.0`, e inspeção do `side.png` sem diferença perceptível. Diferenças só de antialias de fonte são aceitas se justificadas.
12. **Qualidade:** `npm run lint` e `npm run test` (vitest) passando; sem erros no console do navegador.

---

## T01 — Fundação

**Depende de:** nada.
**Arquivos:** `package.json`, `vite.config.js`, `index.html`, `preview.html`, `eslint.config.js`, `.prettierrc`, `.gitignore`, `src/main.jsx`, `src/preview.jsx`, `src/App.jsx`, `src/pages/Home.jsx`, `src/pages/Placeholder.jsx`, `src/styles/*`, `src/assets/**`, `src/data/content.js`, `src/engine/math.js`, `src/engine/loop.js`, `src/components/ui/*`, **stubs** de todos os outros componentes listados abaixo.

Escopo:
- Vite + React 18.3.1 (JS). Deps: `react`, `react-dom`, `three`, `@react-three/fiber@8`, `@react-three/drei@9`, `react-router-dom@6`, `@fontsource/roboto` (300,400,500), `@fontsource/oswald` (400,500,600), `@fontsource/exo-2` (500,700), `@fontsource/roboto-mono` (400). Dev: `vitest`, `jsdom`, `eslint` + plugin react/react-hooks, `prettier`. Versões fixas (sem `^`).
- Scripts: `dev` (vite, porta 5173, `strictPort`), `build`, `preview`, `lint`, `test` (`vitest run`).
- Multi-page: `index.html` (app) e `preview.html` (`src/preview.jsx`: lê `?c=`, faz `import.meta.glob('./components/**/*.jsx')` lazy e renderiza o default export dentro do wrapper raiz idêntico ao do modelo).
- `styles/tokens.css` (todas as cores/fontes/espaços da §3 do planejamento), `global.css` (reset do modelo: `html,body{margin:0;background:#0B1220;scroll-behavior:smooth}`, links lima, `::selection`), `fonts.css` (só subsets latin/latin-ext).
- Assets: `reference/extracted/equipe.jpg`, `ponto.mp4`, `connect-app.mp4` → `src/assets/`.
- `data/content.js` **completo**: hero, about (pilares), 3 serviços (cards com path SVG dos ícones, tags, projetos — Software 01 e 02 com vídeo), contato, menu (itens + serviços), rodapé.
- `engine/math.js`: `clamp`, `seg`, `easeOut`, `LIME`, `LILAC`, `mix`, `rgba` (idênticos ao modelo). `engine/loop.js`: um único `requestAnimationFrame` global; `subscribe(cb(now, dt))` retorna `unsubscribe`; `dt` limitado a 0,05 s; com `document.hidden` usa `setTimeout(33)`.
- `components/ui`: `Button` (primary/ghost, exatamente como os botões da hero/contato), `Tag`, `SectionLabel` (losango 10px + texto mono), `CornerAccent` (size 32/56), `Logo` (SVG prisma 4 polígonos + furo + wordmark Exo 2; prop `size`), `Icon` (svg 24, stroke lima 1.5, `pathLength=1`).
- `pages/Home.jsx`: monta a página completa na ordem do modelo, com o wrapper raiz (`position:relative;min-height:100vh;background:#0B1220;color:#F4F5F8;font-family:Roboto;overflow-x:hidden`). Rotas: `/` Home, `/servicos/:slug` e `/projetos` → `Placeholder`.
- **Stubs** (cada um exporta um componente default que já renderiza o elemento raiz com o `id` certo, vazio): `hero/Hero.jsx`, `hero/HeroNetwork.jsx`, `hero/prism/Prism.jsx` (div `data-prism` com `width:min(380px,70vw);aspect-ratio:200/206`), `sections/About.jsx`, `sections/ServiceSection.jsx`, `sections/ServiceCard.jsx`, `sections/ProjectCard.jsx`, `sections/ContactBlock.jsx` (wrapper com brilho + Contact + Footer), `sections/Contact.jsx`, `sections/Footer.jsx`, `overlay/MenuButton.jsx`, `overlay/MenuDrawer.jsx`, `overlay/Fab.jsx`, `overlay/AgentsCanvas.jsx`, `overlay/StatusChip.jsx`, `overlay/Cover.jsx`, `context/BuildContext.jsx`.
- `npm install`, `npm run build`, `npm run lint`, `npm run test` passando (teste de `math.js`).

Verificação visual: `ui/Logo` e `ui/Button` via preview contra o logo do topo e os botões da hero do original (`--orig-sel '#topo > a'` etc.); fontes carregadas (`document.fonts.check`); fundo e cor do body iguais.

---

## T02 — Hero (estático, sem intro)

**Depende de:** T01. **Arquivos:** `components/hero/Hero.jsx`, `Hero.module.css`, `components/hero/HeroNetwork.jsx`, `engine/network.js`, `engine/network.test.js`.

- Hero no **estado final** do modelo: radiais, logo, kicker (linha 40×2 lima + texto), H1 com "resultados." em lima, parágrafo, 2 botões, slot `<Prism/>`, link "Role".
- Expor refs para T09 via `forwardRef`/prop `refs` (logo, heroBg, net, kLine, kText, h1, p, btn1, btn2, prism slot, role).
- `engine/network.js`: porte 1:1 de `initNet`/`drawNet` (nós, ligações com cor `mix(x/w)`, pacotes com gradiente radial). Mesma ordem de chamadas a `Math.random` do original. `HeroNetwork` usa `loop.subscribe` e recalcula no resize.

Visual: `--sel '#topo'` em 1440/1024/768/390, escondendo o prisma dos dois lados (`--hide-orig '#topo svg[style*="will-change"]' --hide-ours '[data-prism]'`). Com o PRNG semeado, a rede deve bater.

---

## T03 — Sobre

**Depende de:** T01. **Arquivos:** `components/sections/About.jsx`, `About.module.css`.

Foto (cover, `object-position: center 60%`, aspect 4/3, cantoneira 56px), "Quem somos", H2 "Somos **6** desenvolvedores.", parágrafo, grade 2×2 de pilares com losangos coloridos e borda de 0,5 px. Radial lilás no canto. `data-sec data-ags="[2,3]"` e `data-b` nos mesmos elementos.

Visual: `--sel '#sobre'` (preview `?c=sections/About` com `--ready '#sobre'`).

---

## T04 — Seções de serviço (Software, Motion, Landing)

**Depende de:** T01. **Arquivos:** `components/sections/ServiceSection.jsx`, `ServiceCard.jsx`, `ProjectCard.jsx` + `.module.css` de cada.

Componente único guiado por `content.js`: variante clara (`#software`, `#landing`: fundo `#F4F5F8`, texto `#0B1220`, hover branco) e escura (`#motion`: radial lilás, hover `rgba(123,108,255,0.08)`). Cabeçalho (SectionLabel, H2, parágrafo, tags), grade de cards colada (`gap:0`, sombra 0,5 px), "Projetos" com 3 cards (vídeo `muted autoplay loop playsInline preload="metadata"` com `object-fit:contain`, ou placeholder listrado "[ comprovação 0X ]"), cantoneira 32 px. `data-ags`: software `[0,1]`, motion `[2,3]`, landing `[4,0]`.

Visual: `--sel '#software'`, `'#motion'`, `'#landing'` em Home (ou preview de uma página de teste). Vídeos são pausados no frame 0 pelo harness.

---

## T05 — Contato + Rodapé

**Depende de:** T01. **Arquivos:** `components/sections/ContactBlock.jsx`, `Contact.jsx`, `Footer.jsx` + css.

Wrapper com `border-top` e radial lima embaixo; contato centralizado (H2 com quebra e "soluções reais." lima, parágrafo, botões "Iniciar um projeto" mailto e "WhatsApp"); rodapé com copyright e slogan. `data-ags` contato `[1,2]`, rodapé `[1]`.

Visual: `--sel '#contato'` e `--sel '#rodape'`.

---

## T06 — Overlays e menu

**Depende de:** T01. **Arquivos:** `components/overlay/MenuButton.jsx`, `MenuDrawer.jsx`, `Fab.jsx`, `StatusChip.jsx`, `Cover.jsx` + css. (`AgentsCanvas` fica para T09.)

- Botão "Menu" fixo (blur, 3 pontos lima), backdrop, drawer à direita `min(460px,100vw)` com transição `450ms cubic-bezier(.2,.8,.2,1)`, itens 01–04, chips de serviços, e-mail, CTA. Acessibilidade: `aria-expanded`, `Esc` fecha, foco vai para o drawer e volta ao botão, clique em link fecha.
- `Fab` (prop `visible`), `StatusChip` (props `text`, `pct`, `visible`; refs expostas para atualização imperativa), `Cover` (some no 1º frame, 400 ms).
- z-index: chip 60, FAB 58, menu 72, backdrop 73, drawer 74, cover 100.

Visual: `--keep-fixed --viewport` com o menu fechado e aberto (`--click 'button[aria-label="Abrir menu"]'`), em 1440 e 390. FAB e chip comparados no estado final da intro.

---

## T07 — Motor (engine puro)

**Depende de:** T01. **Arquivos:** `engine/timeline.js`, `reveal.js`, `trace.js`, `sparks.js`, `agents.js`, `drawAgentBot.js`, `heroJobs.js`, `sections.js`, testes `*.test.js`, `src/components/debug/EngineDemo.jsx`.

Porte 1:1 das funções do script original, sem React: constantes (`PRISM0=2600, PRISM1=6600, GATHER=6700, END=7300, SPEED=2.1`, `PW`), `reveal(el,u)` (clip-path por linhas + posição do cursor), `tracePt`, `drawTrace`, `burst`/atualização de faíscas, estado e passo dos agentes (alvo, suavização, rastro, rótulo, feixe), `drawAgentBot`, `buildHeroJobs(getters)` (recebe funções que devolvem pontos, incluindo `prismApi.getPoint`), `initSections/startSection/setItem/updateSections/sectionTask`. Testes unitários para a matemática, agendamento de seções (durações `min(900,260+10·len)`, 600, 420; +70 ms; rodízio) e `heroJobs`.

`EngineDemo.jsx` (preview): um H1 sendo revelado com cursor e os 5 agentes desenhados em posições fixas, para o verificador visual comparar o desenho do agente/rótulo com um quadro da intro original.

---

## T08 — Prisma 3D (Three.js)

**Depende de:** T01. **Arquivos:** `components/hero/prism/*` (`Prism.jsx`, `Prism3D.jsx`, `PrismModel.jsx`, `prismGeometry.js`, `gradientMaterial.js`, `usePrismBuild.js`, `PrismFallback.jsx`, testes).

Implementa a §6 do planejamento inteira. API:
`<Prism getState={() => ({ b, now, flashAt })} onApi={api => …} />` — `api.getPoint(key, b, i, T)` e `api.getCenter()` em coordenadas de tela. Sem `getState`, roda **standalone** com o mesmo relógio do original (início 250 ms após montar, `t = Δ·2.1`, `b = seg(t, 2600, 6600)`), para poder ser comparado sozinho. `Prism.jsx` escolhe `Prism3D` (lazy) ou `PrismFallback` (sem WebGL / reduced motion / carregando). Glow via CSS `filter` no container do canvas.

Visual: estado final `--orig-sel '#topo svg[style*="will-change"]' --ours-sel '[data-prism]'` com diff ≤ 1,5 % (antialias WebGL), e quadros `--mode time --times 1500,2200,2800,3300 --viewport` comparando a montagem (preview `?c=hero/prism/Prism` posicionado igual ao original, ou na Home). Também conferir no 390.

---

## T09 — Intro da hero (integração)

**Depende de:** T02, T06, T07, T08. **Arquivos:** `context/BuildContext.jsx`, `hooks/useBuildLoop.js`, `hooks/useScrollLock.js`, `hooks/useIntroSeen.js`, `components/overlay/AgentsCanvas.jsx`, `pages/Home.jsx` (ligações), pequenas edições em `Hero.jsx`.

Liga tudo num loop só: relógio `t` (início +250 ms, `SPEED 2.1`), `applyHero` (opacidades/escalas/reveals da §7.1), prisma dirigido pelo `t` global + flash, agentes no canvas fixo com tarefas de `heroJobs`, cursores, contornos dos botões, chip com texto/porcentagem/barra, `commit()` ao redor do prisma, fim em `END` (burst, destrava scroll, `sessionStorage`), FAB em `END+900`, chip some em `END+1100`, "Role" aparece. Trava de scroll/teclas e `pointer-events:none` no `<main>` durante a intro. `scrollRestoration='manual'`. Sessão já vista → pula direto (sem flash). `prefers-reduced-motion` → pula.

Visual: `--mode time --viewport --keep-fixed --times 300,700,1200,1700,2200,2700,3200,3600,4200 --widths 1440,390` + estado final. Diferenças aceitas só em posição exata de faíscas aleatórias.

---

## T10 — Construção das seções

**Depende de:** T09, T03, T04, T05. **Arquivos:** integração em `context/BuildContext.jsx`, `components/overlay/AgentsCanvas.jsx`, `engine/sections.js` (ajustes).

Após a intro: varre `[data-sec]`/`[data-b]` na ordem do DOM, dispara a seção a 80 % da altura, revela textos com cursor, desenha contornos dos blocos, acende ícones, faíscas, agentes ociosos na borda direita com alpha 0,28, e somem quando tudo termina. Itens começam invisíveis (como no original).

Visual: para cada seção, `--mode time --skip-intro --scroll-to '#<id>' --times 200,600,1200,2500 --viewport --keep-fixed --widths 1440,390`, e estado final de todas as seções (`--sel` por seção).

---

## T11 — Performance, acessibilidade e SEO

**Depende de:** T10. **Arquivos:** `vite.config.js`, `index.html`, `Prism.jsx`, `ProjectCard.jsx`, `src/assets/**`, `public/*`.

Three.js em chunk separado (confirmar no `npm run build`), `frameloop` "demand" quando a hero sai da tela, vídeos reencodados com `ffmpeg` (H.264 ≤ 1,5 MB cada + WebM + `poster`) e tocando só quando visíveis, foto em WebP/AVIF com `srcset`, `<title>`, meta description, Open Graph, favicon do prisma, `lang="pt-BR"`, foco visível, contraste. Relatório com tamanhos de bundle antes/depois.

Visual: regressão — estado final de todas as seções em 1440 e 390 continua dentro do critério.

---

## T12 — QA final

**Depende de:** T11. **Arquivos:** correções pontuais onde necessário.

`npm run build && npm run preview` e comparação **da build de produção** (porta do preview) com o original: página inteira (`--widths 1440,1024,768,390`), cada seção, intro em quadros, menu aberto. Lint, testes e console limpos. Relatório final com a tabela de diffs por seção e largura.
