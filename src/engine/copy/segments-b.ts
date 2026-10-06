import type { SegmentCopy } from './types';

export const lojaAutomotiva: SegmentCopy = {
  segment: 'loja-automotiva',
  themes: ['automotive', 'ecommerce', 'high-contrast'],
  layouts: ['catalog', 'trust', 'impact'],
  placeholderStyle: 'diagonal',
  hero: {
    eyebrow: ['Peças e acessórios em {cidade}', 'Autopeças · Acessórios · Som', 'Tudo para o seu carro'],
    headline: [
      'Tudo para o seu carro em *um só lugar*.',
      'Peças certas, preço justo, *entrega rápida*.',
      'Acessórios e peças para quem *ama* carro.',
    ],
    sub: [
      'A {empresa} tem peças originais e paralelas, acessórios, pneus e som automotivo com atendimento especializado em {cidade}. Peça pelo WhatsApp e retire ou receba em casa.',
      'Estoque amplo, marcas de confiança e uma equipe que entende de carro. Fale com a {empresa} e encontre a peça certa na primeira tentativa.',
    ],
    badges: ['Peças originais e paralelas', 'Entrega em {cidade}', 'Instalação disponível'],
  },
  cta: { primary: ['Pedir pelo WhatsApp', 'Consultar peça'], secondary: ['Ver catálogo', 'Nossas marcas'] },
  manifesto: [
    'Peça errada custa tempo e dinheiro. A gente garante a *certa*.',
    'Atendimento de quem conhece cada modelo e cada *detalhe*.',
  ],
  about: {
    eyebrow: 'Sobre a {empresa}',
    title: ['Loja automotiva com *estoque* e atendimento.', 'Referência em peças em {cidade}.'],
    paragraphs: [
      [
        'A {empresa} é uma loja de peças e acessórios automotivos em {cidade}, com estoque amplo para carros nacionais e importados.',
        'Nosso time consulta a peça pelo chassi ou placa para garantir compatibilidade e entrega rápida, com instalação em parceiros ou na própria loja.',
      ],
      [
        'Há {anos} anos atendendo mecânicos, oficinas e motoristas de {cidade}, a {empresa} virou sinônimo de peça certa e preço competitivo.',
        'Trabalhamos com as principais marcas do mercado e oferecemos garantia em todos os produtos.',
      ],
    ],
    highlights: [
      { title: 'Consulta por placa', text: 'Compatibilidade garantida.' },
      { title: 'Entrega rápida', text: 'Para oficinas e clientes finais.' },
      { title: 'Garantia', text: 'Em todas as peças.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Categorias',
    title: ['O que você *encontra* aqui'],
    intro: ['Peças de reposição, acessórios e muito mais.'],
  },
  services: [
    {
      title: 'Peças de reposição',
      description: 'Motor, suspensão, freios, elétrica e filtros para todas as marcas.',
      icon: 'cog',
    },
    {
      title: 'Acessórios',
      description: 'Tapetes, capas, sensores, câmeras de ré e multimídia.',
      icon: 'package',
    },
    { title: 'Som automotivo', description: 'Alto-falantes, módulos, subwoofers e instalação.', icon: 'zap' },
    { title: 'Pneus e rodas', description: 'Marcas líderes com montagem e balanceamento.', icon: 'car' },
    {
      title: 'Óleos e fluidos',
      description: 'Lubrificantes, aditivos e produtos de manutenção.',
      icon: 'droplet',
    },
    {
      title: 'Atendimento a oficinas',
      description: 'Condições especiais e entrega para profissionais.',
      icon: 'truck',
    },
  ],
  benefitsHead: {
    eyebrow: 'Vantagens',
    title: ['Por que comprar na *{empresa}*'],
    intro: ['Mais do que uma loja de peças.'],
  },
  benefits: [
    {
      title: 'Peça certa de primeira',
      description: 'Consulta técnica por placa ou chassi antes de vender.',
      icon: 'check-circle',
    },
    {
      title: 'Preço competitivo',
      description: 'Marcas de qualidade com preço de loja especializada.',
      icon: 'tag',
    },
    {
      title: 'Entrega e retirada',
      description: 'Retire na loja ou receba em {cidade} no mesmo dia.',
      icon: 'truck',
    },
    {
      title: 'Instalação',
      description: 'Indicamos ou realizamos a instalação dos produtos.',
      icon: 'wrench',
    },
  ],
  processHead: { eyebrow: 'Como comprar', title: ['Em três *passos*'], intro: ['Rápido como tem que ser.'] },
  steps: [
    { title: 'Mande a placa ou modelo', description: 'Pelo WhatsApp, com a descrição da peça.' },
    { title: 'Receba o orçamento', description: 'Com opções de marca e prazo de entrega.' },
    { title: 'Retire ou receba', description: 'Na loja ou com entrega em {cidade}.' },
  ],
  faqs: [
    {
      question: 'Vocês trabalham com peças originais?',
      answer: 'Sim, originais e também opções paralelas de primeira linha, sempre com garantia.',
    },
    {
      question: 'Fazem entrega?',
      answer: 'Sim, entregamos em {cidade} e enviamos para outras cidades via transportadora.',
    },
    {
      question: 'Como sei se a peça serve no meu carro?',
      answer: 'Mande a placa ou o chassi pelo WhatsApp e nossa equipe confirma a compatibilidade.',
    },
    {
      question: 'Vocês instalam?',
      answer: 'Alguns produtos instalamos na loja; para os demais indicamos oficinas parceiras.',
    },
    {
      question: 'Qual a garantia?',
      answer: 'Todas as peças têm garantia do fabricante, com prazo informado na nota.',
    },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos no mercado' },
    { value: '20', suffix: 'mil', label: 'itens em estoque' },
    { value: '50', suffix: '+', label: 'marcas' },
    { value: '24', suffix: 'h', label: 'entrega em {cidade}' },
  ],
  testimonialsHead: { eyebrow: 'Clientes', title: ['Quem compra *recomenda*'] },
  testimonials: [
    {
      quote: 'Mandei a placa, em 5 minutos tinha o orçamento e no mesmo dia a peça estava na oficina.',
      author: 'Mecânico parceiro',
      rating: 5,
    },
    {
      quote: 'Preço melhor que internet e com atendimento de verdade.',
      author: 'Cliente',
      role: '{cidade}',
      rating: 5,
    },
    {
      quote: 'Instalaram o som e a câmera de ré no mesmo dia. Ficou perfeito.',
      author: 'Cliente',
      role: 'Acessórios',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Destaques',
    title: ['Produtos em *destaque*'],
    intro: ['Mais procurados da semana.'],
  },
  projects: [
    { title: 'Kit de freios', category: 'Freios', description: 'Pastilhas e discos de primeira linha.' },
    { title: 'Multimídia com câmera', category: 'Acessórios', description: 'Tela touch com espelhamento.' },
    { title: 'Amortecedores', category: 'Suspensão', description: 'Par dianteiro ou traseiro.' },
    { title: 'Pneus', category: 'Pneus', description: 'Marcas líderes com montagem.' },
  ],
  finalCta: {
    eyebrow: 'Fale com a gente',
    title: ['Precisa de uma *peça*? Resolvemos agora.'],
    text: ['Mande a placa e a peça pelo WhatsApp e receba o orçamento em minutos.'],
  },
  contactIntro: ['Orçamentos e consultas de peças pelo WhatsApp.'],
  marquee: ['Peças', 'Acessórios', 'Som', 'Pneus', 'Óleos', 'Entrega'],
  keywords: [
    'autopeças {cidade}',
    'loja de peças automotivas',
    'acessórios para carro',
    'som automotivo',
    'pneus',
  ],
  whatsappMessage: 'Olá! Gostaria de consultar uma peça na {empresa}.',
  seoDescription: [
    '{empresa}: autopeças e acessórios em {cidade}. Peças originais e paralelas, som automotivo, pneus e entrega rápida.',
  ],
};

export const concessionaria: SegmentCopy = {
  segment: 'concessionaria',
  themes: ['automotive', 'luxury-dark', 'minimal-light'],
  layouts: ['showcase', 'catalog', 'impact'],
  placeholderStyle: 'diagonal',
  hero: {
    eyebrow: [
      'Veículos novos e seminovos em {cidade}',
      'Compra · Venda · Financiamento',
      'O carro certo está aqui',
    ],
    headline: [
      'Seu próximo carro está a uma *conversa* de distância.',
      'Seminovos revisados com *procedência* garantida.',
      'Compre com segurança. Dirija com *orgulho*.',
    ],
    sub: [
      'A {empresa} oferece veículos novos e seminovos revisados, com laudo, garantia e financiamento aprovado rápido. Visite nossa loja em {cidade} ou fale pelo WhatsApp.',
      'Estoque selecionado, avaliação justa do seu usado e as melhores condições de financiamento. Esse é o atendimento {empresa}.',
    ],
    badges: ['Laudo cautelar', 'Garantia', 'Financiamento em até 60x'],
  },
  cta: {
    primary: ['Ver estoque', 'Falar com vendedor'],
    secondary: ['Avaliar meu usado', 'Simular financiamento'],
  },
  manifesto: [
    'Carro bom é o que você compra sabendo *tudo* sobre ele.',
    'Procedência, revisão e garantia. O resto é *conversa de vendedor*.',
  ],
  about: {
    eyebrow: 'Sobre a {empresa}',
    title: ['Confiança em cada *negociação*.', 'Veículos selecionados em {cidade}.'],
    paragraphs: [
      [
        'A {empresa} é uma loja de veículos em {cidade} com estoque de novos e seminovos revisados, laudo cautelar e garantia.',
        'Cada carro passa por inspeção mecânica e documental antes de entrar no pátio. Você compra com histórico completo e sem surpresa.',
      ],
      [
        'Há {anos} anos a {empresa} entrega carros em {cidade} com um compromisso simples: transparência total. Avaliamos seu usado com justiça e aprovamos o financiamento rápido.',
        'Nossa equipe acompanha você da escolha à entrega das chaves, com pós-venda de verdade.',
      ],
    ],
    highlights: [
      { title: 'Laudo cautelar', text: 'Em todos os seminovos.' },
      { title: 'Garantia', text: 'Motor e câmbio.' },
      { title: 'Financiamento', text: 'Aprovação em poucas horas.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Serviços',
    title: ['Tudo para *comprar* e *vender*'],
    intro: ['Mais do que uma loja de carros.'],
  },
  services: [
    {
      title: 'Seminovos revisados',
      description: 'Veículos com inspeção completa, laudo e garantia.',
      icon: 'car',
    },
    { title: 'Carros novos', description: 'Modelos zero km com condições especiais.', icon: 'star' },
    {
      title: 'Financiamento',
      description: 'Parceria com os principais bancos e aprovação rápida.',
      icon: 'file-text',
    },
    {
      title: 'Avaliação do usado',
      description: 'Pegamos seu carro na troca com avaliação justa.',
      icon: 'handshake',
    },
    { title: 'Consignação', description: 'Vendemos seu carro com segurança e divulgação.', icon: 'tag' },
    { title: 'Pós-venda', description: 'Suporte, revisões e garantia após a compra.', icon: 'shield' },
  ],
  benefitsHead: {
    eyebrow: 'Vantagens',
    title: ['Por que comprar na *{empresa}*'],
    intro: ['O que garante sua tranquilidade.'],
  },
  benefits: [
    {
      title: 'Procedência verificada',
      description: 'Histórico, documentação e laudo cautelar.',
      icon: 'shield',
    },
    { title: 'Revisão completa', description: 'Mecânica e estética antes da entrega.', icon: 'check-circle' },
    {
      title: 'Financiamento facilitado',
      description: 'Melhores taxas e entrada facilitada.',
      icon: 'trending-up',
    },
    {
      title: 'Atendimento consultivo',
      description: 'Ajudamos a escolher o carro certo para você.',
      icon: 'users',
    },
  ],
  processHead: { eyebrow: 'Como funciona', title: ['Da escolha às *chaves*'], intro: ['Sem burocracia.'] },
  steps: [
    { title: 'Escolha', description: 'Veja o estoque online ou visite a loja.' },
    { title: 'Test drive', description: 'Dirija antes de decidir.' },
    { title: 'Aprovação', description: 'Financiamento aprovado em poucas horas.' },
    { title: 'Entrega', description: 'Carro revisado, documentado e pronto.' },
  ],
  faqs: [
    {
      question: 'Os seminovos têm garantia?',
      answer: 'Sim, todos os seminovos saem com garantia de motor e câmbio e laudo cautelar aprovado.',
    },
    {
      question: 'Aceitam meu carro na troca?',
      answer: 'Sim. Avaliamos seu usado na hora e usamos como entrada.',
    },
    {
      question: 'Como funciona o financiamento?',
      answer: 'Trabalhamos com vários bancos. Com seus documentos, a aprovação sai em poucas horas.',
    },
    {
      question: 'Posso fazer test drive?',
      answer: 'Claro. Agende pelo WhatsApp e o carro estará pronto para você dirigir.',
    },
    {
      question: 'Vendem para outras cidades?',
      answer: 'Sim, com envio via cegonha ou retirada na loja em {cidade}.',
    },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de loja' },
    { value: '3', suffix: 'mil', label: 'carros entregues' },
    { value: '100', suffix: '%', label: 'com laudo' },
    { value: '4.9', suffix: '★', label: 'avaliação' },
  ],
  testimonialsHead: { eyebrow: 'Clientes', title: ['Quem já *saiu de carro novo*'] },
  testimonials: [
    {
      quote: 'Comprei meu seminovo com laudo e garantia. Um ano depois, zero problema.',
      author: 'Cliente',
      role: 'Seminovo',
      rating: 5,
    },
    {
      quote:
        'Avaliaram meu usado acima do que outras lojas ofereceram e aprovaram o financiamento no mesmo dia.',
      author: 'Cliente',
      role: 'Troca',
      rating: 5,
    },
    {
      quote: 'Atendimento sem pressão. Me ajudaram a escolher o carro certo para a família.',
      author: 'Cliente',
      role: '{cidade}',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Estoque',
    title: ['Destaques do *pátio*'],
    intro: ['Alguns veículos disponíveis agora.'],
  },
  projects: [
    { title: 'SUV seminovo', category: 'SUV', description: 'Único dono, revisado, com garantia.' },
    { title: 'Hatch econômico', category: 'Hatch', description: 'Baixa quilometragem.' },
    { title: 'Sedan executivo', category: 'Sedan', description: 'Completo, com laudo aprovado.' },
    { title: 'Picape', category: 'Picape', description: 'Pronta para o trabalho.' },
  ],
  finalCta: {
    eyebrow: 'Vamos negociar?',
    title: ['Seu próximo carro *começa aqui*'],
    text: ['Fale com um consultor pelo WhatsApp e receba as opções do estoque.'],
  },
  contactIntro: ['Vendas, avaliações e financiamento pelo WhatsApp.'],
  marquee: ['Seminovos', 'Novos', 'Financiamento', 'Troca', 'Garantia'],
  keywords: [
    'concessionária {cidade}',
    'seminovos',
    'carros usados',
    'financiamento de veículos',
    'loja de carros',
  ],
  whatsappMessage: 'Olá! Vi o site da {empresa} e gostaria de informações sobre o estoque.',
  seoDescription: [
    '{empresa}: veículos novos e seminovos revisados em {cidade}. Laudo, garantia e financiamento facilitado.',
  ],
};

export const clinica: SegmentCopy = {
  segment: 'clinica',
  themes: ['medical-clean', 'minimal-light', 'editorial'],
  layouts: ['trust', 'local', 'editorial'],
  placeholderStyle: 'rings',
  hero: {
    eyebrow: ['Clínica em {cidade}', 'Cuidado que você sente', 'Agende sua consulta'],
    headline: [
      'Cuidar da sua saúde com *atenção* e tecnologia.',
      'Atendimento humano, estrutura *completa*.',
      'Sua saúde em boas *mãos*.',
    ],
    sub: [
      'A {empresa} reúne especialidades, exames e uma equipe dedicada em {cidade}. Agende sua consulta pelo WhatsApp em poucos minutos.',
      'Consultas com hora marcada, ambiente acolhedor e profissionais experientes. Na {empresa}, você é atendido com o tempo que merece.',
    ],
    badges: ['Hora marcada', 'Convênios e particular', 'Estacionamento'],
  },
  cta: { primary: ['Agendar consulta', 'Falar no WhatsApp'], secondary: ['Ver especialidades', 'Convênios'] },
  manifesto: [
    'Medicina boa começa com *escuta*. Depois vem a tecnologia.',
    'Tratamos pessoas, não só *sintomas*.',
  ],
  about: {
    eyebrow: 'A clínica',
    title: ['Estrutura completa, atendimento *humano*.', 'Saúde com proximidade em {cidade}.'],
    paragraphs: [
      [
        'A {empresa} é uma clínica em {cidade} que reúne diversas especialidades em um só lugar, com agendamento fácil e atendimento pontual.',
        'Nossa equipe é formada por profissionais experientes, apoiados por equipamentos modernos e um ambiente pensado para o seu conforto.',
      ],
      [
        'Há {anos} anos cuidando de famílias em {cidade}, a {empresa} acredita que saúde se constrói com acompanhamento próximo e prevenção.',
        'Atendemos particular e convênios, com retorno garantido e comunicação direta com a equipe.',
      ],
    ],
    highlights: [
      { title: 'Várias especialidades', text: 'Tudo em um só lugar.' },
      { title: 'Hora marcada', text: 'Sem esperar horas na recepção.' },
      { title: 'Convênios', text: 'Consulte os aceitos.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Especialidades',
    title: ['Cuidado *completo* para você e sua família'],
    intro: ['Consultas, exames e acompanhamento.'],
  },
  services: [
    {
      title: 'Clínica geral',
      description: 'Consultas de rotina, check-up e acompanhamento preventivo.',
      icon: 'stethoscope',
    },
    {
      title: 'Pediatria',
      description: 'Atendimento acolhedor para crianças de todas as idades.',
      icon: 'heart',
    },
    { title: 'Ginecologia', description: 'Saúde da mulher em todas as fases da vida.', icon: 'users' },
    {
      title: 'Cardiologia',
      description: 'Prevenção, diagnóstico e acompanhamento cardiológico.',
      icon: 'activity',
    },
    { title: 'Exames', description: 'Laboratoriais e de imagem com resultado rápido.', icon: 'file-text' },
    {
      title: 'Nutrição e bem-estar',
      description: 'Planos alimentares e acompanhamento personalizado.',
      icon: 'leaf',
    },
  ],
  benefitsHead: {
    eyebrow: 'Por que a {empresa}',
    title: ['O que torna o atendimento *diferente*'],
    intro: ['Pequenos detalhes que fazem grande diferença.'],
  },
  benefits: [
    {
      title: 'Agendamento fácil',
      description: 'Marque pelo WhatsApp e receba lembrete da consulta.',
      icon: 'calendar',
    },
    { title: 'Pontualidade', description: 'Respeitamos o seu horário.', icon: 'clock' },
    {
      title: 'Equipe qualificada',
      description: 'Profissionais com formação e experiência comprovadas.',
      icon: 'award',
    },
    { title: 'Ambiente acolhedor', description: 'Recepção confortável e acessível.', icon: 'smile' },
  ],
  processHead: {
    eyebrow: 'Como agendar',
    title: ['Sua consulta em *3 passos*'],
    intro: ['Rápido e sem burocracia.'],
  },
  steps: [
    { title: 'Chame no WhatsApp', description: 'Informe a especialidade e o melhor horário.' },
    { title: 'Confirmação', description: 'Enviamos a confirmação e as orientações.' },
    { title: 'Consulta', description: 'Chegue e seja atendido na hora marcada.' },
  ],
  faqs: [
    {
      question: 'Quais convênios são aceitos?',
      answer: 'Atendemos diversos convênios e também particular. Consulte a lista atualizada pelo WhatsApp.',
    },
    {
      question: 'Como agendo uma consulta?',
      answer: 'Pelo WhatsApp, telefone ou formulário do site. Respondemos em horário comercial.',
    },
    {
      question: 'Preciso de encaminhamento?',
      answer: 'Para consultas particulares não. Para convênios, depende das regras do seu plano.',
    },
    {
      question: 'Fazem exames na clínica?',
      answer: 'Sim, realizamos exames laboratoriais e de imagem. Consulte a disponibilidade.',
    },
    { question: 'Têm estacionamento?', answer: 'Sim, com vagas para pacientes e acessibilidade.' },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de atendimento' },
    { value: '12', suffix: '', label: 'especialidades' },
    { value: '30', suffix: 'mil', label: 'pacientes atendidos' },
    { value: '4.9', suffix: '★', label: 'avaliação' },
  ],
  testimonialsHead: { eyebrow: 'Pacientes', title: ['Quem já se *cuidou* com a gente'] },
  testimonials: [
    {
      quote: 'Atendimento pontual e médica atenciosa. Me senti ouvida.',
      author: 'Paciente',
      role: 'Clínica geral',
      rating: 5,
    },
    {
      quote: 'Levo meus filhos há anos. A pediatra é maravilhosa.',
      author: 'Paciente',
      role: 'Pediatria',
      rating: 5,
    },
    {
      quote: 'Marquei pelo WhatsApp e fui atendido no mesmo dia.',
      author: 'Paciente',
      role: '{cidade}',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Estrutura',
    title: ['Conheça a *clínica*'],
    intro: ['Ambientes pensados para o seu conforto.'],
  },
  projects: [
    { title: 'Recepção', category: 'Espaço', description: 'Confortável e acessível.' },
    { title: 'Consultórios', category: 'Espaço', description: 'Equipados e climatizados.' },
    { title: 'Sala de exames', category: 'Exames', description: 'Equipamentos modernos.' },
    { title: 'Espaço infantil', category: 'Pediatria', description: 'Para as crianças esperarem brincando.' },
  ],
  finalCta: {
    eyebrow: 'Agende',
    title: ['Cuide da sua saúde *hoje*'],
    text: ['Agende sua consulta pelo WhatsApp em poucos minutos.'],
  },
  contactIntro: ['Agendamentos pelo WhatsApp, telefone ou formulário.'],
  marquee: ['Consultas', 'Exames', 'Pediatria', 'Cardiologia', 'Ginecologia', 'Check-up'],
  keywords: ['clínica {cidade}', 'clínica médica', 'agendar consulta', 'exames', 'especialidades médicas'],
  whatsappMessage: 'Olá! Gostaria de agendar uma consulta na {empresa}.',
  seoDescription: [
    '{empresa}: clínica em {cidade} com várias especialidades, exames e agendamento pelo WhatsApp.',
  ],
};

export const medico: SegmentCopy = {
  segment: 'medico',
  themes: ['medical-clean', 'editorial', 'minimal-light'],
  layouts: ['trust', 'editorial', 'local'],
  placeholderStyle: 'rings',
  hero: {
    eyebrow: ['Consultório em {cidade}', 'Atendimento com hora marcada', 'Medicina com escuta'],
    headline: [
      'Atendimento médico com *tempo* para você.',
      'Cuidado individual, do diagnóstico ao *acompanhamento*.',
      'Sua saúde com *atenção* de verdade.',
    ],
    sub: [
      'Consultas com hora marcada, avaliação completa e um plano de cuidado claro. Agende com {empresa} em {cidade} pelo WhatsApp.',
      'Na {empresa}, cada consulta tem o tempo necessário para ouvir, examinar e explicar. Sem pressa, sem fila.',
    ],
    badges: ['Hora marcada', 'Particular e convênios', 'Telemedicina'],
  },
  cta: {
    primary: ['Agendar consulta', 'Falar no WhatsApp'],
    secondary: ['Sobre o atendimento', 'Convênios'],
  },
  manifesto: [
    'Diagnóstico certo começa com uma consulta sem *pressa*.',
    'Explicar com clareza faz parte do *tratamento*.',
  ],
  about: {
    eyebrow: 'Sobre',
    title: ['Formação sólida, atendimento *próximo*.', 'Quem cuida de você.'],
    paragraphs: [
      [
        '{empresa} atende em consultório próprio em {cidade}, com foco em avaliação completa, prevenção e acompanhamento contínuo.',
        'Com formação e atualização constantes, o atendimento combina evidência científica e atenção individual a cada paciente.',
      ],
      [
        'Há {anos} anos atendendo em {cidade}, {empresa} construiu uma relação de confiança com pacientes e famílias que voltam a cada etapa da vida.',
        'O consultório oferece consultas presenciais e por telemedicina, com retorno garantido e comunicação direta.',
      ],
    ],
    highlights: [
      { title: 'Consulta completa', text: 'Tempo para ouvir e examinar.' },
      { title: 'Retorno incluso', text: 'Acompanhamento após a consulta.' },
      { title: 'Telemedicina', text: 'Quando fizer sentido.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Atendimento',
    title: ['Como posso *ajudar*'],
    intro: ['Consultas, acompanhamento e orientação.'],
  },
  services: [
    {
      title: 'Consulta presencial',
      description: 'Avaliação clínica completa com hora marcada.',
      icon: 'stethoscope',
    },
    { title: 'Telemedicina', description: 'Consultas online para retorno e orientação.', icon: 'globe' },
    {
      title: 'Check-up preventivo',
      description: 'Avaliação periódica e solicitação de exames.',
      icon: 'activity',
    },
    {
      title: 'Acompanhamento',
      description: 'Plano de cuidado contínuo para condições crônicas.',
      icon: 'heart',
    },
    { title: 'Laudos e atestados', description: 'Emissão de documentos após avaliação.', icon: 'file-text' },
    { title: 'Orientação familiar', description: 'Atendimento para todas as idades.', icon: 'users' },
  ],
  benefitsHead: {
    eyebrow: 'Diferenciais',
    title: ['Por que escolher este *consultório*'],
    intro: ['O que faz diferença na sua consulta.'],
  },
  benefits: [
    {
      title: 'Tempo de consulta',
      description: 'Consultas sem pressa para uma avaliação completa.',
      icon: 'clock',
    },
    {
      title: 'Explicações claras',
      description: 'Você entende o diagnóstico e o tratamento.',
      icon: 'message-circle',
    },
    {
      title: 'Comunicação direta',
      description: 'Canal de contato para dúvidas após a consulta.',
      icon: 'whatsapp',
    },
    { title: 'Ambiente acolhedor', description: 'Consultório confortável e privativo.', icon: 'smile' },
  ],
  processHead: { eyebrow: 'Agendamento', title: ['Marque em *minutos*'], intro: ['Simples e direto.'] },
  steps: [
    { title: 'Chame no WhatsApp', description: 'Escolha entre presencial ou telemedicina.' },
    { title: 'Confirmação', description: 'Receba a confirmação e as orientações.' },
    { title: 'Consulta', description: 'Atendimento na hora marcada.' },
  ],
  faqs: [
    {
      question: 'Atende convênios?',
      answer:
        'Consulte os convênios aceitos pelo WhatsApp. Também atendemos particular com reembolso quando aplicável.',
    },
    {
      question: 'Faz telemedicina?',
      answer:
        'Sim, para consultas de retorno e orientações. A primeira consulta é preferencialmente presencial.',
    },
    {
      question: 'Qual o tempo de consulta?',
      answer: 'As consultas têm duração adequada para avaliação completa, geralmente entre 30 e 50 minutos.',
    },
    {
      question: 'O retorno está incluso?',
      answer: 'Sim, o retorno para avaliação de exames está incluso dentro do prazo informado na consulta.',
    },
    { question: 'Como cancelar ou remarcar?', answer: 'Pelo WhatsApp, com antecedência mínima de 24 horas.' },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de prática' },
    { value: '10', suffix: 'mil', label: 'consultas realizadas' },
    { value: '40', suffix: 'min', label: 'de consulta em média' },
    { value: '5', suffix: '★', label: 'avaliação' },
  ],
  testimonialsHead: { eyebrow: 'Pacientes', title: ['O que dizem os *pacientes*'] },
  testimonials: [
    {
      quote: 'Primeira vez que um médico me explicou tudo com calma. Saí entendendo meu tratamento.',
      author: 'Paciente',
      rating: 5,
    },
    {
      quote: 'Atendimento humano e pontual. Recomendo para toda a família.',
      author: 'Paciente',
      role: '{cidade}',
      rating: 5,
    },
    {
      quote: 'A telemedicina para retorno facilitou muito a minha rotina.',
      author: 'Paciente',
      role: 'Telemedicina',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Consultório',
    title: ['O *espaço*'],
    intro: ['Ambiente pensado para o seu conforto.'],
  },
  projects: [
    { title: 'Recepção', category: 'Espaço', description: 'Acolhedora e silenciosa.' },
    { title: 'Consultório', category: 'Espaço', description: 'Privativo e climatizado.' },
    { title: 'Sala de exames', category: 'Estrutura', description: 'Para avaliação completa.' },
  ],
  finalCta: {
    eyebrow: 'Agende',
    title: ['Sua consulta com *atenção* de verdade'],
    text: ['Agende pelo WhatsApp e escolha o melhor horário.'],
  },
  contactIntro: ['Agendamentos pelo WhatsApp ou formulário.'],
  marquee: ['Consultas', 'Telemedicina', 'Check-up', 'Acompanhamento'],
  keywords: ['médico {cidade}', 'consultório médico', 'agendar consulta', 'telemedicina', 'check-up'],
  whatsappMessage: 'Olá! Gostaria de agendar uma consulta com {empresa}.',
  seoDescription: [
    '{empresa}: consultório médico em {cidade}. Consultas com hora marcada, telemedicina e acompanhamento próximo.',
  ],
};

export const advogado: SegmentCopy = {
  segment: 'advogado',
  themes: ['editorial', 'luxury-dark', 'architecture'],
  layouts: ['editorial', 'trust', 'impact'],
  placeholderStyle: 'grid',
  hero: {
    eyebrow: ['Advocacia em {cidade}', 'Escritório de advocacia', 'Orientação jurídica clara'],
    headline: [
      'Defesa dos seus direitos com *estratégia* e clareza.',
      'Advocacia que fala a sua *língua*.',
      'Segurança jurídica para decisões *importantes*.',
    ],
    sub: [
      'A {empresa} atende pessoas e empresas em {cidade} com atuação consultiva e contenciosa, comunicação transparente e acompanhamento próximo de cada caso.',
      'Avaliação inicial do seu caso, estratégia definida e atualizações constantes. Na {empresa}, você sabe em que pé está o seu processo.',
    ],
    badges: ['Atendimento com hora marcada', 'Consulta online', 'Sigilo garantido'],
  },
  cta: {
    primary: ['Agendar consulta', 'Falar com advogado'],
    secondary: ['Áreas de atuação', 'Sobre o escritório'],
  },
  manifesto: [
    'Direito bom é o que você *entende*. Explicamos cada passo.',
    'Estratégia, não improviso. Cada caso merece um *plano*.',
  ],
  about: {
    eyebrow: 'O escritório',
    title: ['Atuação técnica, atendimento *próximo*.', 'Tradição e atualização em {cidade}.'],
    paragraphs: [
      [
        'A {empresa} é um escritório de advocacia em {cidade} com atuação em diversas áreas do direito, atendendo pessoas físicas e empresas.',
        'Nosso compromisso é combinar rigor técnico com comunicação simples, para que o cliente participe das decisões com segurança.',
      ],
      [
        'Há {anos} anos atuando em {cidade} e região, a {empresa} construiu reputação com base em resultados e relacionamento de longo prazo.',
        'Atendemos presencialmente e online, com sigilo absoluto e atualizações periódicas sobre cada processo.',
      ],
    ],
    highlights: [
      { title: 'Avaliação do caso', text: 'Análise honesta das chances.' },
      { title: 'Comunicação', text: 'Atualizações sem precisar cobrar.' },
      { title: 'Sigilo', text: 'Confidencialidade total.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Áreas de atuação',
    title: ['Como podemos *ajudar*'],
    intro: ['Atuação consultiva e contenciosa.'],
  },
  services: [
    {
      title: 'Direito civil',
      description: 'Contratos, responsabilidade civil, família e sucessões.',
      icon: 'scale',
    },
    {
      title: 'Direito trabalhista',
      description: 'Defesa de empregados e empresas em demandas trabalhistas.',
      icon: 'briefcase',
    },
    {
      title: 'Direito empresarial',
      description: 'Consultoria, contratos e proteção do seu negócio.',
      icon: 'building',
    },
    {
      title: 'Direito do consumidor',
      description: 'Cobranças indevidas, produtos e serviços defeituosos.',
      icon: 'shield',
    },
    {
      title: 'Direito imobiliário',
      description: 'Compra, venda, locação e regularização de imóveis.',
      icon: 'home',
    },
    {
      title: 'Direito previdenciário',
      description: 'Aposentadorias, benefícios e revisões.',
      icon: 'file-text',
    },
  ],
  benefitsHead: {
    eyebrow: 'Diferenciais',
    title: ['Por que contar com a *{empresa}*'],
    intro: ['O que você pode esperar do nosso atendimento.'],
  },
  benefits: [
    { title: 'Análise honesta', description: 'Avaliamos seu caso e dizemos o que é possível.', icon: 'eye' },
    {
      title: 'Linguagem clara',
      description: 'Sem juridiquês: você entende cada etapa.',
      icon: 'message-circle',
    },
    { title: 'Acompanhamento', description: 'Atualizações regulares sobre o andamento.', icon: 'calendar' },
    {
      title: 'Atendimento online',
      description: 'Consultas por videochamada quando necessário.',
      icon: 'globe',
    },
  ],
  processHead: {
    eyebrow: 'Como funciona',
    title: ['Do primeiro contato à *solução*'],
    intro: ['Processo transparente.'],
  },
  steps: [
    { title: 'Contato', description: 'Conte seu caso pelo WhatsApp ou formulário.' },
    { title: 'Consulta', description: 'Análise do caso e orientação sobre caminhos possíveis.' },
    { title: 'Estratégia', description: 'Proposta de honorários e plano de ação.' },
    { title: 'Acompanhamento', description: 'Atuação e atualizações até a conclusão.' },
  ],
  faqs: [
    {
      question: 'A primeira consulta é gratuita?',
      answer:
        'Oferecemos uma avaliação inicial para entender o caso. As condições são informadas no agendamento.',
    },
    {
      question: 'Atendem online?',
      answer: 'Sim, realizamos consultas por videochamada e acompanhamento por WhatsApp e e-mail.',
    },
    {
      question: 'Como são cobrados os honorários?',
      answer: 'Dependem do tipo de caso: valor fixo, por hora ou êxito. Tudo é combinado antes em contrato.',
    },
    {
      question: 'Quanto tempo demora um processo?',
      answer: 'Varia muito conforme a área e a comarca. Na consulta, apresentamos uma estimativa realista.',
    },
    {
      question: 'Atendem fora de {cidade}?',
      answer: 'Sim, atuamos em outras comarcas e atendemos clientes de todo o país de forma online.',
    },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de atuação' },
    { value: '1.500', suffix: '+', label: 'casos atendidos' },
    { value: '6', suffix: '', label: 'áreas de atuação' },
    { value: '100', suffix: '%', label: 'sigilo' },
  ],
  testimonialsHead: { eyebrow: 'Clientes', title: ['Confiança *construída*'] },
  testimonials: [
    {
      quote:
        'Explicaram cada etapa do processo e me mantiveram informado. Resultado melhor do que eu esperava.',
      author: 'Cliente',
      role: 'Direito civil',
      rating: 5,
    },
    {
      quote: 'Resolveram a questão da minha empresa com agilidade e estratégia.',
      author: 'Empresário',
      role: 'Direito empresarial',
      rating: 5,
    },
    {
      quote: 'Atendimento humano e profissional. Recomendo.',
      author: 'Cliente',
      role: '{cidade}',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Escritório',
    title: ['Nosso *espaço*'],
    intro: ['Estrutura para atender com privacidade.'],
  },
  projects: [
    { title: 'Recepção', category: 'Espaço', description: 'Discreta e confortável.' },
    { title: 'Sala de reuniões', category: 'Espaço', description: 'Para atendimentos e negociações.' },
    { title: 'Atendimento online', category: 'Online', description: 'Consultas por videochamada.' },
  ],
  finalCta: {
    eyebrow: 'Fale conosco',
    title: ['Precisa de orientação *jurídica*?'],
    text: ['Conte seu caso pelo WhatsApp e agende uma consulta.'],
  },
  contactIntro: ['Atendimento com hora marcada, presencial ou online.'],
  marquee: ['Civil', 'Trabalhista', 'Empresarial', 'Consumidor', 'Imobiliário', 'Previdenciário'],
  keywords: [
    'advogado {cidade}',
    'escritório de advocacia',
    'advogado trabalhista',
    'advogado civil',
    'consulta jurídica',
  ],
  whatsappMessage: 'Olá! Gostaria de agendar uma consulta com a {empresa}.',
  seoDescription: [
    '{empresa}: escritório de advocacia em {cidade}. Direito civil, trabalhista, empresarial e mais, com atendimento claro e próximo.',
  ],
};
