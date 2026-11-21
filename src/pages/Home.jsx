import { BuildProvider } from '../context/BuildContext.jsx';
import PageRoot from '../components/ui/PageRoot.jsx';
import Hero from '../components/hero/Hero.jsx';
import About from '../components/sections/About.jsx';
import ServiceSection from '../components/sections/ServiceSection.jsx';
import ContactBlock from '../components/sections/ContactBlock.jsx';
import MenuButton from '../components/overlay/MenuButton.jsx';
import MenuDrawer from '../components/overlay/MenuDrawer.jsx';
import Fab from '../components/overlay/Fab.jsx';
import AgentsCanvas from '../components/overlay/AgentsCanvas.jsx';
import StatusChip from '../components/overlay/StatusChip.jsx';
import Cover from '../components/overlay/Cover.jsx';
import { services } from '../data/content.js';

// Ordem do modelo: hero, sobre, 3 servicos, contato+rodape, depois os overlays fixos.
export default function Home() {
  return (
    <BuildProvider>
      <PageRoot>
        <Hero />
        <About />
        {services.map((s) => (
          <ServiceSection key={s.id} service={s} />
        ))}
        <ContactBlock />
      </PageRoot>
      <MenuButton />
      <MenuDrawer />
      <Fab />
      <AgentsCanvas />
      <StatusChip />
      <Cover />
    </BuildProvider>
  );
}
