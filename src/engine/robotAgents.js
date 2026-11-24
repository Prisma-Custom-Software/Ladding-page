// Agentes-robo da pagina de projetos: mesmas tarefas dos agentes da home (sectionTask: digitar, contornar,
// acender), mas desenhados como os mini-robos do carrossel e com o movimento deles: entram voando pela
// esquerda, molas com overshoot, squash & stretch na direcao da velocidade, inclinacao, chama que cresce com
// a velocidade, quique ao chegar numa tarefa e saida pela borda direita quando a pagina termina.
import { mix, rgba } from './math.js';
import { sectionTask } from './sections.js';
import { drawMiniBot } from './drawMiniBot.js';
import { drawAgentLabel } from './agents.js';

const STIFF = 260; // rigidez da mola (1/s^2)
const DAMP = 0.62; // fracao do amortecimento critico (<1 = overshoot, o "quique")

export function createRobots(n, h) {
  return Array.from({ length: n }, (_, i) => ({
    id: 'ag.0' + (i + 1),
    x: -70 - i * 46,
    y: h * (0.28 + 0.11 * i),
    vx: 0,
    vy: 0,
    col: mix(i / Math.max(1, n - 1)),
    alpha: 1,
    trail: [],
    land: 0, // pulso de pouso (0..1)
    lastTask: null,
  }));
}

// Alvo ocioso: pairando na lateral direita, como os robos que se juntam no canto no carrossel.
// Em tela estreita estacionam meio escondidos na borda para nao cobrir o texto.
export function idleSpot(i, { w, h, T }) {
  const narrow = w < 700;
  const x = narrow ? w - 4 : w - 24 - (i % 2) * 18;
  return [x + Math.sin(T * 1.6 + i * 2) * (narrow ? 3 : 8), h * (0.26 + 0.12 * i) + Math.cos(T * 1.3 + i) * 10];
}

// Um passo de mola amortecida (semi-implicito). Devolve o novo estado.
export function springStep(p, v, target, dt) {
  const c = 2 * Math.sqrt(STIFF) * DAMP;
  const a = STIFF * (target - p) - c * v;
  const nv = v + a * dt;
  return [p + nv * dt, nv];
}

/**
 * Move e desenha o robo `a`. p = { dt, T, now, w, h, sections, sparks, exiting }.
 * exiting: pagina construida -> o robo sai pela borda direita.
 */
export function stepRobot(ctx, a, i, p) {
  const { dt, T, now, w, h, sections, sparks, exiting } = p;
  const task = exiting ? null : sectionTask(sections, i, now);
  let tx;
  let ty;
  if (task) {
    tx = task.x + task.ox;
    ty = task.y + task.oy - 6;
    const key = task.lbl + Math.round(task.x / 40);
    if (key !== a.lastTask) {
      a.lastTask = key;
      a.land = 1;
    }
  } else if (exiting) {
    tx = w + 140 + i * 30;
    ty = h * (0.3 + 0.1 * i);
  } else {
    [tx, ty] = idleSpot(i, p);
    a.lastTask = null;
  }
  // subpassos para a mola ficar estavel mesmo com dt grande
  const steps = Math.max(1, Math.ceil(dt / 0.008));
  const sdt = dt / steps;
  for (let k = 0; k < steps; k++) {
    [a.x, a.vx] = springStep(a.x, a.vx, tx, sdt);
    [a.y, a.vy] = springStep(a.y, a.vy, ty, sdt);
  }
  a.land = Math.max(0, a.land - dt * 4);
  if (exiting) {
    if (a.x > w + 60) a.alpha = Math.max(0, a.alpha - dt * 4);
  } else {
    // ocioso fica discreto na lateral; trabalhando, aceso
    a.alpha += ((task ? 1 : w < 700 ? 0.3 : 0.45) - a.alpha) * (1 - Math.exp(-dt * 5));
  }
  a.trail.push([a.x, a.y]);
  if (a.trail.length > 10) a.trail.shift();
  if (a.alpha < 0.02) return;

  const speed = Math.hypot(a.vx, a.vy);
  // rastro de movimento
  for (let j = 1; j < a.trail.length; j++) {
    ctx.strokeStyle = rgba(a.col, (j / a.trail.length) * 0.32 * a.alpha * Math.min(1, speed / 300));
    ctx.lineWidth = 2 + (6 * j) / a.trail.length;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(a.trail[j - 1][0], a.trail[j - 1][1] + 8);
    ctx.lineTo(a.trail[j][0], a.trail[j][1] + 8);
    ctx.stroke();
  }
  // feixe ate o ponto de trabalho (a "seta" da home)
  if (task) {
    const fl = 0.6 + 0.4 * Math.random();
    const g = ctx.createLinearGradient(a.x, a.y + 14, task.x, task.y);
    g.addColorStop(0, rgba(a.col, 0.95 * fl * a.alpha));
    g.addColorStop(1, `rgba(244,245,248,${fl * a.alpha})`);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = rgba(a.col, 0.9);
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + 14);
    ctx.lineTo(task.x, task.y);
    ctx.stroke();
    ctx.fillStyle = `rgba(244,245,248,${a.alpha})`;
    ctx.beginPath();
    ctx.arc(task.x, task.y, 2.6, 0, 6.283);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (Math.random() < 0.3) sparks.beam(task.x, task.y, a.col);
  }
  // squash & stretch: estica com a velocidade, achata no pouso
  const stretch = Math.min(0.5, speed / 1600) - a.land * 0.28;
  const dir = speed > 1 ? Math.atan2(a.vy, a.vx) : Math.PI / 2;
  drawMiniBot(ctx, {
    x: a.x,
    y: a.y,
    s: 0.48,
    rot: Math.max(-0.55, Math.min(0.55, a.vx / 1400)),
    stretch,
    dir: a.land > 0.05 && speed < 200 ? Math.PI / 2 : dir,
    col: a.col,
    alpha: a.alpha,
    eye: task ? 0.75 : 1,
    flame: 0.45 + Math.min(1.4, speed / 700),
    T,
    seed: i * 3,
    happy: exiting,
  });
  if (!task && !exiting) return; // ocioso: sem rotulo, como os agentes da home depois da intro
  const lbl = exiting ? 'commit()' : task ? task.lbl : 'await()';
  drawAgentLabel(ctx, { ...a, y: a.y - 12, x: a.x + 8 }, lbl, Boolean(task) || exiting, w);
}
