import { useBuild } from '../../context/BuildContext.jsx';

// Canvas fixo dos agentes (z 55, sem eventos). Desenhado pelo useBuildLoop; registra-se em refs.agents.
export default function AgentsCanvas() {
  const build = useBuild();
  return (
    <canvas
      ref={build ? build.reg('agents') : undefined}
      data-agents
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-agents)',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
