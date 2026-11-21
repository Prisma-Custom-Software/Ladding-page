// Entrada isolada: /preview.html?c=sections/About
// Renderiza o default export de src/components/<c>.jsx dentro do wrapper raiz do modelo.
// Props opcionais: &props={"id":"motion"} (JSON na query).
import { Suspense, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/global.css';
import PageRoot from './components/ui/PageRoot.jsx';
import { BuildProvider } from './context/BuildContext.jsx';

const modules = import.meta.glob('./components/**/*.jsx');

function Preview() {
  const params = new URLSearchParams(window.location.search);
  const name = params.get('c');
  let props = {};
  try {
    props = JSON.parse(params.get('props') || '{}');
  } catch {
    props = {};
  }
  const [Comp, setComp] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loader = modules[`./components/${name}.jsx`];
    if (!loader) {
      setError(`Componente nao encontrado: ${name}`);
      return;
    }
    loader()
      .then((m) => setComp(() => m.default))
      .catch((e) => setError(String(e)));
  }, [name]);

  return (
    <BuildProvider>
      <PageRoot>
        {error && <pre style={{ color: '#ff8080', padding: 24 }}>{error}</pre>}
        {Comp && (
          <Suspense fallback={null}>
            <Comp {...props} />
          </Suspense>
        )}
      </PageRoot>
    </BuildProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <MemoryRouter>
    <Preview />
  </MemoryRouter>,
);
