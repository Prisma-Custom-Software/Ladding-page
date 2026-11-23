/* Slide 1 — GANCHO: "SOFTWARE SOB MEDIDA"
 * black → PRI's eyes ignite → mini bots rise → SOFTWARE dropped letter by letter → SOB stamped → MEDIDA laser-burnt
 * → swipe chevrons → bot exits right → CRT power-off back to black (loop). */
(function () {
  const P = window.P, { W, H, C, ease: E, clamp, lerp, since, prog } = P;
  const B = P.BEAT;

  const T_SOFT = 2.0, SOFT_STEP = 0.25; // 8 letters on eighths 2.0 .. 3.75
  const T_SOB = 4.0;
  const T_MED = 4.5, MED_STEP = 0.25; // 6 letters 4.5 .. 5.75
  const T_PUNCH = 6.0;
  const T_EXIT0 = 6.5, T_EXIT1 = 7.3;
  const T_OFF = 7.5;

  const PRI = { x: 540, y: 318, s: 1.08 };
  const Y_SOFT = 690, Y_MED = 1030, Y_SOB = 868;

  // rising swarm (periodic, 3 depths)
  const swarm = [];
  {
    const r = P.rng(101);
    for (let i = 0; i < 16; i++) {
      const d = i % 3; // 0 back, 1 mid, 2 front
      swarm.push({ x: 60 + r() * (W - 120), d, ph: r(), k: [1, 2, 3][d], s: [0.38, 0.6, 1.05][d], col: [C.lilac, C.lime, C.green][(i * 7) % 3], sw: r() * P.TAU });
    }
  }

  const impacts = [
    { t: 0.0, amp: 10, k: 6 },
    { t: T_SOB, amp: 34, k: 5 },
    { t: T_PUNCH, amp: 12, k: 8 },
    ...Array.from({ length: 8 }, (_, i) => ({ t: T_SOFT + i * SOFT_STEP + 0.12, amp: 7, k: 12 })),
  ];

  const slide = {
    n: 1,
    bgOpt: { glowAa: 0.28 },
    camera(t) {
      return P.camera(t, { impacts, punches: [{ t: T_SOB, amt: 0.06 }, { t: T_PUNCH, amt: 0.05 }], drift: 5 });
    },
    // the background light "wakes" with the robot
    back(ctx, t, cam) {
      const wake = clamp(P.ep(t, 0.05, 1.2, E.outCubic));
      const flick = t < 1 ? (P.hash(Math.floor(t * 16), 4) > 0.35 ? 1 : 0.25) : 1;
      ctx.save();
      P.applyCam(ctx, cam, 0.5);
      ctx.globalCompositeOperation = 'lighter';
      P.radial(ctx, PRI.x, PRI.y - 20, 520, C.lilac, 0.36 * wake * flick);
      P.radial(ctx, PRI.x, PRI.y, 260, C.lime, 0.12 * wake * flick);
      // light rays behind the head
      ctx.translate(PRI.x, PRI.y);
      ctx.rotate(P.phase(t, 1) * P.TAU * 0.25);
      for (let i = 0; i < 12; i++) {
        ctx.rotate(P.TAU / 12);
        ctx.fillStyle = P.rgba(C.lilac, 0.035 * wake);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-40, -900);
        ctx.lineTo(40, -900);
        ctx.fill();
      }
      ctx.restore();
    },
    draw(ctx, t, cam) {
      // --- swarm: back layer behind PRI ---
      const drawSwarm = (depth) => {
        ctx.save();
        P.applyCam(ctx, cam, [0.5, 0.9, 1.4][depth]);
        const rise = P.ep(t, 1.0, 2.0, E.outCubic);
        for (const b of swarm) {
          if (b.d !== depth) continue;
          const ph = P.phase(t, b.k, b.ph);
          const y = H + 120 - ph * (H + 260) + (1 - rise) * 600;
          const x = b.x + Math.sin(ph * P.TAU * 2 + b.sw) * 40;
          P.drawBot(ctx, { x, y, s: b.s, rot: Math.cos(ph * P.TAU * 2 + b.sw) * 0.2, color: b.col, t, seed: b.sw, flame: 1, alpha: [0.45, 0.85, 1][depth] * rise, blur: depth === 2 ? 2 : depth === 0 ? 1.5 : 0, look: [Math.sin(t * 3 + b.sw) * 4, 0] });
        }
        ctx.restore();
      };
      drawSwarm(0);

      // --- PRI ---
      ctx.save();
      P.applyCam(ctx, cam, 0.8);
      const eyeOpen = since(t, 0) < 0.6 ? E.outElastic(prog(t, 0.0, 0.55), 0.4) : 1;
      const blink = Math.abs(t - 3.0) < 0.08 ? 0.1 : 1;
      const rise = E.outBack(prog(t, 0.3, 1.4), 2);
      const land = P.wobble(t - 1.4, 3, 6);
      const lasering = t > T_MED - 0.15 && t < T_MED + 6 * MED_STEP + 0.15;
      const medX = lerp(220, 860, prog(t, T_MED, T_MED + 6 * MED_STEP));
      const look = lasering ? [((medX - 540) / 540) * 16, 14] : t > T_SOFT && t < T_SOB ? [((T_SOFT + 8 * SOFT_STEP - t) < 2 ? lerp(-14, 14, prog(t, T_SOFT, T_SOB)) : 0), 12] : [P.osc(t, 2) * 6, 2];
      const pri = {
        x: PRI.x, y: PRI.y + (1 - rise) * 120 + P.osc(t, 4) * 6,
        s: PRI.s, sx: 1 - 0.06 * land, sy: 1 + 0.08 * land,
        eye: eyeOpen * blink * (lasering ? 0.75 : 1), eyeGlow: 1 + 0.9 * P.pulse(t, 0, 3) + (lasering ? 0.9 : 0),
        look, mood: lasering ? 'focus' : t > T_PUNCH ? 'happy' : 'neutral',
        ant: P.ep(t, 0.9, 1.0) * (0.6 + 0.4 * Math.abs(Math.sin(t * 6))), t,
        lit: 0.15 + 0.85 * P.ep(t, 0.1, 1.2), rim: P.ep(t, 0.05, 0.9), body: true, flame: 0.35,
        armL: 0.3 + P.osc(t, 4) * 0.1, armR: -0.3 - P.osc(t, 4, 0.5) * 0.1,
      };
      P.drawPri(ctx, pri);
      // eye-ignite flare
      const fl = P.pulse(t, 0, 3.5);
      if (fl > 0.02) {
        ctx.globalCompositeOperation = 'lighter';
        const eyes = P.priEyes(pri);
        for (const [ex, ey] of eyes) {
          const g = ctx.createLinearGradient(ex - 520, 0, ex + 520, 0);
          g.addColorStop(0, P.rgba(C.lime, 0));
          g.addColorStop(0.5, P.rgba('#ffffff', 0.9 * fl));
          g.addColorStop(1, P.rgba(C.lime, 0));
          ctx.fillStyle = g;
          ctx.fillRect(ex - 520, ey - 3, 1040, 6);
          P.radial(ctx, ex, ey, 160, C.lime, 0.6 * fl);
        }
        ctx.globalCompositeOperation = 'source-over';
      }
      // antenna ping ring
      P.shock(ctx, PRI.x, PRI.y - 175 * PRI.s + (1 - rise) * 120, since(t, 1.0), { r1: 260, dur: 0.6, width: 8, fill: 0 });
      // lasers to MEDIDA
      if (lasering) {
        const a = clamp(Math.min((t - (T_MED - 0.15)) / 0.1, (T_MED + 6 * MED_STEP + 0.15 - t) / 0.1));
        const eyes = P.priEyes(pri);
        eyes.forEach(([ex, ey], i) => P.laser(ctx, ex, ey, medX + (i ? 22 : -22), Y_MED + 20, 9, t, C.lime, a));
        P.sparks(ctx, medX, Y_MED + 20, (t * 8) % 0.5, { n: 18, seed: Math.floor(t * 8), speed: 700, life: 0.5 });
        P.radial(ctx, medX, Y_MED + 20, 140, C.lime, 0.5 * a);
      }
      ctx.restore();

      drawSwarm(1);

      // --- TYPOGRAPHY ---
      ctx.save();
      P.applyCam(ctx, cam, 1);
      // SOFTWARE — dropped by bots, squash on landing
      const L1 = P.layout(ctx, 'SOFTWARE', 228, { track: 0.01 });
      L1.chars.forEach((c, i) => {
        const td = T_SOFT + i * SOFT_STEP; // landing time = on the eighth
        const tf = td - 0.32; // release
        if (t < tf - 0.4 || t >= T_OFF + 0.5) return;
        // carrier bot
        const botIn = E.outBack(prog(t, tf - 0.4, tf), 1.4);
        const botOut = E.inCubic(prog(t, tf + 0.05, tf + 0.5));
        const HANG = Y_SOFT - 300; // letter centre while carried
        const bx = c.x, by = lerp(-420, HANG - L1.cap / 2 - 70, botIn) - botOut * 520;
        if (t < tf + 0.5) {
          if (t < tf) {
            ctx.save();
            ctx.translate(c.x, by + 70 + L1.cap / 2);
            ctx.rotate(Math.sin(t * 9 + i) * 0.05);
            ctx.fillStyle = C.paper;
            P.glyph(ctx, c.ch, L1.size, 'Oswald', 700, L1.cap);
            ctx.restore();
          }
          P.drawBot(ctx, { x: bx, y: by, s: 0.95, color: i % 2 ? C.lime : C.lilac, t, seed: i, flame: 0.9 + botOut, sx: 1 - 0.2 * botOut, sy: 1 + 0.3 * botOut, look: [0, 6] });
        }
        let y, sx = 1, sy = 1, a = 1;
        if (t < tf) return;
        if (t < td) {
          const k = prog(t, tf, td);
          y = lerp(Y_SOFT - 300, Y_SOFT, E.inQuad(k));
          sy = 1 + 0.25 * k; sx = 1 - 0.12 * k;
        } else {
          const w = P.wobble(t - td, 3.2, 7);
          y = Y_SOFT; sy = 1 - 0.32 * w; sx = 1 + 0.2 * w;
        }
        // CRT-off handled globally; also letters shake on SOB stamp
        const kick = P.pulse(t, T_SOB, 7) * (t >= T_SOB ? 1 : 0);
        ctx.save();
        ctx.translate(c.x, y + L1.cap / 2);
        ctx.scale(sx, sy);
        ctx.translate(0, -L1.cap / 2 - kick * 26 * Math.sin(i * 1.7));
        // shine sweep after punch: gradient fill, band travels across the word
        const sh = prog(t, T_PUNCH, T_PUNCH + 0.6);
        if (sh > 0 && sh < 1) {
          const gx = lerp(-700, 700, sh) - (c.x - 540);
          const g = ctx.createLinearGradient(gx - 90, 0, gx + 90, 0);
          g.addColorStop(0, C.paper);
          g.addColorStop(0.5, C.lime);
          g.addColorStop(1, C.paper);
          ctx.fillStyle = g;
        } else ctx.fillStyle = C.paper;
        P.glyph(ctx, c.ch, L1.size, 'Oswald', 700, L1.cap);
        ctx.restore();
        P.dust(ctx, c.x, Y_SOFT + L1.cap / 2, t - td, { w: 90, n: 8, seed: i + 3 });
        P.sparks(ctx, c.x, Y_SOFT + L1.cap / 2, t - td, { n: 10, seed: i + 20, speed: 520, life: 0.4, spread: 1.4 });
      });

      // SOB — stamp
      if (t >= T_SOB - 0.12) {
        const k = prog(t, T_SOB - 0.12, T_SOB);
        const sc = t < T_SOB ? lerp(3.6, 1, E.inQuad(k)) : 1 - 0.14 * P.wobble(t - T_SOB, 4, 7);
        const a = t < T_SOB ? k : 1;
        ctx.save();
        ctx.translate(540, Y_SOB);
        ctx.rotate(-0.06);
        ctx.scale(sc, sc);
        ctx.globalAlpha = a;
        // stamp plate
        P.glow(ctx, P.rgba(C.lime, 0.8), 40 * (1 + P.pulse(t, T_SOB, 4)));
        P.rr(ctx, -150, -72, 300, 144, 10);
        ctx.fillStyle = C.lime;
        ctx.fill();
        P.noGlow(ctx);
        ctx.fillStyle = C.ink;
        ctx.font = P.font(140, 'Oswald', 700);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        const cap = P.capH(ctx, 140);
        ctx.fillText('SOB', 0, cap / 2);
        // stamp texture: worn ink specks
        ctx.globalCompositeOperation = 'destination-out';
        const r = P.rng(55);
        for (let i = 0; i < 60; i++) ctx.fillRect(-150 + r() * 300, -72 + r() * 144, 2 + r() * 4, 2 + r() * 3);
        ctx.restore();
        P.shock(ctx, 540, Y_SOB, since(t, T_SOB), { r1: 760, dur: 0.8, width: 22, fill: 0.16 });
        P.shock(ctx, 540, Y_SOB, since(t, T_SOB + 0.08), { r1: 520, dur: 0.7, width: 8, color: C.lilac, fill: 0 });
        P.sparks(ctx, 540, Y_SOB, since(t, T_SOB), { n: 60, seed: 9, speed: 1500, life: 0.9 });
      }

      // MEDIDA — laser-burnt (white hot → lime) with embers
      const L3 = P.layout(ctx, 'MEDIDA', 268, { track: 0.01 });
      L3.chars.forEach((c, i) => {
        const tb = T_MED + i * MED_STEP;
        if (t < tb) return;
        const heat = Math.exp(-(t - tb) * 2.2);
        const rev = E.outCubic(prog(t, tb, tb + 0.18));
        ctx.save();
        ctx.translate(c.x, Y_MED);
        // reveal bottom-up like burning in
        ctx.beginPath();
        ctx.rect(-c.w, L3.cap / 2 - (L3.cap + 40) * rev, c.w * 2, (L3.cap + 40) * rev);
        ctx.clip();
        const col = P.mixc(C.lime, '#fff6d6', heat);
        P.glow(ctx, heat > 0.15 ? P.rgba('#ffb347', heat) : P.rgba(C.lime, 0.5), 30 + 40 * heat);
        ctx.fillStyle = P.rgba(col);
        P.glyph(ctx, c.ch, L3.size, 'Oswald', 700, L3.cap);
        P.noGlow(ctx);
        // molten edge line
        if (rev < 1) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-c.w / 2, L3.cap / 2 - (L3.cap + 40) * rev - 3, c.w, 6);
        }
        ctx.restore();
      });
      if (t > T_MED) P.embers(ctx, L3.x0, Y_MED - L3.cap / 2, L3.width, L3.cap, t, { n: 46, a: clamp(1 - prog(t, 6.6, 7.4)) * P.ep(t, T_MED, T_MED + 0.3), rise: 260 });

      // swipe hint: chevrons light in sequence on eighths
      if (t > T_PUNCH - 0.1) {
        const a = P.ep(t, T_PUNCH - 0.1, T_PUNCH + 0.2, E.outBack);
        ctx.save();
        ctx.translate(lerp(1200, 0, a), 0);
        ctx.font = P.font(34, 'Roboto Mono', 700);
        ctx.textAlign = 'right';
        ctx.fillStyle = C.paper;
        ctx.fillText('ARRASTA', 850, 1180);
        for (let i = 0; i < 3; i++) {
          const on = (Math.floor((t - T_PUNCH) / 0.25) % 4) === i;
          const x = 884 + i * 50;
          ctx.save();
          ctx.translate(x + (on ? 12 : 0), 1168);
          P.glow(ctx, C.lime, on ? 30 : 0);
          ctx.strokeStyle = on ? C.lime : P.rgba(C.lime, 0.35);
          ctx.lineWidth = 9;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(-10, -22); ctx.lineTo(12, 0); ctx.lineTo(-10, 22);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // handoff bot: picks up and flies through the right edge
      if (t > T_EXIT0 - 0.6 && t < T_EXIT1 + 0.1) {
        const appear = E.outBack(prog(t, T_EXIT0 - 0.6, T_EXIT0 - 0.1), 2);
        const ex = P.exitRight(t, T_EXIT0, T_EXIT1, 760, 1110);
        const trail = [];
        for (let k = 6; k >= 0; k--) {
          const e2 = P.exitRight(t - k * 0.025, T_EXIT0, T_EXIT1, 760, 1110);
          trail.push([e2.x - 40, e2.y + 10]);
        }
        if (ex.go > 0) P.trail(ctx, trail, C.lime, 40);
        P.drawBot(ctx, { x: ex.x, y: ex.y + (1 - appear) * 300, s: 1.25 * appear, rot: ex.rot, sx: ex.sx, sy: ex.sy, flame: ex.flame, t, color: C.lime, look: [8, 0], seed: 4,
          cargo: (cx) => P.drawPrism(cx, { x: 0, y: 70, size: 56, ry: t * 4, edges: false }) });
      }
      ctx.restore();

      drawSwarm(2);
    },
    over(ctx, t) {
      // sparks drifting in front
      P.embers(ctx, 0, H * 0.4, W, H * 0.6, t, { n: 24, seed: 3, a: 0.5 * P.ep(t, 1, 2), color: C.lilac, rise: 300 });
    },
    flash(t) {
      return 0.75 * P.pulse(t, T_SOB, 9) * (t >= T_SOB ? 1 : 0) + 0.25 * P.pulse(t, T_PUNCH, 10) * (t >= T_PUNCH ? 1 : 0);
    },
    chroma(t) {
      return t >= T_SOB ? 14 * P.pulse(t, T_SOB, 7) : 0;
    },
    hudAlpha(t) {
      return P.ep(t, 0.6, 1.4);
    },
    // CRT power-off on the last beat; black at t = 0 and t = 8 (seamless)
    compose(ctx, scene, t) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, W, H);
      const intro = P.ep(t, 0, 0.35, E.outCubic); // the darkness lifts as the eyes ignite
      if (t < T_OFF) {
        ctx.globalAlpha = 1;
        ctx.drawImage(scene, 0, 0);
        if (intro < 1) {
          ctx.fillStyle = `rgba(0,0,0,${(1 - intro) * 0.92})`;
          ctx.fillRect(0, 0, W, H);
        }
        return;
      }
      const k = prog(t, T_OFF, P.DUR);
      const sy = k < 0.45 ? lerp(1, 0.006, E.inExpo(k / 0.45)) : 0.006;
      const sx = k < 0.45 ? 1 + 0.05 * (k / 0.45) : lerp(1.05, 0, E.inCubic((k - 0.45) / 0.4));
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.scale(Math.max(0, sx), sy);
      ctx.drawImage(scene, -W / 2, -H / 2);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,255,255,${clamp(k * 2.2)})`;
      ctx.fillRect(-W / 2, -H / 2, W, H);
      ctx.restore();
      // afterglow dot
      const dot = k > 0.45 ? 1 - prog(k, 0.75, 1) : 0;
      if (dot > 0) {
        ctx.globalCompositeOperation = 'lighter';
        P.radial(ctx, W / 2, H / 2, 90 * dot, C.lime, 0.9 * dot);
        ctx.globalCompositeOperation = 'source-over';
      }
    },
    audio(S) {
      S.boom(0, 0.9);
      S.bootUp(0.02, 1);
      S.servo(0.3, 0.9, 1, true);
      S.blip(1.0, 96, 1, 'sine', 0.2);
      S.groove({ pad: true, hats: [4, 15], kick: [4, 15], snare: [8, 15], bass: [4, 15], arp: [8, 15] });
      for (let i = 0; i < 8; i++) {
        S.thud(T_SOFT + i * SOFT_STEP, 0.8, -0.6 + i * 0.17);
        S.whoosh(T_SOFT + i * SOFT_STEP - 0.32, 0.3, 0.25, 1);
      }
      S.stamp(T_SOB, 1.3);
      S.boom(T_SOB, 0.8);
      S.laser(T_MED - 0.12, 6 * MED_STEP + 0.25, 0.8);
      for (let i = 0; i < 6; i++) S.blip(T_MED + i * MED_STEP, [69, 72, 76, 79, 81, 84][i] + 12, 0.7);
      for (let i = 0; i < 8; i++) S.snare(T_PUNCH + i * 0.0625 * 2, 0.25 + i * 0.05);
      S.whoosh(T_EXIT0 + 0.1, 0.75, 1.1, 1);
      S.powerDown(T_OFF, 1);
    },
  };
  P.SLIDES[1] = slide;
})();
