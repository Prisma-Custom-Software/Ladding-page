// Loop global unico: um requestAnimationFrame para toda a pagina.
// subscribe(cb(now, dt)) devolve unsubscribe. dt em segundos, limitado a 0,05.
// Com a aba oculta, usa setTimeout(33) em vez de rAF.
const subs = new Set();
let running = false;
let last = 0;
let rafId = 0;
let timerId = 0;

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

function tick(now) {
  rafId = 0;
  timerId = 0;
  if (!running) return;
  const t = typeof now === 'number' ? now : nowMs();
  const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
  last = t;
  for (const cb of Array.from(subs)) cb(t, dt);
  schedule();
}

function schedule() {
  if (!running) return;
  if (typeof document !== 'undefined' && document.hidden) {
    timerId = setTimeout(tick, 33);
  } else {
    rafId = requestAnimationFrame(tick);
  }
}

function start() {
  if (running) return;
  running = true;
  last = nowMs();
  schedule();
}

function stop() {
  running = false;
  if (rafId) cancelAnimationFrame(rafId);
  if (timerId) clearTimeout(timerId);
  rafId = 0;
  timerId = 0;
}

export function subscribe(cb) {
  subs.add(cb);
  start();
  return () => {
    subs.delete(cb);
    if (subs.size === 0) stop();
  };
}

if (typeof document !== 'undefined') {
  // ao mudar a visibilidade, troca de rAF para setTimeout (e vice-versa) sem esperar o proximo frame
  document.addEventListener('visibilitychange', () => {
    if (!running) return;
    if (rafId) cancelAnimationFrame(rafId);
    if (timerId) clearTimeout(timerId);
    rafId = 0;
    timerId = 0;
    schedule();
  });
}
