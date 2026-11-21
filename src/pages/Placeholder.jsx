import { Link, useParams } from 'react-router-dom';
import PageRoot from '../components/ui/PageRoot.jsx';
import { services } from '../data/content.js';

export default function Placeholder() {
  const { slug } = useParams();
  const service = services.find((s) => s.id === slug);
  const title = service ? service.label : 'Projetos';
  return (
    <PageRoot>
      <main
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          textAlign: 'center',
          padding: '0 20px',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-title)',
            fontWeight: 500,
            textTransform: 'uppercase',
            fontSize: 'clamp(34px,4.4vw,60px)',
          }}
        >
          {title}
        </h1>
        <p style={{ margin: 0, color: 'var(--text-dim)' }}>Página em construção.</p>
        <Link to="/">Voltar ao início</Link>
      </main>
    </PageRoot>
  );
}
