// Icone de card: svg 24x24, stroke lima 1.5, pathLength=1 (animavel por stroke-dashoffset).
// `d` pode conter varios subpaths. Leva data-b="icon" como no modelo.
export default function Icon({ d, ...rest }) {
  return (
    <svg
      data-b="icon"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="#B8FF3A"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ overflow: 'visible' }}
      {...rest}
    >
      <path d={d} pathLength="1" strokeDasharray="1" />
    </svg>
  );
}
