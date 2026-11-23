/* Prisma carousel engine — core math, easing, timing, color.
 * Everything is a pure function of time so any frame can be rendered by seeking (deterministic, loop-safe). */
(function (G) {
  const P = (G.P = G.P || {});

  P.W = 1080;
  P.H = 1350;
  P.BPM = 120;
  P.BEAT = 60 / P.BPM; // 0.5 s
  P.DUR = 8; // 4 bars
  P.FPS = 30;

  P.C = {
    ink: '#0b1220',
    inkDeep: '#101a30',
    inkHi: '#1a2540',
    paper: '#f4f5f8',
    lime: '#b8ff3a',
    limeLogo: '#9ef150',
    lilac: '#7b6cff',
    lilacSoft: '#9a8cff',
    violet: '#4b39d9',
    green: '#5fd08a',
    green2: '#9be07a',
    white: '#ffffff',
  };

  // ---------- math ----------
  const clamp = (P.clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x));
  P.lerp = (a, b, t) => a + (b - a) * t;
  P.prog = (t, a, b) => clamp((t - a) / (b - a));
  P.smooth = (t) => t * t * (3 - 2 * t);
  P.TAU = Math.PI * 2;
  P.beat = (n) => n * P.BEAT;
  /** time elapsed since event t0, wrapped to the loop so decays are seamless */
  P.since = (t, t0) => (((t - t0) % P.DUR) + P.DUR) % P.DUR;
  /** exponential decay pulse after an event (loop-wrapped) */
  P.pulse = (t, t0, k = 8) => Math.exp(-P.since(t, t0) * k);
  /** loop-periodic phase 0..1 for n cycles per loop */
  P.phase = (t, n = 1, off = 0) => ((((t / P.DUR) * n + off) % 1) + 1) % 1;
  P.osc = (t, n = 1, off = 0) => Math.sin(P.TAU * ((t / P.DUR) * n + off));

  // ---------- easing ----------
  const E = (P.ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inCubic: (t) => t * t * t,
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    inQuart: (t) => t * t * t * t,
    outExpo: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inExpo: (t) => (t <= 0 ? 0 : Math.pow(2, 10 * t - 10)),
    inOutQuart: (t) => (t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    inOutExpo: (t) =>
      t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
    outBack: (t, s = 1.70158) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
    inBack: (t, s = 1.70158) => (s + 1) * t * t * t - s * t * t,
    outElastic: (t, p = 0.32) =>
      t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * P.TAU) / p) + 1,
    outBounce: (t) => {
      const n = 7.5625, d = 2.75;
      if (t < 1 / d) return n * t * t;
      if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
      if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
      return n * (t -= 2.625 / d) * t + 0.984375;
    },
  });
  /** eased progress between two times */
  P.ep = (t, a, b, fn = E.outCubic) => fn(clamp((t - a) / (b - a)));
  /** damped spring 0→1 (overshoots), dt seconds after start */
  P.spring = (dt, freq = 3.2, damp = 6) => (dt <= 0 ? 0 : 1 - Math.exp(-damp * dt) * Math.cos(P.TAU * freq * dt));
  /** decaying wobble around 0 (for squash & stretch after a landing) */
  P.wobble = (dt, freq = 4, damp = 7) => (dt < 0 ? 0 : Math.exp(-damp * dt) * Math.sin(P.TAU * freq * dt));

  /** keyframe track: [[t, value, easeFn?], ...] value can be number or array */
  P.track = (t, keys) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, fn] = keys[i];
      const [t0, v0] = keys[i - 1];
      if (t <= t1) {
        const k = (fn || E.inOutCubic)((t - t0) / (t1 - t0));
        if (Array.isArray(v0)) return v0.map((a, j) => a + (v1[j] - a) * k);
        return v0 + (v1 - v0) * k;
      }
    }
    return keys[keys.length - 1][1];
  };

  // ---------- random / noise ----------
  P.rng = (seed) => {
    let a = seed >>> 0 || 1;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  P.hash = (i, s = 0) => {
    let x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };
  P.noise = (x, s = 0) => {
    const i = Math.floor(x), f = x - i;
    const u = f * f * (3 - 2 * f);
    return P.lerp(P.hash(i, s), P.hash(i + 1, s), u) * 2 - 1;
  };
  /** loop-periodic noise: n cycles per loop, periodic in t with period DUR */
  P.pnoise = (t, rate = 16, s = 0) => {
    const x = (P.phase(t) * rate) % rate;
    const i = Math.floor(x), f = x - i;
    const u = f * f * (3 - 2 * f);
    return P.lerp(P.hash(i % rate, s), P.hash((i + 1) % rate, s), u) * 2 - 1;
  };

  // ---------- color ----------
  P.hex = (h) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  P.rgba = (h, a = 1) => {
    const [r, g, b] = Array.isArray(h) ? h : P.hex(h);
    return `rgba(${r | 0},${g | 0},${b | 0},${a})`;
  };
  P.mixc = (h1, h2, k) => {
    const a = Array.isArray(h1) ? h1 : P.hex(h1), b = Array.isArray(h2) ? h2 : P.hex(h2);
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  };

  // ---------- camera ----------
  /** impacts: [{t, amp, k}] -> loop-safe shake offset; punches: [{t, amt, k}] -> zoom */
  P.camera = (t, { impacts = [], punches = [], drift = 6, seed = 1 } = {}) => {
    let sx = 0, sy = 0, rot = 0, zoom = 1;
    for (const im of impacts) {
      const d = P.since(t, im.t);
      const e = Math.exp(-d * (im.k || 9)) * im.amp;
      if (e < 0.05) continue;
      const f = 38;
      sx += e * P.noise(d * f, seed + im.t * 7);
      sy += e * P.noise(d * f, seed + im.t * 7 + 50);
      rot += e * 0.0016 * P.noise(d * f, seed + im.t * 7 + 90);
    }
    for (const pu of punches) {
      const d = P.since(t, pu.t);
      zoom += pu.amt * Math.exp(-d * (pu.k || 7)) * (d < 0.04 ? d / 0.04 : 1);
    }
    const dx = P.osc(t, 1, 0.1) * drift, dy = P.osc(t, 2, 0.35) * drift * 0.6;
    return { x: dx + sx, y: dy + sy, rot, zoom, dx, dy };
  };
  /** apply camera with a parallax depth (0 = static, 1 = mid, >1 = foreground) */
  P.applyCam = (ctx, cam, depth = 1) => {
    const z = 1 + (cam.zoom - 1) * depth;
    ctx.translate(P.W / 2, P.H / 2);
    ctx.rotate(cam.rot * depth);
    ctx.scale(z, z);
    ctx.translate(-P.W / 2 + cam.x * depth, -P.H / 2 + cam.y * depth);
  };
})(typeof window !== 'undefined' ? window : globalThis);
