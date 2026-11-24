import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Placeholder from './pages/Placeholder.jsx';
import Projects from './pages/Projects.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/servicos/:slug" element={<Placeholder />} />
      <Route path="/projetos" element={<Projects />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
