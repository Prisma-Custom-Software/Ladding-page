import { forwardRef } from 'react';
import styles from './Logo.module.css';

export const PRISM_POLYGONS = [
  { points: '118,6 6,138 124,118', fill: '#9BF250' },
  { points: '118,6 124,118 194,150', fill: '#7B6CFF' },
  { points: '6,138 124,118 122,184', fill: '#5ED08A' },
  { points: '124,118 194,150 122,184', fill: '#4B39D9' },
  { points: '110,42 46,120 114,104', fill: '#0B1220' },
];

// Tamanhos do modelo: 30 (hero) -> 19px/7.5px, 26 (drawer) -> 17px/7px. Outros escalam.
const WORDMARK = { 30: [19, 7.5], 26: [17, 7] };

// size = largura do SVG em px. Renderiza <a href="#topo"> (aceita ref, style, onClick, ...).
const Logo = forwardRef(function Logo({ size = 30, className = '', ...rest }, ref) {
  const [main, sub] = WORDMARK[size] || [(19 * size) / 30, (7.5 * size) / 30];
  return (
    <a ref={ref} href="#topo" className={`${styles.logo} ${className}`} {...rest}>
      <svg viewBox="0 0 200 190" style={{ width: size }} className={styles.mark}>
        {PRISM_POLYGONS.map((p) => (
          <polygon key={p.points} points={p.points} fill={p.fill} />
        ))}
      </svg>
      <span className={styles.word}>
        <span className={styles.name} style={{ fontSize: main }}>
          PRISMA
        </span>
        <span className={styles.sub} style={{ fontSize: sub }}>
          TECHNOLOGIES
        </span>
      </span>
    </a>
  );
});

export default Logo;
