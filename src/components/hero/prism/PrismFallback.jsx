// Prisma em SVG (o markup original do modelo). Usado sem WebGL, com prefers-reduced-motion (pronto e parado)
// e enquanto o chunk do Three.js carrega.
import { useLayoutEffect, useRef } from 'react';
import { subscribe } from '../../../engine/loop.js';
import { SLIDE, VIEWBOX, computePrismValues, prismPointSvg } from './prismGeometry.js';

const op0 = { opacity: 0 };
const dash = { strokeDashoffset: 1 };

export default function PrismFallback({ getState, onApi, ready = false }) {
  const svgRef = useRef(null);
  const cb = useRef({ getState, onApi });
  useLayoutEffect(() => {
    cb.current = { getState, onApi };
  });

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const g = (k) => svg.querySelector(`[data-k="${k}"]`);
    const apply = () => {
      const s = ready ? { b: 1, now: 0, flashAt: 0 } : cb.current.getState ? cb.current.getState() : { b: 0, now: 0, flashAt: 0 };
      const v = computePrismValues(s.b, s.now, s.flashAt);
      const edges = g('edges');
      edges.style.strokeDashoffset = 1 - v.edges.progress;
      edges.style.opacity = v.edges.opacity;
      g('inner').style.strokeDashoffset = 1 - v.inner.progress;
      g('inner').style.opacity = v.inner.opacity;
      for (const k in SLIDE) {
        const el = g(k), sl = v.slides[k];
        el.style.opacity = sl.opacity;
        el.style.transform = `translate(${sl.dx}px,${sl.dy}px)`;
      }
      g('hole').style.opacity = v.hole.opacity;
      g('hole').style.transform = `scale(${v.hole.scale})`;
      g('sheen').style.opacity = v.sheen;
      g('sheen2').style.opacity = v.sheen2;
      g('rim').style.opacity = v.rim;
      g('glow').style.opacity = v.glow;
      g('apex').style.opacity = v.apex;
      g('body').style.transform = v.bodyDy ? `translateY(${v.bodyDy}px)` : '';
      svg.style.filter = v.filter;
    };
    apply();
    const unsub = ready ? null : subscribe(apply);

    const toScreen = (p) => {
      const r = svg.getBoundingClientRect();
      return [r.left + ((p[0] - VIEWBOX[0]) / VIEWBOX[2]) * r.width, r.top + ((p[1] - VIEWBOX[1]) / VIEWBOX[3]) * r.height];
    };
    cb.current.onApi &&
      cb.current.onApi({
        getPoint(key, b, i, T) {
          const p = prismPointSvg(key, b, i, T);
          return p ? toScreen(p) : null;
        },
        getCenter() {
          const r = svg.getBoundingClientRect();
          return [r.left + r.width / 2, r.top + r.height / 2];
        },
      });
    return () => {
      if (unsub) unsub();
      cb.current.onApi && cb.current.onApi(null);
    };
  }, [ready]);

  return (
    <svg
      ref={svgRef}
      viewBox={VIEWBOX.join(' ')}
      aria-hidden="true"
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible', willChange: 'transform,filter' }}
    >
      <defs>
        <linearGradient id="pvL" x1="0.05" y1="1" x2="0.75" y2="0"><stop offset="0" stopColor="#C6FF4D" /><stop offset="0.5" stopColor="#8CF25C" /><stop offset="1" stopColor="#46D9B8" /></linearGradient>
        <linearGradient id="pvR" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stopColor="#78C4FF" /><stop offset="0.45" stopColor="#7B6CFF" /><stop offset="1" stopColor="#5A43F0" /></linearGradient>
        <linearGradient id="pvBL" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#A8F53C" /><stop offset="1" stopColor="#3CC79A" /></linearGradient>
        <linearGradient id="pvBR" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9488FF" /><stop offset="1" stopColor="#3F2DC4" /></linearGradient>
        <linearGradient id="pvHole" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stopColor="#16203A" /><stop offset="1" stopColor="#0B1220" /></linearGradient>
        <linearGradient id="pvEdge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#EFFFD0" /><stop offset="0.5" stopColor="#B8FF3A" /><stop offset="1" stopColor="#A79DFF" /></linearGradient>
        <linearGradient id="pvRim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0.1" /></linearGradient>
        <linearGradient id="pvSheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" stopOpacity="0.75" /><stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></linearGradient>
        <radialGradient id="pvApex"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.3" stopColor="#EFFFD0" stopOpacity="0.85" /><stop offset="1" stopColor="#B8FF3A" stopOpacity="0" /></radialGradient>
        <radialGradient id="pvGlow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#9F94FF" stopOpacity="0.55" /><stop offset="0.5" stopColor="#B8FF3A" stopOpacity="0.18" /><stop offset="1" stopColor="#B8FF3A" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse data-k="glow" cx="112" cy="192" rx="96" ry="10" fill="url(#pvGlow)" style={op0} />
      <g data-k="body">
        <polygon data-k="faceL" points="118,6 6,138 124,118" fill="url(#pvL)" style={op0} />
        <polygon data-k="faceR" points="118,6 124,118 194,150" fill="url(#pvR)" style={op0} />
        <polygon data-k="botL" points="6,138 124,118 122,184" fill="url(#pvBL)" style={op0} />
        <polygon data-k="botR" points="124,118 194,150 122,184" fill="url(#pvBR)" style={op0} />
        <polygon data-k="hole" points="110,42 46,120 114,104" fill="url(#pvHole)" stroke="#B8FF3A" strokeOpacity="0.35" strokeWidth="0.8" strokeLinejoin="round" style={{ opacity: 0, transformBox: 'fill-box', transformOrigin: 'center' }} />
        <path data-k="inner" d="M118 6 L124 118 M6 138 L124 118 L194 150 M124 118 L122 184" fill="none" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="0.9" strokeLinecap="round" pathLength="1" strokeDasharray="1" style={dash} />
        <polygon data-k="sheen" points="118,6 124,118 140,92" fill="url(#pvSheen)" style={op0} />
        <polygon data-k="sheen2" points="118,6 90,40 106,46" fill="url(#pvSheen)" style={op0} />
        <path data-k="edges" d="M118 6 L6 138 L122 184 L194 150 Z" fill="none" stroke="url(#pvEdge)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" pathLength="1" strokeDasharray="1" style={dash} />
        <path data-k="rim" d="M118 6 L6 138 M118 6 L124 118" fill="none" stroke="url(#pvRim)" strokeWidth="1.3" strokeLinecap="round" style={op0} />
        <circle data-k="apex" cx="118" cy="6" r="15" fill="url(#pvApex)" style={op0} />
      </g>
    </svg>
  );
}
