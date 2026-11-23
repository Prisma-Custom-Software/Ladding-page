/* Slide 6 — "TUDO ISSO POR R$ 2.000/MÊS".
 * Bots bring the dismantled prism faces and snap the logo together on eighths. "EM UM LUGAR SÓ." is stamped, service
 * chips drop in, the price digits roll and SLAM on T8 with a shard burst. "/MÊS" stamp, CTA press. A bot rips the
 * lime face off and flies out right (back to slide 1); the logo comes apart on the last beat. */
(function () {
  const P = window.P, { W, H, C, ease: E, clamp, lerp, since, prog } = P;

  const LOGO = { x: 540, y: 312, size: 292, ry: -0.18, rx: 0.06 };
  const SNAP = [0.25, 0.5, 0.75, 1.0]; // face ids 3,1,2,0 snap in this order
  const SNAP_ORDER = [3, 1, 2, 0];
  const T_LUGAR = 1.0, T_CHIPS = 1.5, T_TUDO = 3.0, T_PRICE = 4.0, T_MES = 4.5, T_CTA = 5.5, T_PRESS = 6.0;
  const T_RIP = 6.5, T_EXIT1 = 7.3, T_APART = 7.45;
  const CHIPS = ['SOFTWARE', 'VÍDEO', 'REDES', 'TRÁFEGO', 'DADOS'];
  const FACE_COL = { 0: C.lime, 1: C.lilac, 2: C.green, 3: C.violet };

  let BURST = null;
  const burst = () => {
    if (BURST) return BURST;
    const r = P.rng(66);
    BURST = [];
    const cols = [P.PRISM_COLORS.lime, P.PRISM_COLORS.lilac, P.PRISM_COLORS.green, P.PRISM_COLORS.violet];
    for (let i = 0; i < 60; i++) {
      const sz = 10 + r() * 26;
      const a = r() * P.TAU;
      BURST.push({ rel: [[Math.cos(a) * sz, Math.sin(a) * sz], [Math.cos(a + 2.2) * sz * 0.8, Math.sin(a + 2.2) * sz * 0.8], [Math.cos(a + 4.1) * sz, Math.sin(a + 4.1) * sz]], color: cols[i % 4], cx: 540, cy: 950, r1: r(), r2: r(), r3: r(), i });
    }
    return BURST;
  };

  /** per-face offset: flying in (start), ripped (lime), apart (end) */
  const faceXform = (id, t) => {
    const j = SNAP_ORDER.indexOf(id);
    const ts = SNAP[j];
    const k = prog(t, ts - 0.55, ts);
    const e = E.outBack(k, 1.5);
    let dx = (1 - e) * (-700 - j * 120), dy = (1 - e) * (P.LANE_Y - LOGO.y - j * 60) - Math.sin(k * Math.PI) * 160;
    let rot = (1 - e) * (j % 2 ? 1.2 : -1.2), alpha = k > 0 ? 1 : 0;
    if (id === 0 && t > T_RIP) {
      const ex = P.exitRight(t, T_RIP + 0.15, T_EXIT1, LOGO.x, LOGO.y);
      dx = ex.x - LOGO.x - 40;
      dy = ex.y - LOGO.y + 90;
      rot = ex.go * 0.6;
      if (t > T_EXIT1) alpha = 0;
    }
    const ap = prog(t, T_APART, 8);
    if (ap > 0 && id !== 0) {
      const a = (j / 4) * P.TAU + 0.6;
      dx += Math.cos(a) * 1100 * E.inCubic(ap);
      dy += Math.sin(a) * 700 * E.inCubic(ap) + 300 * ap * ap;
      rot += ap * 3 * (j % 2 ? 1 : -1);
    }
    return { dx, dy, rot, alpha, snapped: t >= ts };
  };

  const stampText = (ctx, str, x, y, size, t0, t, { fam = 'Oswald', w = 700, col = C.paper, rot = 0, from = 2.8, plate = null, plateText = C.ink } = {}) => {
    if (t < t0 - 0.12) return;
    const k = prog(t, t0 - 0.12, t0);
    const sc = t < t0 ? lerp(from, 1, E.inQuad(k)) : 1 - 0.12 * P.wobble(t - t0, 4, 7);
    const out = prog(t, T_APART, 8);
    ctx.save();
    ctx.translate(x, y + 900 * out * out);
    ctx.rotate(rot + out * 0.8);
    ctx.scale(sc, sc);
    ctx.globalAlpha = t < t0 ? k : 1;
    ctx.font = P.font(size, fam, w);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    const cap = P.capH(ctx, size, fam, w);
    if (plate) {
      const tw = ctx.measureText(str).width;
      P.glow(ctx, P.rgba(plate, 0.8), 34);
      P.rr(ctx, -tw / 2 - 24, -cap / 2 - 22, tw + 48, cap + 44, 10);
      ctx.fillStyle = plate;
      ctx.fill();
      P.noGlow(ctx);
      ctx.fillStyle = plateText;
    } else ctx.fillStyle = col;
    ctx.fillText(str, 0, cap / 2);
    ctx.restore();
  };

  const slide = {
    n: 6,
    bgOpt: { glowA: C.lilac, glowAa: 0.22, glowB: C.lime, glowBa: 0.14 },
    camera(t) {
      return P.camera(t, {
        impacts: [...SNAP.map((s) => ({ t: s, amp: 8, k: 11 })), { t: T_LUGAR, amp: 16, k: 8 }, ...CHIPS.map((_, i) => ({ t: T_CHIPS + i * 0.25, amp: 5, k: 12 })), { t: T_PRICE, amp: 50, k: 4.2 }, { t: T_MES, amp: 16, k: 8 }, { t: T_PRESS, amp: 8, k: 10 }],
        punches: [{ t: T_LUGAR, amt: 0.04 }, { t: T_PRICE, amt: 0.11, k: 4.5 }],
        drift: 5,
        seed: 6,
      });
    },
    back(ctx, t, cam) {
      // rotating light burst behind the price after the slam
      const a = P.ep(t, T_PRICE, T_PRICE + 0.3) * (1 - prog(t, T_APART, 8));
      if (a <= 0) return;
      ctx.save();
      P.applyCam(ctx, cam, 0.6);
      ctx.translate(540, 950);
      ctx.rotate(P.phase(t, 1) * P.TAU * 0.5);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 16; i++) {
        ctx.rotate(P.TAU / 16);
        ctx.fillStyle = P.rgba(i % 2 ? C.lime : C.lilac, 0.07 * a);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-70, -1100);
        ctx.lineTo(70, -1100);
        ctx.fill();
      }
      ctx.restore();
    },
    draw(ctx, t, cam) {
      ctx.save();
      P.applyCam(ctx, cam, 0.9);
      // ===== logo assembly =====
      const done = t >= SNAP[3] && t < T_RIP;
      if (done) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        P.radial(ctx, LOGO.x, LOGO.y, 360, C.lilac, 0.3 + 0.25 * P.pulse(t, SNAP[3], 3));
        ctx.restore();
      }
      const ryLive = LOGO.ry + (t > SNAP[3] ? Math.sin((t - 1) * 1.6) * 0.18 : 0);
      for (const id of [3, 1, 2, 0]) {
        const fx = faceXform(id, t);
        if (fx.alpha <= 0) continue;
        const mask = [0, 0, 0, 0, 0, 0];
        mask[id] = 1;
        // bot carrying the face in
        const j = SNAP_ORDER.indexOf(id);
        const fc = P.prismFaces({ ...LOGO, ry: ryLive }).find((f) => f.id === id);
        const cx = (fc ? fc.cx : LOGO.x), cy = (fc ? fc.cy : LOGO.y);
        ctx.save();
        ctx.translate(cx + fx.dx, cy + fx.dy);
        ctx.rotate(fx.rot);
        ctx.translate(-cx, -cy);
        P.drawPrism(ctx, { ...LOGO, ry: ryLive, faces: mask, edgeGlow: fx.snapped ? P.pulse(t, SNAP[j], 6) : 0.3 });
        ctx.restore();
        if (!fx.snapped && t > SNAP[j] - 0.6) P.drawBot(ctx, { x: cx + fx.dx, y: cy + fx.dy - 80, s: 0.9, color: FACE_COL[id], t, seed: id, flame: 1.2, rot: 0.15, look: [8, 6] });
        if (fx.snapped) {
          P.sparks(ctx, cx, cy, t - SNAP[j], { n: 16, seed: id + 90, speed: 700, life: 0.45, color: FACE_COL[id] });
          // courier flies off upward after the snap
          const up = prog(t, SNAP[j], SNAP[j] + 0.5);
          if (up < 1) P.drawBot(ctx, { x: cx + up * 200 * (j % 2 ? 1 : -1), y: cy - 80 - E.inCubic(up) * 600, s: 0.9, color: FACE_COL[id], t, seed: id, flame: 1.5, sy: 1.2, sx: 0.9 });
        }
      }
      P.shock(ctx, LOGO.x, LOGO.y, since(t, SNAP[3]), { r1: 560, dur: 0.7, width: 16, fill: 0.14 });

      // ripper bot (takes the lime face out through the right edge)
      if (t > T_RIP - 0.5 && t < T_EXIT1) {
        const ap = E.outBack(prog(t, T_RIP - 0.5, T_RIP), 1.6);
        const ex = P.exitRight(t, T_RIP + 0.15, T_EXIT1, LOGO.x, LOGO.y);
        const bx = t < T_RIP + 0.15 ? lerp(W + 100, LOGO.x - 30, ap) : ex.x - 30;
        const by = t < T_RIP + 0.15 ? LOGO.y - 120 : ex.y - 60;
        if (ex.go > 0) {
          const tr = [];
          for (let k = 6; k >= 0; k--) {
            const q = P.exitRight(t - k * 0.025, T_RIP + 0.15, T_EXIT1, LOGO.x, LOGO.y);
            tr.push([q.x - 60, q.y]);
          }
          P.trail(ctx, tr, C.lime, 60);
        }
        P.drawBot(ctx, { x: bx, y: by, s: 1.25, color: C.lime, t, seed: 12, flame: ex.flame, rot: ex.rot, sx: ex.sx, sy: ex.sy, look: [10, 6], mood: t < T_RIP + 0.15 ? 'happy' : undefined });
        P.sparks(ctx, LOGO.x - 40, LOGO.y, t - (T_RIP + 0.15), { n: 24, seed: 8, speed: 800, life: 0.5 });
      }
      ctx.restore();

      // ===== typography =====
      ctx.save();
      P.applyCam(ctx, cam, 1.08);
      // EM UM LUGAR SÓ.
      stampText(ctx, 'EM UM LUGAR SÓ.', 540, 504, 92, T_LUGAR, t, { col: C.paper, from: 2.2 });
      // service chips
      ctx.font = P.font(30, 'Oswald', 700);
      const chipW = CHIPS.map((c) => ctx.measureText(c).width + 44);
      const rows = [[0, 1, 2], [3, 4]];
      rows.forEach((row, ri) => {
        const total = row.reduce((s, i) => s + chipW[i], 0) + (row.length - 1) * 14;
        let x = 540 - total / 2;
        row.forEach((i) => {
          const tc = T_CHIPS + i * 0.25;
          const cw = chipW[i];
          const cx = x + cw / 2, cy = 596 + ri * 70;
          x += cw + 14;
          if (t < tc - 0.3) return;
          const k = prog(t, tc - 0.3, tc);
          const out = prog(t, T_APART + i * 0.03, 8);
          const y = t < tc ? lerp(cy - 420, cy, E.inQuad(k)) : cy;
          const w = P.wobble(t - tc, 3.5, 7);
          ctx.save();
          ctx.translate(cx + out * (i - 2) * 300, y + 900 * out * out);
          ctx.rotate(out * (i - 2) * 0.6);
          ctx.scale(1 + 0.2 * w, 1 - 0.3 * w);
          P.rr(ctx, -cw / 2, -26, cw, 52, 26);
          ctx.fillStyle = i % 2 ? C.lilac : 'rgba(184,255,58,0.14)';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = i % 2 ? C.lilac : C.lime;
          ctx.stroke();
          ctx.fillStyle = i % 2 ? '#fff' : C.lime;
          ctx.font = P.font(30, 'Oswald', 700);
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(CHIPS[i], 0, 2);
          ctx.restore();
          P.sparks(ctx, cx, cy + 26, t - tc, { n: 8, seed: i + 40, speed: 380, life: 0.3, spread: 1.6, width: 2 });
        });
      });
      // TUDO ISSO POR — slides in letter by letter with overshoot
      {
        const L = P.layout(ctx, 'TUDO ISSO POR', 70, { track: 0.06 });
        L.chars.forEach((c, i) => {
          const tl = T_TUDO - 0.25 + i * 0.02;
          if (t < tl) return;
          const k = E.outBack(prog(t, tl, tl + 0.3), 2.2);
          const out = prog(t, T_APART, 8);
          ctx.save();
          ctx.translate(lerp(c.x + 700, c.x, k), 790 + 900 * out * out);
          ctx.rotate((1 - k) * 0.5 + out * (i % 2 ? 0.7 : -0.7));
          ctx.fillStyle = C.paper;
          P.glyph(ctx, c.ch, L.size, 'Oswald', 700, L.cap);
          ctx.restore();
        });
      }
      // PRICE — digits roll, then slam on T8
      if (t > T_TUDO) {
        const out = prog(t, T_APART, 8);
        const slam = t >= T_PRICE ? 1 - 0.18 * P.wobble(t - T_PRICE, 3.2, 5.5) : 1;
        const pre = t < T_PRICE ? lerp(0.7, 1.12, E.inCubic(prog(t, T_TUDO + 0.3, T_PRICE))) : slam;
        ctx.save();
        ctx.translate(540, 960 + 900 * out * out);
        ctx.rotate(-0.035 + out * -0.6);
        ctx.scale(pre, pre);
        const appear = E.outBack(prog(t, T_TUDO + 0.2, T_TUDO + 0.5), 2);
        ctx.globalAlpha = appear;
        const digits = ['2', '.', '0', '0', '0'];
        ctx.font = P.font(250, 'Exo 2', 900);
        const dw = digits.map((d) => ctx.measureText(d).width);
        ctx.font = P.font(100, 'Exo 2', 900);
        const rw = ctx.measureText('R$').width + 14;
        const total = rw + dw.reduce((a, b) => a + b, 0);
        let x = -total / 2;
        const cap = P.capH(ctx, 250, 'Exo 2', 900);
        const hot = t >= T_PRICE ? Math.exp(-(t - T_PRICE) * 3) : 0;
        P.glow(ctx, P.rgba(C.lime, 0.9), 40 + 60 * hot);
        ctx.fillStyle = C.lime;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('R$', x, -cap / 2 + P.capH(ctx, 100, 'Exo 2', 900) + 6);
        x += rw;
        const locked = t >= T_PRICE;
        digits.forEach((d, i) => {
          const cx = x + dw[i] / 2;
          x += dw[i];
          ctx.save();
          ctx.beginPath();
          ctx.rect(cx - dw[i], -cap / 2 - 60, dw[i] * 2, cap + 120);
          ctx.clip();
          ctx.font = P.font(250, 'Exo 2', 900);
          ctx.textAlign = 'center';
          if (locked || d === '.') {
            ctx.fillStyle = P.rgba(P.mixc(C.lime, '#ffffff', hot * 0.8));
            ctx.fillText(d, cx, cap / 2);
          } else {
            const sp = (t * (18 + i * 3)) % 1;
            for (let q = -1; q <= 1; q++) {
              const dig = String(Math.floor(P.hash(Math.floor(t * (18 + i * 3)) + q, i) * 10));
              ctx.save();
              ctx.translate(cx, cap / 2 + (q + sp) * cap * 1.3);
              ctx.scale(1, 1.3);
              ctx.fillStyle = P.rgba(C.lime, 0.7);
              ctx.fillText(dig, 0, 0);
              ctx.restore();
            }
          }
          ctx.restore();
        });
        ctx.restore();
        // impact
        P.shock(ctx, 540, 960, since(t, T_PRICE), { r1: 1000, dur: 0.9, width: 30, fill: 0.22 });
        P.shock(ctx, 540, 960, since(t, T_PRICE + 0.08), { r1: 700, dur: 0.8, width: 12, color: C.lilac, fill: 0 });
        P.sparks(ctx, 540, 960, since(t, T_PRICE), { n: 80, seed: 61, speed: 1700, life: 1.0, g: 900 });
        if (t >= T_PRICE) {
          const dt = t - T_PRICE;
          for (const s of burst()) {
            const a = s.r1 * P.TAU, v = 700 + s.r2 * 1100;
            const x = 540 + Math.cos(a) * v * dt, y = 960 + Math.sin(a) * v * dt - 300 * dt + 900 * dt * dt;
            if (y > H + 100) continue;
            P.drawShard(ctx, s, x, y, dt * (s.r3 - 0.5) * 16, Math.cos(dt * (5 + s.r1 * 8)), 1, 1, 8);
          }
        }
      }
      // /MÊS stamp
      stampText(ctx, '/MÊS', 845, 1086, 66, T_MES, t, { rot: -0.08, plate: C.lilac, plateText: '#ffffff', from: 3 });
      // CTA button
      if (t > T_CTA - 0.2) {
        const k = E.outBack(prog(t, T_CTA - 0.2, T_CTA + 0.1), 2);
        const press = t > T_PRESS ? 1 - 0.1 * Math.exp(-(t - T_PRESS) * 10) : 1;
        const out = prog(t, T_APART, 8);
        ctx.save();
        ctx.translate(390, 1160 + 900 * out * out);
        ctx.scale(k * press, k * press);
        P.rr(ctx, -250, -44, 500, 88, 44);
        ctx.fillStyle = C.lime;
        P.glow(ctx, P.rgba(C.lime, 0.7), 30);
        ctx.fill();
        P.noGlow(ctx);
        ctx.fillStyle = C.ink;
        ctx.font = P.font(46, 'Oswald', 700);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('CHAMA NA DM  →', 0, 3);
        ctx.restore();
        // ripple + tap cursor
        P.shock(ctx, 470, 1160, t - T_PRESS, { r1: 260, dur: 0.6, width: 8, color: '#ffffff', fill: 0.15, squash: 0.4 });
        if (t > T_PRESS - 0.4 && t < T_PRESS + 0.6) {
          const ck = E.outBack(prog(t, T_PRESS - 0.4, T_PRESS), 1.5);
          const cxp = lerp(700, 470, ck), cyp = lerp(1260, 1172, ck) + (t > T_PRESS ? 8 * Math.exp(-(t - T_PRESS) * 8) : 0);
          ctx.save();
          ctx.translate(cxp, cyp);
          ctx.globalAlpha = 1 - prog(t, T_PRESS + 0.3, T_PRESS + 0.6);
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, 0); ctx.lineTo(0, 44); ctx.lineTo(11, 34); ctx.lineTo(20, 54); ctx.lineTo(28, 50); ctx.lineTo(19, 31); ctx.lineTo(33, 31);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore();
    },
    flash(t) {
      const pre = Math.pow(prog(t, 7.7, 8), 2) * 0.7;
      return 0.7 * P.pulse(t, 0, 10) + 0.35 * P.pulse(t, T_LUGAR, 9) * (t >= T_LUGAR ? 1 : 0) + 1.0 * P.pulse(t, T_PRICE, 6) * (t >= T_PRICE ? 1 : 0) + pre;
    },
    flashColor: '#f2ffd9',
    chroma(t) {
      return (t >= T_PRICE ? 24 * P.pulse(t, T_PRICE, 5) : 0) + 12 * prog(t, T_APART, 8) + 8 * P.pulse(t, 0, 10);
    },
    audio(S) {
      S.groove({ kick: [0, 15], snare: [0, 15], hats: [0, 6], pad: true, bass: [0, 6], arp: [0, 6] });
      S.groove({ hats: [8, 15], bass: [8, 15], arp: [8, 15] });
      SNAP.forEach((s, i) => { S.click(s, 1, 5000); S.blip(s, [69, 72, 76, 81][i] + 12, 0.8, 'square', 0.08); });
      S.whoosh(0, 0.5, 0.8, 1);
      S.stamp(T_LUGAR, 1.1);
      CHIPS.forEach((_, i) => S.thud(T_CHIPS + i * 0.25, 0.7, -0.5 + i * 0.25));
      for (let i = 0; i < 13; i++) S.click(T_TUDO - 0.25 + i * 0.02, 0.5, 6000);
      S.riser(T_TUDO, 1.0, 1.3);
      for (let i = 0; i < 16; i++) S.click(T_TUDO + 0.2 + i * 0.05, 0.5, 2500 + i * 100);
      S.boom(T_PRICE, 1.2);
      S.stamp(T_PRICE, 1.3);
      S.coin(T_PRICE + 0.05, 1.1);
      S.shatter(T_PRICE + 0.02, 0.4);
      S.stamp(T_MES, 0.9);
      S.click(T_PRESS, 1.4, 1800);
      S.blip(T_PRESS + 0.05, 88, 1, 'sine', 0.15);
      S.whoosh(T_RIP + 0.3, 0.7, 1.1, 1);
      S.glitch(T_APART, 0.4, 0.8);
      S.riser(7.2, 0.8, 0.7);
    },
  };
  P.SLIDES[6] = slide;
})();
