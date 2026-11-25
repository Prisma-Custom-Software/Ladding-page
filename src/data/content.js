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
import botsSam from '../assets/video/bots-sam.mp4';
import botsSamWebm from '../assets/video/bots-sam.webm';
import botsSamPoster from '../assets/video/bots-sam-poster.webp';

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
  kicker: 'Software · Automação · Motion · Landing pages',
  title: ['Software sob medida que faz o trabalho repetitivo ', 'sozinho.'],
  text: 'Somos 6 desenvolvedores. Já colocamos no ar robôs que lançam intimações com prazo, um ponto eletrônico que funciona offline e o app de um evento inteiro.',
  ctas: [
    { variant: 'primary', label: 'Pedir orçamento', href: '#contato' },
    { variant: 'ghost', label: 'Ver o que fazemos', href: '#software' },
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
    'Código, automação, integração e motion na mesma equipe: ',
    'você fala direto com quem constrói.',
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
    text: 'Sistemas web, apps e robôs feitos para o seu processo. A planilha que alguém atualiza à mão toda segunda vira uma tela que se atualiza sozinha.',
    tags: ['web apps', 'automação', 'APIs'],
    cards: [
      {
        title: 'Sistemas web',
        text: 'Plataformas e painéis internos feitos para o seu fluxo.',
        icon: 'M3 4h18v12H3z M8 20h8 M12 16v4',
      },
      {
        title: 'Automação de processos',
        text: 'Robôs que fazem a tarefa repetitiva todo dia, no mesmo horário, sem esquecer.',
        icon: 'M13 2 3 14h9l-1 8 10-12h-9l1-8Z',
      },
      {
        title: 'Integrações e APIs',
        text: 'ERP, CRM, planilhas e sistemas conversando entre si.',
        icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
      },
      {
        title: 'Evolução e suporte',
        text: 'Depois da entrega a gente continua: ajustes, melhorias e suporte.',
        icon: 'M21 12a9 9 0 1 1-3-6.7 M21 3v6h-6',
      },
    ],
    projects: [
      {
        n: '01',
        title: 'Sistema de ponto',
        meta: PROJECT_DESC,
        video: ponto,
        webm: pontoWebm,
        poster: pontoPoster,
        // Destaque na pagina de projetos (informacoes tiradas do proprio video do produto).
        feature: {
          kicker: 'Em destaque',
          name: 'Atlas Ponto',
          lead: 'O ponto eletrônico do RFeitosa Group. Bata o ponto em um toque, direto do celular.',
          highlights: [
            {
              title: 'Offline-first',
              text: 'Sem internet, bate do mesmo jeito: o registro fica cifrado no aparelho e sincroniza sozinho.',
              icon: 'M1 1l22 22 M16.72 11.06A10.94 10.94 0 0 1 19 12.55 M5 12.55a10.94 10.94 0 0 1 5.17-2.39 M10.71 5.05A16 16 0 0 1 22.58 9 M1.42 9a15.91 15.91 0 0 1 4.7-2.88 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01',
            },
            {
              title: 'Blindado para auditoria',
              text: 'Ponto registrado não se apaga: Portaria 671/2021 (REP-P), NSR sequencial e cadeia de hash SHA-256.',
              icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
            },
            {
              title: 'Antifraude',
              text: 'Verificação de GPS e de relógio no momento do registro.',
              icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
            },
            {
              title: 'Privacidade e app',
              text: 'CPF sempre mascarado, modo escuro e instalação como app (PWA) na tela inicial.',
              icon: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
            },
          ],
          tags: ['PWA', 'offline-first', 'REP-P', 'SHA-256'],
        },
      },
      {
        n: '02',
        title: 'Connect App',
        meta: PROJECT_DESC,
        video: connectApp,
        webm: connectAppWebm,
        poster: connectAppPoster,
        // Destaque na pagina de projetos (informacoes tiradas do proprio video do produto).
        feature: {
          kicker: 'Em destaque',
          name: 'Connect Valley',
          lead: 'O portal do expositor da Connect Valley 2026: leads, talentos, ranking e agenda do evento em um só app.',
          highlights: [
            {
              title: 'Leads pelo crachá',
              text: 'Bipou o crachá, virou lead: nome, empresa, cargo e LinkedIn salvos no painel do expositor.',
              icon: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h3v3h-3z M20 14v7 M14 20h3',
            },
            {
              title: 'Banco de talentos',
              text: 'O currículo cai direto na empresa, com perfil DISC e análise por IA.',
              icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M19 8v6 M22 11h-6',
            },
            {
              title: 'Ranking dos estandes',
              text: 'Estrelas e check-ins definem a posição; os líderes concorrem a um prêmio especial.',
              icon: 'M8 21h8 M12 17v4 M7 4h10v5a5 5 0 0 1-10 0z M17 5h3v2a3 3 0 0 1-3 3 M7 5H4v2a3 3 0 0 0 3 3',
            },
            {
              title: 'Agenda no bolso',
              text: 'A programação inteira: dois dias, dois palcos, com empresas expositoras no palco.',
              icon: 'M3 5h18v16H3z M16 3v4 M8 3v4 M3 10h18',
            },
          ],
          tags: ['leads', 'IA', 'gamificação', 'eventos'],
        },
      },
      {
        n: '03',
        title: 'Robôs de automação jurídica',
        meta: 'Escritório de advocacia · 2026 · seis robôs em Python, Selenium e WhatsApp.',
        video: null,
        // Destaque na pagina de projetos: o que cada robo faz (informacoes tiradas do projeto dos robos).
        // Sem os apelidos internos de personagens: cada robo e apresentado pela funcao.
        bots: {
          kicker: 'Em destaque',
          name: 'Robôs de automação',
          lead: 'Seis robôs que assumem o trabalho repetitivo de um escritório de advocacia. Cada um tem uma função e cuida dela sozinho, do sistema jurídico ao WhatsApp.',
          // Motion de exemplo (robo de intimacoes do login a tarefa pronta), mostrado acima dos cartoes dos robos.
          // Renderizado do motion em codigo em ~/Documentos/motion-desing/motion-bots/.
          demo: {
            n: '03',
            title: 'Robô de intimações em ação',
            video: botsSam,
            webm: botsSamWebm,
            poster: botsSamPoster,
            feature: {
              kicker: 'Em ação',
              name: 'Da intimação à tarefa',
              lead: 'Um exemplo do robô de intimações trabalhando do começo ao fim: entra no sistema jurídico, captura as intimações do dia e a IA transforma cada uma em tarefa com prazo e responsável.',
              highlights: [
                {
                  title: 'Entra no sistema',
                  text: 'Faz o login sozinho no sistema jurídico do escritório, campo por campo.',
                  icon: 'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
                },
                {
                  title: 'Captura as intimações',
                  text: 'Abre o menu de intimações e coleta as publicações do dia em uma varredura.',
                  icon: 'M6 3h9l4 4v14H6z M14 3v5h5 M9 13h7 M9 17h5',
                },
                {
                  title: 'IA lê e cria as tarefas',
                  text: 'Lê cada documento, preenche tarefa, prazo e responsável e lança tudo no sistema.',
                  icon: 'M4 12l5 5L20 6',
                },
              ],
              tags: ['login', 'intimações', 'IA', 'tarefas'],
            },
          },
          list: [
            {
              name: 'Intimações',
              role: 'Lê as intimações do dia, analisa com IA e cria as tarefas com prazo no sistema jurídico.',
              does: [
                'Captura as intimações de ontem; na segunda, o fim de semana inteiro.',
                'A IA classifica o ato e escolhe a tarefa só da lista oficial do escritório.',
                'Prazo fatal, D-2, embargos e recurso calculados em código, com feriados e recesso.',
                'Lança tudo em um clique, com travas contra duplicata e conferência humana.',
              ],
              stack: ['Selenium', 'IA', 'prazos'],
            },
            {
              name: 'Comprovantes',
              role: 'Confere os comprovantes do setor previdenciário e atualiza as tarefas no fechamento do mês.',
              does: [
                'Filtra no calendário só as tarefas previdenciárias.',
                'Lê os dados de cada comprovante e preenche a tarefa certa.',
                'Modo ensaio: preenche a tela inteira sem gravar nada.',
                'Grava só nos 3 últimos dias do mês, e só depois de confirmar.',
              ],
              stack: ['Selenium', 'previdenciário'],
            },
            {
              name: 'Pesquisa CPF/CNPJ',
              role: 'Recebe uma lista de pessoas por empresa e faz as pesquisas de processos no portal de consulta.',
              does: [
                'Valida cada CPF e CNPJ antes de pagar a pesquisa: dígito verificador e repetidos.',
                'Um pedido por pessoa; se a sessão cair, entra de novo e continua de onde parou.',
                'Baixa o PDF e a planilha de resultados de cada pessoa.',
                'Fecha com um relatório dos processos por empresa, em HTML, PDF e CSV.',
              ],
              stack: ['Selenium', 'PDF', 'CSV'],
            },
            {
              name: 'Relatório mensal',
              role: 'Monta todo mês uma planilha por grupo de clientes, com o raio-x de cada processo.',
              does: [
                'Abre cada processo do grupo: dados, partes e tarefas.',
                'A IA resume o caso, a parte financeira e os documentos que faltam.',
                'Uma planilha .xlsx por grupo, com resumo e cadastros incompletos.',
                'Usuário próprio, só de leitura: não altera nada no sistema.',
              ],
              stack: ['IA', 'xlsx', 'só leitura'],
            },
            {
              name: 'Relatório do dia',
              role: 'Todo dia de manhã, entrega o que a equipe precisa olhar, sem tocar em nada.',
              does: [
                'Só lê: bloqueia qualquer envio antes do login e para se o bloqueio cair.',
                'Agenda de hoje e amanhã, prazos atrasados e intimações esquecidas.',
                'Lista os processos parados e confere as pesquisas feitas no mês.',
                'Painel semanal em PDF: taxa de resolução e carga de cada advogado.',
              ],
              stack: ['só leitura', 'PDF', 'agendado'],
            },
            {
              name: 'WhatsApp previdenciário',
              role: 'Atende os clientes do setor previdenciário no WhatsApp, de dia e fora do expediente.',
              does: [
                'Responde documentos, perícia, prazos, RPV, Meu INSS e golpes com textos aprovados pelo setor.',
                'Sem IA: menu numerado e palavras-chave, nenhuma resposta inventada.',
                'O que é do caso da pessoa vai direto para a equipe.',
                'Consulta a fase do processo sem que CPF, nome ou número saiam do escritório.',
              ],
              stack: ['WhatsApp', 'Node', 'privacidade'],
            },
          ],
          tags: ['Python', 'Selenium', 'IA', 'WhatsApp'],
        },
      },
    ],
  },
  {
    id: 'motion',
    index: '02',
    label: 'Motion Design, Carrossel para Instagram e Edição de Vídeo',
    light: false,
    agents: [2, 3],
    title: 'Vídeo que segura o dedo antes do próximo swipe.',
    text: 'Carrosséis animados para o Instagram, vídeos institucionais e edição. A gente escreve o roteiro, anima, compõe a trilha e entrega pronto para postar.',
    tags: ['motion design', 'carrossel', 'edição', 'redes sociais', 'institucional'],
    cards: [
      {
        title: 'Vídeos institucionais',
        text: 'Sua empresa contada em segundos, com cada corte no tempo da música.',
        icon: 'M3 3h18v18H3z M7 3v18 M17 3v18 M3 8h4 M3 16h4 M17 8h4 M17 16h4',
      },
      {
        title: 'Animação de logo',
        text: 'Sua logo ganhando vida na abertura e no fechamento de cada vídeo.',
        icon: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z',
      },
      {
        title: 'Carrosséis para Instagram',
        text: 'Carrosséis animados que prendem o swipe do primeiro ao último slide.',
        icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M10 8l6 4-6 4z',
      },
      {
        title: 'Explainers animados',
        text: 'O produto difícil de explicar, mostrado numa animação que qualquer pessoa entende.',
        icon: 'M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z',
      },
      {
        title: 'Edição e cor',
        text: 'Corte, ritmo, correção de cor e acabamento.',
        icon: 'M6 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M20 4 8.12 15.88 M14.47 14.48 20 20 M8.12 8.12 12 12',
      },
      {
        title: 'Legendas e trilha',
        text: 'Legendas animadas para quem assiste sem som, trilha e efeitos.',
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
        // Destaque na pagina de projetos (informacoes tiradas do proprio projeto em video-institucional/).
        feature: {
          kicker: 'Em destaque',
          name: 'Prisma em 20 segundos',
          lead: 'O vídeo institucional da Prisma: produto, automação, apps e integração contados em sete batidas, com trilha própria.',
          highlights: [
            {
              title: 'Sete batidas a 120 BPM',
              text: 'Gancho, produto, automação, aplicativos, integração, prova e assinatura, cada corte no tempo da música.',
              icon: 'M9 18V5l12-2v13 M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
            },
            {
              title: 'Trilha original',
              text: 'Música sintetizada do zero, com os sons de interface caindo exatamente nos cliques da tela.',
              icon: 'M2 12h2 M6 8v8 M10 4v16 M14 7v10 M18 10v4 M22 12h-2',
            },
            {
              title: '16:9 e 9:16',
              text: 'Um único roteiro gera as duas versões: horizontal para site e YouTube, vertical para Reels e Stories.',
              icon: 'M2 6h14v10H2z M18 4h4v16h-4z',
            },
            {
              title: 'Motion em código',
              text: 'Cada quadro renderizado por código, sem After Effects: ajustar texto ou cor é refazer o render.',
              icon: 'M16 18l6-6-6-6 M8 6l-6 6 6 6',
            },
          ],
          tags: ['institucional', '20 s', 'trilha própria', 'reels'],
        },
      },
      {
        n: '02',
        title: 'Carrossel animado Prisma',
        meta: 'Prisma Technologies · 2026 · carrossel de 6 slides para o Instagram, motion em código.',
        video: carrossel,
        webm: carrosselWebm,
        poster: carrosselPoster,
        carousel: { slides: carrosselSlides, ratio: 4 / 5 },
        // Destaque na pagina de projetos (informacoes tiradas de CARROSSEL-PRISMA/).
        feature: {
          kicker: 'Em destaque',
          name: 'Carrossel Prisma',
          lead: 'Seis slides animados para o Instagram, do gancho ao preço, feitos para serem vistos inteiros duas vezes.',
          highlights: [
            {
              title: 'Um slide puxa o outro',
              text: 'Os robôs saem pela borda de um slide e entram no próximo: o swipe vira parte da animação.',
              icon: 'M5 12h14 M13 6l6 6-6 6',
            },
            {
              title: 'Loop sem emenda',
              text: 'Cada slide tem 8 s a 120 BPM e volta ao início sem corte, na imagem e no som.',
              icon: 'M17 2l4 4-4 4 M3 11V9a4 4 0 0 1 4-4h14 M7 22l-4-4 4-4 M21 13v2a4 4 0 0 1-4 4H3',
            },
            {
              title: 'Logo que se desmonta',
              text: 'O prisma da Prisma se quebra nas costuras entre os slides e se monta de novo no seguinte.',
              icon: 'M12 2l9 16H3z M12 2v16 M7.5 10h9',
            },
            {
              title: 'Pronto para postar',
              text: '1080 × 1350 (4:5), um MP4 por slide, com som sintetizado próprio.',
              icon: 'M3 3h18v18H3z M3 9h18 M9 21V9',
            },
          ],
          tags: ['instagram', '4:5', '6 slides', 'loop'],
        },
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
    title: 'Páginas que levam o visitante do anúncio até o botão de compra.',
    text: 'Para lançamento, produto ou oferta. Cada bloco responde uma dúvida de quem está quase comprando, e o botão aparece na hora certa.',
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

// Pagina /projetos: extensao das secoes de servico, com a tipografia do carrossel.
export const projectsPage = {
  kicker: 'Portfólio · Prisma Technologies',
  title: ['O que já está ', 'rodando.'],
  text: 'Sistemas, robôs, vídeos e carrosséis feitos do zero para cada cliente. Toque em um projeto para ver de perto.',
  jump: [
    { href: '#software', index: '01', label: 'Software' },
    { href: '#motion', index: '02', label: 'Motion, carrossel e vídeo' },
    { href: '#landing', index: '03', label: 'Landing pages' },
  ],
};
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
  title: ['Qual tarefa você quer', 'nunca mais fazer?'],
  text: 'Conte como ela é feita hoje, ou mande a ideia do vídeo ou da página. A gente responde com por onde começar e quanto custa.',
  email: 'contato@prisma.tech',
  ctas: [
    { variant: 'primary', label: 'Pedir orçamento', href: 'mailto:contato@prisma.tech' },
    { variant: 'ghost', label: 'Chamar no WhatsApp', href: '#' },
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
  cta: 'Pedir orçamento',
  close: 'Fechar',
  open: 'Menu',
};

export const footer = {
  copyright: '© 2026 Prisma Technologies',
  slogan: 'Diferentes perspectivas. Soluções inteligentes.',
};

export const fab = { label: 'Pedir orçamento', href: '#contato' };

export const brand = { name: 'PRISMA', sub: 'TECHNOLOGIES' };
