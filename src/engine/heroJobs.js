// Tabela de tarefas dos agentes na intro (porte 1:1 de buildHeroJobs do modelo).
// getters = {
//   logoCenter(): [x,y]|null            centro do logo
//   caret(key): [x,y,h]|null            cursor atual de 'links'|'kicker'|'h1'|'p'
//   trace(name, u): [x,y]|null          ponto no contorno de 'cta'|'btn1'|'btn2'
//   prismPoint(key, b, i, T): [x,y]|null  (prismApi.getPoint)
// }
import { PRISM0, PRISM1, pb } from './timeline.js';

export function buildHeroJobs(getters) {
  const J = [];
  const add = (ag, s, e, label, fn, ox = 0, oy = -30) => J.push({ ag, s, e, label, fn, ox, oy });
  const pj = (ag, b0, b1, key, label, ox, oy) =>
    add(
      ag,
      PRISM0 + b0 * (PRISM1 - PRISM0),
      PRISM0 + b1 * (PRISM1 - PRISM0),
      label,
      (u, T, t) => getters.prismPoint(key, pb(t), ag, T),
      ox,
      oy
    );
  add(0, 400, 1400, 'mount(nav.logo)', () => getters.logoCenter(), 22, 26);
  add(1, 700, 1800, 'render(nav.links)', () => getters.caret('links'), 0, 30);
  add(2, 1300, 2000, 'draw(nav.cta)', (u) => getters.trace('cta', u), -10, 30);
  add(3, 1600, 2500, 'type(hero.kicker)', () => getters.caret('kicker'), 6, -26);
  add(0, 2100, 4600, 'type(hero.title)', () => getters.caret('h1'), 8, -40);
  add(1, 4000, 5400, 'type(hero.text)', () => getters.caret('p'), 8, -28);
  add(2, 5100, 5700, 'draw(btn.primary)', (u) => getters.trace('btn1', u), 0, -28);
  add(1, 5400, 6000, 'draw(btn.secondary)', (u) => getters.trace('btn2', u), 0, 30);
  pj(3, 0, 0.3, 'edges', 'trace(prism.edges)', 34, -26);
  pj(3, 0.3, 0.48, 'faceL', 'fill(face.left)', -38, -20);
  pj(3, 0.48, 0.66, 'botL', 'fill(base.left)', -38, 26);
  pj(3, 0.66, 0.82, 'hole', 'carve(negative)', -36, -26);
  pj(4, 0.1, 0.38, 'inner', 'trace(prism.core)', 36, 24);
  pj(4, 0.38, 0.6, 'faceR', 'fill(face.right)', 38, -22);
  pj(4, 0.6, 0.78, 'botR', 'fill(base.right)', 36, 28);
  pj(4, 0.8, 0.98, 'rim', 'polish(edges)', 36, -24);
  pj(2, 0.78, 0.9, 'sheen', 'polish(glass)', 34, -30);
  pj(2, 0.9, 1, 'apex', 'ignite(apex)', 0, -34);
  return J;
}
