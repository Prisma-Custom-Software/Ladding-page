// Todo o conteudo textual do site (extraido de Landing Page v6.html).
import equipe480 from '../assets/img/equipe-480.webp';
import equipe800 from '../assets/img/equipe-800.webp';
import equipe1200 from '../assets/img/equipe-1200.webp';
import equipe1600 from '../assets/img/equipe-1600.webp';
import ponto from '../assets/video/ponto.mp4';
import pontoWebm from '../assets/video/ponto.webm';
import pontoPoster from '../assets/video/ponto-poster.webp';
import connectApp from '../assets/video/connect-app.mp4';
import connectAppWebm from '../assets/video/connect-app.webm';
import connectAppPoster from '../assets/video/connect-app-poster.webp';
import institucional from '../assets/video/institucional.mp4';
import institucionalWebm from '../assets/video/institucional.webm';
import institucionalPoster from '../assets/video/institucional-poster.webp';
import carrossel from '../assets/video/carrossel.mp4';
import carrosselWebm from '../assets/video/carrossel.webm';
import carrosselPoster from '../assets/video/carrossel-poster.webp';

// Slides do carrossel animado (um MP4 por slide, 4:5), abertos no visualizador interativo.
const carrosselSlides = Object.entries(
  import.meta.glob('../assets/carrossel/slide-0*.{mp4,webp}', { eager: true, import: 'default' }),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .reduce((acc, [file, url]) => {
    const n = Number(file.match(/slide-0(\d)/)[1]);
    acc[n - 1] = { ...acc[n - 1], n, [file.endsWith('.webp') ? 'poster' : 'video']: url };
    return acc;
  }, []);

export const hero = {
  kicker: 'Diferentes perspectivas. Soluções inteligentes.',
  title: ['Tecnologia que conecta pessoas, processos e ', 'resultados.'],
  text: 'Somos 6 desenvolvedores. Diferentes habilidades, uma mesma direção: transformar ideias em soluções que impulsionam negócios.',
  ctas: [
    { variant: 'primary', label: 'Fale com a gente', href: '#contato' },
    { variant: 'ghost', label: 'Ver serviços', href: '#software' },
  ],
  scroll: 'Role',
};

export const about = {
  image: equipe1600,
  imageSet: `${equipe480} 480w, ${equipe800} 800w, ${equipe1200} 1200w, ${equipe1600} 1600w`,
  imageSizes: '(max-width: 900px) 100vw, 50vw',
  alt: 'Equipe reunida em evento, vestindo camisetas amarelas',
  label: 'Quem somos',
  title: ['Somos ', '6', ' desenvolvedores.'],
  text: [
    'Diferentes habilidades, uma mesma direção: ',
    'transformar ideias em soluções que impulsionam negócios.',
  ],
  pillars: [
    { label: 'Desenvolvimento', color: '#B8FF3A' },
    { label: 'Automação', color: '#9BE07A' },
    { label: 'Integração', color: '#9A8CFF' },
    { label: 'Inovação', color: '#7B6CFF' },
  ],
};

const PROJECT_DESC = 'Cliente · ano · breve descrição do resultado.';
const placeholderProjects = (name = 'Nome do projeto') =>
  ['01', '02', '03'].map((n) => ({ n, title: name, meta: PROJECT_DESC, video: null }));

export const services = [
  {
    id: 'software',
    index: '01',
    label: 'Software',
    light: true,
    agents: [0, 1],
    title: 'Sistemas que trabalham do jeito que o seu negócio funciona.',
    text: 'Software sob medida, automações e integrações que tiram o retrabalho do caminho e deixam a operação mais rápida.',
    tags: ['web apps', 'automação', 'APIs'],
    cards: [
      {
        title: 'Sistemas web',
        text: 'Plataformas e painéis internos feitos para o seu fluxo.',
        icon: 'M3 4h18v12H3z M8 20h8 M12 16v4',
      },
      {
        title: 'Automação de processos',
        text: 'Tarefas repetitivas rodando sozinhas, com menos erro.',
        icon: 'M13 2 3 14h9l-1 8 10-12h-9l1-8Z',
      },
      {
        title: 'Integrações e APIs',
        text: 'ERP, CRM, planilhas e sistemas conversando entre si.',
        icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
      },
      {
        title: 'Evolução e suporte',
        text: 'Manutenção contínua e melhorias depois da entrega.',
        icon: 'M21 12a9 9 0 1 1-3-6.7 M21 3v6h-6',
      },
    ],
    projects: [
      { n: '01', title: 'Sistema de ponto', meta: PROJECT_DESC, video: ponto, webm: pontoWebm, poster: pontoPoster },
      { n: '02', title: 'Connect App', meta: PROJECT_DESC, video: connectApp, webm: connectAppWebm, poster: connectAppPoster },
      { n: '03', title: 'Nome do projeto', meta: PROJECT_DESC, video: null },
    ],
  },
  {
    id: 'motion',
    index: '02',
    label: 'Motion Design, Carrossel para Instagram e Edição de Vídeo',
    light: false,
    agents: [2, 3],
    title: 'Movimento que explica, vende e prende a atenção.',
    text: 'Animações, carrosséis animados para o Instagram, vídeos institucionais e edição — do roteiro à entrega final, com a cara da sua marca.',
    tags: ['motion design', 'carrossel', 'edição', 'redes sociais', 'institucional'],
    cards: [
      {
        title: 'Vídeos institucionais',
        text: 'Sua empresa contada em poucos minutos, com ritmo.',
        icon: 'M3 3h18v18H3z M7 3v18 M17 3v18 M3 8h4 M3 16h4 M17 8h4 M17 16h4',
      },
      {
        title: 'Animação de logo',
        text: 'Assinaturas animadas para abrir e fechar conteúdos.',
        icon: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
      },
      {
        title: 'Carrosséis para Instagram',
        text: 'Carrosséis animados que prendem o swipe do primeiro ao último slide.',
        icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M10 8l6 4-6 4z',
      },
      {
        title: 'Explainers animados',
        text: 'Produtos complexos explicados de forma simples.',
        icon: 'M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z',
      },
      {
        title: 'Edição e cor',
        text: 'Corte, ritmo, correção de cor e acabamento.',
        icon: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M20 4 8.12 15.88 M14.47 14.48 20 20 M8.12 8.12 12 12',
      },
      {
        title: 'Legendas e trilha',
        text: 'Legendas animadas, trilha e sound design.',
        icon: 'M4 7V4h16v3 M9 20h6 M12 4v16',
      },
    ],
    projects: [
      {
        n: '01',
        title: 'Vídeo institucional Prisma',
        meta: 'Prisma Technologies · 2026 · motion design em código, 20 s.',
        video: institucional,
        webm: institucionalWebm,
        poster: institucionalPoster,
      },
      {
        n: '02',
        title: 'Carrossel animado Prisma',
        meta: 'Prisma Technologies · 2026 · carrossel de 6 slides para o Instagram, motion em código.',
        video: carrossel,
        webm: carrosselWebm,
        poster: carrosselPoster,
        carousel: { slides: carrosselSlides, ratio: 4 / 5 },
      },
      ...placeholderProjects().slice(2),
    ],
  },
  {
    id: 'landing',
    index: '03',
    label: 'Landing Pages',
    light: true,
    agents: [4, 0],
    title: 'Páginas rápidas, bonitas e feitas para converter.',
    text: 'Páginas de venda sob medida para lançamentos, produtos e ofertas — cada bloco pensado para levar o visitante até a compra.',
    tags: ['copy', 'conversão', 'checkout', 'mobile'],
    cards: [
      {
        title: 'Estrutura de venda',
        text: 'Dor, solução, oferta e garantia no fluxo certo.',
        icon: 'M3 3h18v18H3z M3 9h18 M9 21V9',
      },
      {
        title: 'Copy persuasiva',
        text: 'Headline, oferta e argumentos na ordem que vende.',
        icon: 'M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z',
      },
      {
        title: 'Carregamento rápido',
        text: 'Cada segundo a menos é menos visitante perdido.',
        icon: 'M12 14l4-4 M3.34 19a10 10 0 1 1 17.32 0',
      },
      {
        title: 'Checkout e WhatsApp',
        text: 'Botões de compra ligados à sua plataforma de vendas.',
        icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
      },
      {
        title: 'Prova social',
        text: 'Depoimentos, resultados e selos que geram confiança.',
        icon: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
      },
      {
        title: 'Pixel e anúncios',
        text: 'Pixel da Meta e Google prontos para suas campanhas.',
        icon: 'M22 7 13.5 15.5 8.5 10.5 2 17 M16 7h6v6',
      },
    ],
    projects: placeholderProjects(),
  },
];

export const projectsLabel = 'Projetos';
export const projectPlaceholderLabel = (n) => `[ comprovação ${n} ]`;
export const projectKicker = (n) => `Projeto ${n}`;
export const projectViewer = {
  openLabel: (title) => `Abrir projeto: ${title}`,
  hint: 'Ver projeto',
  closeLabel: 'Fechar projeto',
  closeText: 'Fechar',
};
export const carouselViewer = {
  label: 'Carrossel',
  slideLabel: (n, total) => `Slide ${n} de ${total}`,
  prev: 'Slide anterior',
  next: 'Próximo slide',
  goTo: (n) => `Ir para o slide ${n}`,
  soundOn: 'Ativar som',
  soundOff: 'Desativar som',
  hint: 'Arraste ou use as setas',
};

export const contact = {
  title: ['Mais que código,', 'soluções reais.'],
  text: 'Conte o que você precisa. A gente responde com um caminho claro para chegar lá.',
  email: 'contato@prisma.tech',
  ctas: [
    { variant: 'primary', label: 'Iniciar um projeto', href: 'mailto:contato@prisma.tech' },
    { variant: 'ghost', label: 'WhatsApp', href: '#' },
  ],
};

// Os hrefs apontam para as rotas do app React (ver pages/Placeholder.jsx).
export const menu = {
  items: [
    { n: '01', href: '/', label: 'Início', desc: 'Quem somos e o que fazemos' },
    {
      n: '02',
      href: '/servicos/software',
      label: 'Serviços',
      desc: 'Software, motion e landing pages',
    },
    { n: '03', href: '/projetos', label: 'Projetos', desc: 'Trabalhos e resultados entregues' },
    { n: '04', href: '#contato', label: 'Contato', desc: 'Conte o que você precisa' },
  ],
  servicesLabel: 'Serviços',
  services: [
    { href: '/servicos/software', label: 'Software' },
    { href: '/servicos/motion', label: 'Motion e vídeo' },
    { href: '/servicos/landing', label: 'Landing pages' },
  ],
  contactLabel: 'Fale com a gente',
  email: 'contato@prisma.tech',
  cta: 'Iniciar um projeto',
  close: 'Fechar',
  open: 'Menu',
};

export const footer = {
  copyright: '© 2026 Prisma Technologies',
  slogan: 'Diferentes perspectivas. Soluções inteligentes.',
};

export const fab = { label: 'Iniciar projeto', href: '#contato' };

export const brand = { name: 'PRISMA', sub: 'TECHNOLOGIES' };
