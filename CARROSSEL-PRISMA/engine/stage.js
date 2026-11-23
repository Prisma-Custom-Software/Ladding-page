/* Prisma carousel engine — frame pipeline shared by every slide.
 * layers: background (parallax far) → belt + seam prisms → slide mid layer → foreground → post (flash, vignette, grain, HUD) */
(function (G) {
  const P = G.P;
  const { W, H } = P;
  P.SLIDES = P.SLIDES || {};

  const mk = () => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    return c;
  };

  P.stage = (canvas, slide) => {
    const ctx = canvas.getContext('2d');
    const scene = mk(), sctx = scene.getContext('2d');
    let tmpA, tmpB;
    const chroma = (amt) => {
      tmpA = tmpA || mk();
      tmpB = tmpB || mk();
      const a = tmpA.getContext('2d'), b = tmpB.getContext('2d');
      for (const [c, col] of [[a, '#ff0000'], [b, '#00ffff']]) {
        c.globalCompositeOperation = 'source-over';
        c.clearRect(0, 0, W, H);
        c.drawImage(scene, 0, 0);
        c.globalCompositeOperation = 'multiply';
        c.fillStyle = col;
        c.fillRect(0, 0, W, H);
      }
      sctx.save();
      sctx.globalCompositeOperation = 'source-over';
      sctx.drawImage(tmpB, -amt, 0);
      sctx.globalCompositeOperation = 'lighter';
      sctx.drawImage(tmpA, amt, amt * 0.3);
      sctx.restore();
    };
    return {
      draw(t) {
        t = ((t % P.DUR) + P.DUR) % P.DUR;
        const cam = slide.camera ? slide.camera(t) : P.camera(t);
        sctx.setTransform(1, 0, 0, 1, 0, 0);
        sctx.globalAlpha = 1;
        sctx.globalCompositeOperation = 'source-over';
        sctx.filter = 'none';
        P.bg(sctx, t, cam, slide.n, slide.bgOpt || {});
        if (slide.back) {
          sctx.save();
          slide.back(sctx, t, cam);
          sctx.restore();
        }
        if (!slide.noBelt) {
          sctx.save();
          P.applyCam(sctx, cam, 1);
          P.belt(sctx, t);
          P.seams(sctx, slide.n);
          sctx.restore();
        }
        sctx.save();
        slide.draw(sctx, t, cam);
        sctx.restore();
        P.front(sctx, t, cam, slide.frontOpt || {});
        if (slide.over) {
          sctx.save();
          slide.over(sctx, t, cam);
          sctx.restore();
        }
        const ca = slide.chroma ? slide.chroma(t) : 0;
        if (ca > 0.6) chroma(ca);
        P.flash(sctx, slide.flash ? slide.flash(t) : 0, slide.flashColor || '#ffffff');
        P.vignette(sctx, 0.6);
        P.grain(sctx, t, 0.08);
        P.hud(sctx, t, slide.n, { alpha: slide.hudAlpha ? slide.hudAlpha(t) : 1 });
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (slide.compose) slide.compose(ctx, scene, t);
        else ctx.drawImage(scene, 0, 0);
      },
    };
  };

  /** fonts used by the carousel */
  P.loadFonts = async () => {
    const specs = ['700 100px "Oswald"', '500 100px "Oswald"', '800 100px "Exo 2"', '900 100px "Exo 2"', '500 20px "Roboto Mono"', '700 20px "Roboto Mono"'];
    await Promise.all(specs.map((s) => document.fonts.load(s, 'ABCÇÃÉÓ0123456789$R/')));
    await document.fonts.ready;
  };

  // ---------- shared choreography helpers ----------
  /** handoff lane: robot flies out right at the end of a slide and enters left at the start of the next one */
  P.LANE_Y = 1030;
  /** entry from the left edge: returns {x, y, vx, sx, sy, rot, flame} */
  P.enterLeft = (t, t0, t1, xTo, yTo, y0 = P.LANE_Y) => {
    const k = P.prog(t, t0, t1);
    const e = P.ease.outBack(k, 1.3);
    const x = P.lerp(-160, xTo, e), y = P.lerp(y0, yTo, P.ease.outCubic(k));
    const v = k < 1 ? (1 - k) : 0;
    return { x, y, rot: 0.25 * v - 0.08 * P.wobble(t - t1, 3, 6), sx: 1 + 0.35 * v, sy: 1 - 0.22 * v, flame: 0.5 + 0.8 * v, k };
  };
  /** exit through the right edge on the lane */
  P.exitRight = (t, t0, t1, x0, y0, yLane = P.LANE_Y) => {
    const k = P.prog(t, t0, t1);
    const ant = k < 0.25 ? P.ease.outQuad(k / 0.25) : 1; // anticipation squash
    const go = P.ease.inQuart(P.prog(k, 0.25, 1));
    const x = P.lerp(x0, W + 260, go) - 30 * ant * (1 - go) * (k < 0.25 ? 1 : 0);
    const y = P.lerp(y0, yLane, P.ease.inOutCubic(k));
    const spd = go > 0 ? Math.min(1, go * 2.5) : 0;
    return { x, y, rot: 0.3 * spd, sx: (k < 0.25 ? 1 - 0.18 * ant : 1 + 0.45 * spd), sy: (k < 0.25 ? 1 + 0.12 * ant : 1 - 0.25 * spd), flame: 0.6 + spd * 1.2, k, go };
  };
})(window);
