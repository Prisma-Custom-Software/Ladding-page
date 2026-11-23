/* Slide 2 — O BOT: PRI flies in, charges, fires eye lasers at the 3D Prisma symbol, it shatters.
 * "TODA A ESTRUTURA / TECNOLÓGICA" arrives sliced (top half from the left, bottom half from the right).
 * PRI exits right carrying a shard; the last beat rewinds the shards into the intact prism (loop). */
(function () {
  const P = window.P, { W, H, C, ease: E, clamp, lerp, since, prog } = P;

  const PRI = { x: 245, y: 500, s: 0.82 };
  const PR = { x: 770, y: 470, size: 430 };
  const T_LAND = 0.5, T_CHARGE = 1.0, T_FIRE = 2.0, T_BREAK = 4.0, T_L1 = 4.5, T_L2 = 5.0, T_TYPE = 5.5;
  const T_EXIT0 = 6.4, T_EXIT1 = 7.2, T_REW = 7.3;
  const HIT = { x: PR.x - 70, y: PR.y + 30 };
  const Y1 = 850, Y2 = 1000, Y3 = 1122;

  // prism spins one full turn during bar 1 then freezes at the rest pose (so the break pose = loop pose)
  const prismRy = (t) => -0.35 + P.TAU * E.inOutCubic(prog(t, 0.0, 1.9));
  const REST = { x: PR.x, y: PR.y, size: PR.size, ry: -0.35, rx: 0.1 };
  let SHARDS = null;
  const shards = () => (SHARDS = SHARDS || P.shatter(P.prismFaces(REST), 21, 1));

  // forward time remap: punch, slow-mo, normal
  const tauF = (dt) => (dt < 0.1 ? dt * 1.4 : dt < 0.8 ? 0.14 + (dt - 0.1) * 0.35 : 0.385 + (dt - 0.8));
  const tauR = (t) => 2.4 * (1 - E.inOutQuart(prog(t, T_REW, P.DUR)));
  const SH_OPT = { ix: HIT.x, iy: HIT.y, speed: 1, g: 900, bias: [420, -80] };
  const FLOAT_OPT = { ix: HIT.x, iy: HIT.y, speed: 0.22, g: 30, bias: [60, -10] };
  const optFor = (s) => (s.r2 < 0.3 ? FLOAT_OPT : SH_OPT);

  const impacts = [
    { t: T_LAND, amp: 12, k: 8 },
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({ t: T_FIRE + i * 0.25, amp: 6, k: 10 })),
    { t: T_BREAK, amp: 46, k: 4.5 },
    { t: T_L1, amp: 12, k: 9 },
    { t: T_L2, amp: 16, k: 9 },
  ];

  const priState = (t) => {
    let st;
    if (t < T_EXIT0) {
      const en = P.enterLeft(t, 0, T_LAND, PRI.x, PRI.y);
      const recoil = t > T_FIRE && t < T_BREAK ? -14 * prog(t, T_FIRE, T_FIRE + 0.3) + P.noise(t * 40, 3) * 4 : 0;
      const kick = t >= T_BREAK ? -40 * P.wobble(t - T_BREAK, 1.5, 4) : 0;
      st = { x: en.x + recoil + kick, y: en.y + P.osc(t, 4) * 8, rot: en.rot, sx: en.sx - 0.08 * P.wobble(t - T_LAND, 3, 6), sy: en.sy + 0.1 * P.wobble(t - T_LAND, 3, 6), flame: en.flame };
    } else {
      const ex = P.exitRight(t, T_EXIT0, T_EXIT1, PRI.x, PRI.y);
      st = { x: ex.x, y: ex.y, rot: ex.rot, sx: ex.sx, sy: ex.sy, flame: ex.flame };
    }
    const charging = t > T_CHARGE && t < T_FIRE;
    const firing = t >= T_FIRE && t < T_BREAK;
    return {
      ...st, s: PRI.s, t,
      eye: firing ? 0.7 : 1,
      eyeGlow: 1 + (charging ? prog(t, T_CHARGE, T_FIRE) * 1.2 : 0) + (firing ? 1.1 : 0),
      mood: charging || firing ? 'focus' : t > T_BREAK + 0.4 && t < T_EXIT0 ? 'happy' : 'neutral',
      look: t < T_EXIT0 - 0.4 ? [16, 4] : [24, 0],
      ant: 0.6 + 0.4 * Math.abs(Math.sin(t * 8)),
      armL: firing ? 0.9 : 0.25 + P.osc(t, 4) * 0.1,
      armR: firing ? -1.3 : t > T_EXIT0 - 0.4 ? -2.2 : -0.3,
      flame: (st.flame || 0.5) + (firing ? 0.4 : 0),
    };
  };

  const sliced = (ctx, L, t0, stagger, col, t, glow) => {
    L.chars.forEach((c, i) => {
      if (c.ch === ' ') return;
      const tm = t0 + i * stagger;
      const tin = prog(t, tm - 0.3, tm);
      const tout = prog(t, T_REW + i * 0.01, T_REW + 0.35 + i * 0.01);
      if (tin <= 0) return;
      const dIn = 1 - E.outExpo(tin), dOut = E.inExpo(tout);
      const off = 760 * dIn + 900 * dOut;
      const weld = t >= tm ? Math.exp(-(t - tm) * 6) : 0;
      for (const half of [0, 1]) {
        ctx.save();
        ctx.translate(c.x + (half ? off : -off), L.y);
        ctx.beginPath();
        if (half === 0) ctx.rect(-c.w, -L.cap, c.w * 2, L.cap);
        else ctx.rect(-c.w, 0, c.w * 2, L.cap);
        ctx.clip();
        ctx.fillStyle = col;
        if (glow) P.glow(ctx, P.rgba(C.lime, 0.6), 24 + 30 * weld);
        P.glyph(ctx, c.ch, L.size, 'Oswald', 700, L.cap);
        ctx.restore();
      }
      if (weld > 0.02) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = P.rgba('#ffffff', weld);
        ctx.fillRect(c.x - c.w / 2 - 6, L.y - 3, c.w + 12, 6);
        ctx.restore();
        P.sparks(ctx, c.x, L.y, t - tm, { n: 12, seed: i * 3 + L.size, speed: 650, life: 0.45, spread: Math.PI * 2 });
      }
    });
  };

  const slide = {
    n: 2,
    bgOpt: { glowA: C.lilac, glowAa: 0.18, glowB: C.lime, glowBa: 0.08 },
    camera(t) {
      return P.camera(t, { impacts, punches: [{ t: T_BREAK, amt: 0.09, k: 5 }, { t: T_L2, amt: 0.04 }], drift: 5, seed: 2 });
    },
    draw(ctx, t, cam) {
      ctx.save();
      P.applyCam(ctx, cam, 0.85);
      const pri = priState(t);

      // --- the prism ---
      if (t < T_BREAK) {
        const firing = t >= T_FIRE;
        const jit = firing ? prog(t, T_FIRE, T_BREAK) * 7 : 0;
        const o = { ...REST, ry: prismRy(t), x: PR.x + P.noise(t * 45, 1) * jit, y: PR.y + P.osc(t, 2) * 10 * (firing ? 0 : 1) + P.noise(t * 45, 2) * jit, glow: 1 + (firing ? 1 : 0), heat: firing ? 0.45 * prog(t, T_FIRE + 0.8, T_BREAK) : 0, edgeGlow: firing ? 0.6 : 0 };
        // orbiting particles
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 26; i++) {
          const a = P.phase(t, 2, i / 26) * P.TAU, rr = 300 + 40 * Math.sin(i * 2.3);
          const px = PR.x + Math.cos(a) * rr, py = PR.y + Math.sin(a) * rr * 0.32 + Math.sin(i) * 20;
          ctx.fillStyle = P.rgba(i % 2 ? C.lime : C.lilac, 0.7);
          ctx.fillRect(px, py, 4, 4);
        }
        ctx.restore();
        const faces = P.drawPrism(ctx, o);
        if (firing) {
          ctx.save();
          ctx.beginPath();
          for (const f of faces) {
            f.pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
            ctx.closePath();
          }
          ctx.clip();
          P.cracks(ctx, HIT.x, HIT.y, E.outCubic(prog(t, T_FIRE + 0.2, T_BREAK)), 8, 340);
          ctx.restore();
        }
      } else if (t >= T_REW) {
        // rewind: shards fly back into place
        const tau = tauR(t);
        for (const s of shards()) {
          const p = P.shardPos(s, tau, optFor(s));
          P.drawShard(ctx, s, p.x, p.y, p.rot, p.tumble, 1, 1, 10);
        }
      } else {
        // blast + slow-mo
        const tau = tauF(t - T_BREAK);
        for (const s of shards()) {
          const p = P.shardPos(s, tau, optFor(s));
          if (p.y > H + 200 || p.x > W + 300) continue;
          P.drawShard(ctx, s, p.x, p.y, p.rot, p.tumble, 1, 1, 14);
        }
      }
      // impact FX
      P.shock(ctx, HIT.x, HIT.y, since(t, T_BREAK), { r1: 900, dur: 0.9, width: 26, fill: 0.2 });
      P.shock(ctx, HIT.x, HIT.y, since(t, T_BREAK + 0.1), { r1: 600, dur: 0.8, width: 10, color: C.lilac, fill: 0 });
      P.sparks(ctx, HIT.x, HIT.y, since(t, T_BREAK), { n: 90, seed: 4, speed: 1700, life: 1.0, g: 700 });

      // --- charge particles converging into the eyes ---
      const eyes = P.priEyes(pri);
      if (t > T_CHARGE && t < T_FIRE + 0.1) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const a0 = clamp(prog(t, T_CHARGE, T_CHARGE + 0.2));
        for (let i = 0; i < 40; i++) {
          const k = ((t - T_CHARGE) * 2.2 + P.hash(i, 8)) % 1;
          const ang = P.hash(i, 9) * P.TAU, r = 340 * (1 - E.inQuad(k));
          const [ex, ey] = eyes[i % 2];
          const x = ex + Math.cos(ang) * r, y = ey + Math.sin(ang) * r;
          const x2 = ex + Math.cos(ang) * (r + 40), y2 = ey + Math.sin(ang) * (r + 40);
          ctx.strokeStyle = P.rgba(i % 3 ? C.lime : '#ffffff', a0 * k);
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        for (const [ex, ey] of eyes) P.radial(ctx, ex, ey, 60 + 80 * prog(t, T_CHARGE, T_FIRE), C.lime, 0.5 * a0);
        ctx.restore();
      }

      // --- PRI ---
      P.drawPri(ctx, pri);
      if (t > T_EXIT0 - 0.4 && t < T_EXIT1) {
        // carries a shard in the right hand
        const s = shards()[5];
        P.drawShard(ctx, s, pri.x + 120 * PRI.s * pri.sx, pri.y + 260 * PRI.s, t * 6, 1, 1, 0.9, 16);
      }
      // trail when exiting
      if (t > T_EXIT0 + 0.2 && t < T_EXIT1) {
        const tr = [];
        for (let k = 7; k >= 0; k--) {
          const q = priState(t - k * 0.025);
          tr.push([q.x - 60, q.y + 60]);
        }
        P.trail(ctx, tr, C.lime, 90);
      }

      // --- lasers ---
      if (t >= T_FIRE - 0.04 && t < T_BREAK) {
        const a = clamp(Math.min((t - (T_FIRE - 0.04)) / 0.05, (T_BREAK - t) / 0.03));
        const tw = 14 * (1 + 0.25 * Math.sin(t * 30));
        eyes.forEach(([ex, ey], i) => P.laser(ctx, ex, ey, HIT.x + (i ? 8 : -8), HIT.y + (i ? 6 : -6), tw, t, C.lime, a));
        const fk = (t * 8) % 1;
        P.sparks(ctx, HIT.x, HIT.y, fk * 0.4, { n: 26, seed: Math.floor(t * 8), speed: 1100, life: 0.4, dir: Math.PI, spread: 2.4 });
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        P.radial(ctx, HIT.x, HIT.y, 220, C.lime, 0.7 * a);
        P.radial(ctx, HIT.x, HIT.y, 80, '#ffffff', 0.9 * a);
        // muzzle glow at the eyes
        for (const [ex, ey] of eyes) P.radial(ctx, ex, ey, 110, C.lime, 0.6 * a);
        ctx.restore();
      }
      ctx.restore();

      // --- TYPOGRAPHY (front layer) ---
      ctx.save();
      P.applyCam(ctx, cam, 1.1);
      // target reticle locking on the prism
      if (t > 0.6 && t < T_BREAK + 0.1) {
        const lock = E.outBack(prog(t, 1.4, 1.9), 2.2);
        const sc = lerp(1.6, 1, lock), a = P.ep(t, 0.6, 1.0) * (t > T_BREAK ? 0 : 1);
        const blinkOn = t < 1.9 || Math.floor(t * 8) % 2 === 0;
        ctx.save();
        ctx.translate(PR.x, PR.y);
        ctx.rotate((1 - lock) * 0.8 + (t > T_FIRE ? P.noise(t * 30, 4) * 0.03 : 0));
        ctx.globalAlpha = a;
        ctx.strokeStyle = lock >= 1 ? C.lime : C.paper;
        ctx.lineWidth = 6;
        const R = 270 * sc, L = 60;
        for (const [sxx, syy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          ctx.beginPath();
          ctx.moveTo(sxx * R, syy * (R - L));
          ctx.lineTo(sxx * R, syy * R);
          ctx.lineTo(sxx * (R - L), syy * R);
          ctx.stroke();
        }
        ctx.setLineDash([4, 14]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, R * 0.82, P.phase(t, 2) * P.TAU, P.phase(t, 2) * P.TAU + P.TAU * 0.8);
        ctx.stroke();
        ctx.setLineDash([]);
        if (blinkOn && lock > 0.9) {
          ctx.font = P.font(24, 'Roboto Mono', 700);
          ctx.fillStyle = C.lime;
          ctx.textAlign = 'left';
          ctx.fillText(t > T_FIRE ? 'DISPARANDO ▸▸▸' : 'ALVO TRAVADO', -R, -R - 18);
        }
        ctx.restore();
      }
      // laser charge meter (bottom half, before the copy lands)
      if (t > 0.5 && t < T_L1 + 0.1) {
        const inK = E.outBack(prog(t, 0.5, 0.9), 1.8), outK = E.inBack(prog(t, T_BREAK, T_L1));
        const charge = E.outCubic(prog(t, T_CHARGE, T_FIRE)) * (t < T_BREAK ? 1 - 0.15 * prog(t, T_FIRE, T_BREAK) : 0.85);
        ctx.save();
        ctx.translate(lerp(-900, 0, inK) - outK * 1200, 0);
        const x0 = 110, y0 = 880, segs = 20, sw = 40, gap = 3;
        ctx.font = P.font(26, 'Roboto Mono', 700);
        ctx.textAlign = 'left';
        ctx.fillStyle = P.rgba(C.paper, 0.75);
        ctx.fillText('CARGA DO LASER', x0, y0 - 24);
        ctx.textAlign = 'right';
        ctx.fillStyle = C.lime;
        ctx.font = P.font(74, 'Exo 2', 900);
        ctx.fillText(Math.round(charge * 100) + '%', x0 + segs * (sw + gap), y0 - 14);
        for (let i = 0; i < segs; i++) {
          const on = i / segs < charge;
          const hot = t > T_FIRE && on && (Math.floor(t * 16) + i) % 5 === 0;
          ctx.fillStyle = on ? (hot ? '#ffffff' : P.rgba(P.mixc(C.lilac, C.lime, i / segs))) : P.rgba(C.paper, 0.08);
          if (on) P.glow(ctx, P.rgba(C.lime, 0.6), 14);
          ctx.fillRect(x0 + i * (sw + gap), y0 + 4, sw, 70 - (i % 2) * 0);
          P.noGlow(ctx);
        }
        ctx.font = P.font(22, 'Roboto Mono', 500);
        ctx.textAlign = 'left';
        ctx.fillStyle = P.rgba(C.paper, 0.5);
        ctx.fillText('ALVO: O JEITO ANTIGO DE FAZER TECNOLOGIA', x0, y0 + 116);
        ctx.restore();
      }
      const L1 = P.layout(ctx, 'TODA A ESTRUTURA', 124, { track: 0.015 });
      L1.y = Y1;
      const L2 = P.layout(ctx, 'TECNOLÓGICA', 178, { track: 0.005 });
      L2.y = Y2;
      sliced(ctx, L1, T_L1, 0.012, C.paper, t, false);
      sliced(ctx, L2, T_L2, 0.035, C.lime, t, true);
      // typed mono line
      const str = 'DA SUA EMPRESA_';
      const nType = Math.floor(prog(t, T_TYPE, T_TYPE + 0.9) * 14);
      const nDel = Math.floor(prog(t, T_REW, T_REW + 0.3) * 14);
      const shown = Math.max(0, nType - nDel);
      if (t > T_TYPE) {
        ctx.font = P.font(44, 'Roboto Mono', 700);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        const full = ctx.measureText('DA SUA EMPRESA').width;
        const x0 = 540 - full / 2;
        const txt = 'DA SUA EMPRESA'.slice(0, shown);
        // highlight box
        const bw = ctx.measureText(txt).width;
        ctx.fillStyle = P.rgba(C.lilac, 0.9);
        ctx.fillRect(x0 - 14, Y3 - 32, bw + 28, 64);
        ctx.fillStyle = C.paper;
        ctx.fillText(txt, x0, Y3 + 2);
        if (Math.floor(t * 4) % 2 === 0) {
          ctx.fillStyle = C.lime;
          ctx.fillRect(x0 + bw + 6, Y3 - 24, 20, 48);
        }
      }
      ctx.restore();
    },
    flash(t) {
      const pre = prog(t, 7.86, 8) * 0.35;
      return 0.95 * P.pulse(t, T_BREAK, 7) * (t >= T_BREAK ? 1 : 0) + 0.35 * P.pulse(t, 0, 9) + pre + 0.2 * P.pulse(t, T_L2, 10) * (t >= T_L2 ? 1 : 0);
    },
    chroma(t) {
      return (t >= T_BREAK ? 20 * P.pulse(t, T_BREAK, 5) : 0) + (t >= T_REW ? 10 * Math.sin(prog(t, T_REW, 8) * Math.PI) : 0) + 8 * P.pulse(t, 0, 9);
    },
    compose(ctx, scene, t) {
      // VHS rewind on the last beat: horizontal tear bands
      if (t < T_REW) return ctx.drawImage(scene, 0, 0);
      const k = Math.sin(prog(t, T_REW, 8) * Math.PI);
      const band = 54;
      for (let y = 0; y < H; y += band) {
        const off = (P.hash(Math.floor(y / band), Math.floor(t * 30)) - 0.5) * 120 * k;
        ctx.drawImage(scene, 0, y, W, band, off, y, W, band);
      }
      ctx.fillStyle = `rgba(255,255,255,${0.06 * k})`;
      for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 2);
    },
    audio(S) {
      S.groove({ kick: true, snare: [4, 16], hats: true, pad: true, arp: [8, 15] });
      S.groove({ bass: [0, 4] });
      S.groove({ bass: [8, 15] });
      S.whoosh(0, 0.5, 1, 1);
      S.thud(T_LAND, 1);
      S.riser(T_CHARGE, 1.0, 1.1);
      S.laser(T_FIRE, 2.0, 1);
      S.shatter(T_BREAK, 1.2);
      S.stamp(T_L1, 0.8);
      for (let i = 0; i < 11; i++) S.click(T_L2 + i * 0.035, 0.9, 5200);
      S.stamp(T_L2, 1);
      for (let i = 0; i < 14; i++) S.key(T_TYPE + i * 0.0643, 1);
      S.whoosh(T_EXIT0 + 0.2, 0.7, 1.1, 1);
      S.rewind(T_REW, 0.7, 1);
      S.riser(7.3, 0.7, 0.5);
    },
  };
  P.SLIDES[2] = slide;
})();
