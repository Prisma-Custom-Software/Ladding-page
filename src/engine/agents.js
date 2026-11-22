// Estado e passo dos agentes (porte 1:1 do corpo de drawAgents do modelo).
import { mix, rgba, seg } from './math.js';
import { drawAgentBot } from './drawAgentBot.js';
import { sectionTask } from './sections.js';
import { END } from './timeline.js';

export function createAgents(w) {
  return [0, 1, 2, 3, 4].map((i) => ({
    id: 'ag.0' + (i + 1),
    x: w * (0.15 + 0.175 * i),
    y: -40 - i * 24,
    col: mix(i / 4),
    alpha: 0,
    trail: [],
    rot: i,
  }));
}

// Alvo ocioso do agente i (sem tarefa).
export function idleTarget(i, { w, h, T, complete, gather, pcx, pcy }) {
  if (gather) return [pcx + Math.cos(i * 1.256 + T) * 46, pcy + Math.sin(i * 1.256 + T) * 38];
  if (complete)
    return [w - 40 - (i % 2) * 34 + Math.sin(T * 0.8 + i * 2) * 10, h * (0.3 + 0.1 * i) + Math.cos(T * 0.7 + i) * 14];
  return [w * (0.2 + 0.15 * i) + Math.sin(T * 0.8 + i * 2) * 40, h * (0.3 + 0.1 * (i % 3)) + Math.cos(T * 0.7 + i) * 30];
}

// Move e desenha o agente `a` (indice i). p = { dt, t, T, now, w, h, complete, gather, pcx, pcy,
// allDone, jobs, sections, sparks, rng }. ctx.font deve estar definido pelo chamador.
// Devolve { top } com a tarefa de hero mais recente (para o chip) ou null.
export function stepAgent(ctx, a, i, p) {
  const { dt, t, T, now, w, complete, gather, allDone, jobs, sections, sparks } = p;
  const rng = p.rng || Math.random;
  let tx;
  let ty;
  let task = null;
  let top = null;
  if (!complete && !gather) {
    const job = jobs.find((j) => j.ag === i && t >= j.s && t < j.e);
    const pt = job && job.fn(seg(t, job.s, job.e), T, t);
    if (pt) {
      task = { x: pt[0], y: pt[1], lbl: job.label };
      tx = pt[0] + job.ox;
      ty = pt[1] + job.oy;
      top = { s: job.s, id: a.id, lbl: job.label };
    }
  } else if (complete) {
    const st = sectionTask(sections, i, now);
    if (st) {
      task = st;
      tx = st.x + st.ox;
      ty = st.y + st.oy;
    }
  }
  const idle = !task;
  if (tx === undefined) [tx, ty] = idleTarget(i, p);
  if (task) {
    tx += Math.sin(T * 23 + i) * 1.5;
    ty += Math.cos(T * 19 + i) * 1.5;
  }
  const k = 1 - Math.exp(-dt * (task ? 13 : gather ? 8 : 3.5));
  a.x += (tx - a.x) * k;
  a.y += (ty - a.y) * k;
  const targetA = allDone ? 0 : complete && idle ? 0.28 : t > 100 ? 1 : 0;
  a.alpha += (targetA - a.alpha) * (1 - Math.exp(-dt * 3));
  a.rot += dt * (task ? 4 : 1.2);
  a.trail.push([a.x, a.y]);
  if (a.trail.length > 8) a.trail.shift();
  if (a.alpha < 0.02) return { top };
  for (let j = 1; j < a.trail.length; j++) {
    ctx.strokeStyle = rgba(a.col, (j / a.trail.length) * 0.35 * a.alpha);
    ctx.lineWidth = 1 + (1.5 * j) / a.trail.length;
    ctx.beginPath();
    ctx.moveTo(a.trail[j - 1][0], a.trail[j - 1][1]);
    ctx.lineTo(a.trail[j][0], a.trail[j][1]);
    ctx.stroke();
  }
  if (task) {
    const fl = 0.55 + 0.45 * rng();
    const g = ctx.createLinearGradient(a.x, a.y, task.x, task.y);
    g.addColorStop(0, rgba(a.col, 0.9 * fl * a.alpha));
    g.addColorStop(1, `rgba(244,245,248,${fl * a.alpha})`);
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.2;
    ctx.shadowColor = rgba(a.col, 0.9);
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(task.x, task.y);
    ctx.stroke();
    ctx.fillStyle = `rgba(244,245,248,${a.alpha})`;
    ctx.beginPath();
    ctx.arc(task.x, task.y, 2.4, 0, 6.283);
    ctx.fill();
    ctx.shadowBlur = 0;
    if (rng() < 0.25) sparks.beam(task.x, task.y, a.col);
  }
  drawAgentBot(ctx, i, a.x, a.y, a.alpha, !!task || gather, T, a.col);
  if (idle && complete) return { top };
  const lbl = gather ? 'commit()' : task ? task.lbl : 'await()';
  drawAgentLabel(ctx, a, lbl, !!task || gather, w);
  return { top };
}

// Rotulo "ag.0N rotulo" ao lado do agente.
export function drawAgentLabel(ctx, a, lbl, active, w) {
  const txt = `${a.id} ${lbl}`;
  const tw = ctx.measureText(txt).width;
  const lx = a.x + 18 + tw > w - 6 ? a.x - 18 - tw : a.x + 18;
  const ly = a.y - 18;
  ctx.fillStyle = `rgba(11,18,32,${0.75 * a.alpha})`;
  ctx.fillRect(lx - 3, ly - 9, tw + 6, 13);
  ctx.fillStyle = rgba(a.col, (active ? 0.95 : 0.45) * a.alpha);
  ctx.fillText(a.id, lx, ly);
  ctx.fillStyle = `rgba(244,245,248,${(active ? 0.85 : 0.35) * a.alpha})`;
  ctx.fillText(' ' + lbl, lx + ctx.measureText(a.id).width, ly);
}

// Texto do chip de status e percentual.
export function chipMessage({ t, complete, gather, top }) {
  const pct = Math.round(seg(t, 0, END) * 100);
  const msg = complete ? 'Complete' : gather ? 'commit(hero)' : top ? `${top.id} › ${top.lbl}` : 'iniciando agentes';
  return { msg, pct };
}

// Mantem em `top` a tarefa de inicio mais recente entre os agentes (regra do chip).
export const pickTop = (top, cand) => (cand && (!top || cand.s > top.s) ? cand : top);
