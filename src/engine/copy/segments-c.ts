import type { SegmentCopy } from './types';

export const imobiliaria: SegmentCopy = {
  segment: 'imobiliaria',
  themes: ['minimal-light', 'luxury-dark', 'architecture'],
  layouts: ['catalog', 'showcase', 'trust'],
  placeholderStyle: 'grid',
  hero: {
    eyebrow: ['Imobiliária em {cidade}', 'Compra · Venda · Locação', 'Seu próximo endereço'],
    headline: [
      'O imóvel certo, no bairro certo, com quem *conhece {cidade}*.',
      'Encontre seu próximo *endereço*.',
      'Comprar, vender ou alugar com *segurança*.',
    ],
    sub: [
      'A {empresa} conecta você aos melhores imóveis de {cidade}, com avaliação justa, documentação em dia e acompanhamento em cada etapa.',
      'Casas, apartamentos, terrenos e salas comerciais. Fale com a {empresa} e receba opções selecionadas para o seu perfil.',
    ],
    badges: ['Imóveis verificados', 'Assessoria jurídica', 'Financiamento'],
  },
  cta: {
    primary: ['Ver imóveis', 'Falar com corretor'],
    secondary: ['Anunciar meu imóvel', 'Avaliar imóvel'],
  },
  manifesto: [
    'Imóvel não é só metro quadrado. É onde a sua vida vai *acontecer*.',
    'Conhecemos cada rua de {cidade}. Por isso encontramos o seu *lugar*.',
  ],
  about: {
    eyebrow: 'Sobre a {empresa}',
    title: ['Especialistas no mercado de *{cidade}*.', 'Negócios imobiliários com confiança.'],
    paragraphs: [
      [
        'A {empresa} é uma imobiliária em {cidade} que atua em compra, venda e locação de imóveis residenciais e comerciais.',
        'Nossa equipe de corretores conhece o mercado local e cuida de toda a burocracia, da documentação ao financiamento.',
      ],
      [
        'Há {anos} anos realizando negócios em {cidade}, a {empresa} construiu uma carteira de imóveis verificados e uma rede de clientes satisfeitos.',
        'Avaliamos seu imóvel com dados reais do mercado e divulgamos nos principais portais e redes.',
      ],
    ],
    highlights: [
      { title: 'Carteira selecionada', text: 'Imóveis verificados pessoalmente.' },
      { title: 'Assessoria completa', text: 'Documentação e financiamento.' },
      { title: 'Divulgação', text: 'Portais, redes e nossa base.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Serviços',
    title: ['Tudo que envolve o seu *imóvel*'],
    intro: ['Da busca à assinatura.'],
  },
  services: [
    {
      title: 'Compra e venda',
      description: 'Imóveis residenciais e comerciais com negociação assistida.',
      icon: 'home',
    },
    {
      title: 'Locação',
      description: 'Administração de aluguel para proprietários e inquilinos.',
      icon: 'key',
    },
    {
      title: 'Avaliação de imóveis',
      description: 'Laudo com base em dados reais do mercado de {cidade}.',
      icon: 'bar-chart',
    },
    {
      title: 'Financiamento',
      description: 'Simulação e aprovação com os principais bancos.',
      icon: 'file-text',
    },
    { title: 'Lançamentos', description: 'Acesso antecipado a novos empreendimentos.', icon: 'building' },
    { title: 'Assessoria jurídica', description: 'Contratos e documentação com segurança.', icon: 'shield' },
  ],
  benefitsHead: {
    eyebrow: 'Por que a {empresa}',
    title: ['Negócio seguro do início ao *fim*'],
    intro: ['O que garante sua tranquilidade.'],
  },
  benefits: [
    {
      title: 'Conhecimento local',
      description: 'Sabemos o valor real de cada bairro de {cidade}.',
      icon: 'map',
    },
    {
      title: 'Imóveis verificados',
      description: 'Visitamos e checamos a documentação antes de anunciar.',
      icon: 'check-circle',
    },
    { title: 'Transparência', description: 'Sem taxas escondidas e com contrato claro.', icon: 'eye' },
    { title: 'Agilidade', description: 'Respostas rápidas e visitas no seu horário.', icon: 'zap' },
  ],
  processHead: { eyebrow: 'Como funciona', title: ['Da busca às *chaves*'], intro: ['Em quatro passos.'] },
  steps: [
    { title: 'Perfil', description: 'Entendemos o que você procura e o orçamento.' },
    { title: 'Seleção', description: 'Enviamos opções que fazem sentido.' },
    { title: 'Visitas', description: 'Agendamos no seu horário.' },
    { title: 'Negociação e contrato', description: 'Cuidamos de documentação e financiamento.' },
  ],
  faqs: [
    {
      question: 'Como anuncio meu imóvel?',
      answer: 'Fale com a gente pelo WhatsApp. Avaliamos, fotografamos e divulgamos nos principais portais.',
    },
    {
      question: 'Vocês ajudam com financiamento?',
      answer: 'Sim, fazemos a simulação e acompanhamos a aprovação junto aos bancos.',
    },
    {
      question: 'Qual a comissão?',
      answer: 'Seguimos a tabela do mercado e informamos tudo antes de qualquer acordo.',
    },
    {
      question: 'Fazem administração de aluguel?',
      answer: 'Sim, cuidamos de contrato, cobrança, vistoria e manutenção para proprietários.',
    },
    { question: 'Atendem outras cidades?', answer: 'Atuamos em {cidade} e região metropolitana.' },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de mercado' },
    { value: '2', suffix: 'mil', label: 'negócios realizados' },
    { value: '400', suffix: '+', label: 'imóveis na carteira' },
    { value: '4.9', suffix: '★', label: 'avaliação' },
  ],
  testimonialsHead: { eyebrow: 'Clientes', title: ['Quem encontrou seu *lugar* com a gente'] },
  testimonials: [
    {
      quote: 'Encontraram o apartamento ideal em duas semanas e cuidaram de todo o financiamento.',
      author: 'Cliente',
      role: 'Compra',
      rating: 5,
    },
    {
      quote: 'Vendi meu imóvel pelo valor justo e sem dor de cabeça com documentação.',
      author: 'Proprietário',
      role: 'Venda',
      rating: 5,
    },
    {
      quote: 'Administram meu aluguel há anos. Nunca tive problema.',
      author: 'Proprietária',
      role: 'Locação',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Imóveis',
    title: ['Destaques da *carteira*'],
    intro: ['Alguns imóveis disponíveis.'],
  },
  projects: [
    { title: 'Apartamento 3 quartos', category: 'Venda', description: 'Com varanda e 2 vagas.' },
    { title: 'Casa em condomínio', category: 'Venda', description: 'Terreno amplo, área gourmet.' },
    { title: 'Sala comercial', category: 'Locação', description: 'Pronta para uso, bem localizada.' },
    { title: 'Terreno', category: 'Venda', description: 'Em bairro em valorização.' },
    { title: 'Cobertura', category: 'Venda', description: 'Vista livre, acabamento premium.' },
    { title: 'Kitnet', category: 'Locação', description: 'Próxima ao centro.' },
  ],
  finalCta: {
    eyebrow: 'Vamos começar?',
    title: ['Seu próximo imóvel está *mais perto* do que você imagina'],
    text: ['Conte o que procura pelo WhatsApp e receba opções selecionadas.'],
  },
  contactIntro: ['Atendimento pelo WhatsApp, telefone ou na nossa loja.'],
  marquee: ['Apartamentos', 'Casas', 'Terrenos', 'Comercial', 'Lançamentos', 'Locação'],
  keywords: [
    'imobiliária {cidade}',
    'imóveis à venda',
    'apartamento para alugar',
    'casa à venda',
    'corretor de imóveis',
  ],
  whatsappMessage: 'Olá! Vi o site da {empresa} e gostaria de informações sobre imóveis.',
  seoDescription: [
    '{empresa}: imobiliária em {cidade}. Compra, venda e locação de imóveis com assessoria completa.',
  ],
};

export const construcao: SegmentCopy = {
  segment: 'construcao',
  themes: ['industrial', 'architecture', 'minimal-light'],
  layouts: ['impact', 'trust', 'showcase'],
  placeholderStyle: 'blueprint',
  hero: {
    eyebrow: ['Construtora em {cidade}', 'Construção · Reforma · Gerenciamento', 'Obra com planejamento'],
    headline: [
      'Obras entregues no *prazo* e dentro do orçamento.',
      'Construção com planejamento, do projeto à *chave*.',
      'Sua obra em mãos *experientes*.',
    ],
    sub: [
      'A {empresa} executa construções residenciais, comerciais e reformas em {cidade} com equipe própria, cronograma transparente e acompanhamento diário.',
      'Planejamento detalhado, fornecedores confiáveis e engenheiro responsável. Com a {empresa}, você acompanha cada etapa da obra.',
    ],
    badges: ['Engenheiro responsável', 'Cronograma transparente', 'Orçamento fechado'],
  },
  cta: {
    primary: ['Solicitar orçamento', 'Falar com engenheiro'],
    secondary: ['Ver obras', 'Como trabalhamos'],
  },
  manifesto: [
    'Obra boa é a que começa no papel e termina no *prazo*.',
    'Planejar é mais barato que *refazer*.',
  ],
  about: {
    eyebrow: 'Sobre a {empresa}',
    title: ['Engenharia e execução em *{cidade}*.', 'Construímos com responsabilidade.'],
    paragraphs: [
      [
        'A {empresa} é uma construtora em {cidade} que atua em obras residenciais, comerciais e reformas com equipe própria e gestão profissional.',
        'Cada obra tem cronograma, orçamento detalhado e um engenheiro responsável acompanhando a execução.',
      ],
      [
        'Há {anos} anos construindo em {cidade} e região, a {empresa} já entregou dezenas de obras com o mesmo padrão de qualidade e cumprimento de prazo.',
        'Trabalhamos com fornecedores homologados e relatórios semanais para que o cliente acompanhe tudo.',
      ],
    ],
    highlights: [
      { title: 'Equipe própria', text: 'Controle de qualidade e prazo.' },
      { title: 'Relatórios semanais', text: 'Fotos e andamento da obra.' },
      { title: 'Orçamento fechado', text: 'Sem surpresas no final.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Serviços',
    title: ['O que *construímos*'],
    intro: ['Residencial, comercial e industrial.'],
  },
  services: [
    {
      title: 'Construção residencial',
      description: 'Casas e sobrados do projeto à entrega, com acabamento de alto padrão.',
      icon: 'home',
    },
    { title: 'Obras comerciais', description: 'Lojas, escritórios, clínicas e galpões.', icon: 'building' },
    {
      title: 'Reformas',
      description: 'Reformas completas ou parciais com mínimo transtorno.',
      icon: 'hammer',
    },
    {
      title: 'Gerenciamento de obra',
      description: 'Planejamento, compras e fiscalização para sua obra.',
      icon: 'layers',
    },
    {
      title: 'Projetos e aprovações',
      description: 'Projeto arquitetônico, estrutural e aprovação na prefeitura.',
      icon: 'file-text',
    },
    {
      title: 'Estruturas e fundações',
      description: 'Execução de estruturas em concreto e metálicas.',
      icon: 'ruler',
    },
  ],
  benefitsHead: {
    eyebrow: 'Diferenciais',
    title: ['Por que construir com a *{empresa}*'],
    intro: ['O que garante uma obra sem dor de cabeça.'],
  },
  benefits: [
    {
      title: 'Planejamento completo',
      description: 'Cronograma físico-financeiro antes de começar.',
      icon: 'calendar',
    },
    {
      title: 'Responsabilidade técnica',
      description: 'Engenheiro responsável e ART em todas as obras.',
      icon: 'shield',
    },
    { title: 'Transparência', description: 'Relatórios semanais com fotos e gastos.', icon: 'eye' },
    {
      title: 'Qualidade de acabamento',
      description: 'Equipe especializada em cada etapa.',
      icon: 'sparkles',
    },
  ],
  processHead: { eyebrow: 'Como funciona', title: ['Da ideia à *entrega*'], intro: ['Um processo testado.'] },
  steps: [
    { title: 'Visita e briefing', description: 'Entendemos o projeto, o terreno e o investimento.' },
    { title: 'Orçamento e cronograma', description: 'Proposta detalhada por etapa.' },
    { title: 'Execução', description: 'Obra com equipe própria e relatórios semanais.' },
    { title: 'Entrega', description: 'Vistoria final e garantia.' },
  ],
  faqs: [
    {
      question: 'Vocês fazem o projeto também?',
      answer:
        'Sim, desenvolvemos ou adaptamos projetos arquitetônicos e estruturais e cuidamos das aprovações.',
    },
    {
      question: 'O orçamento é fechado?',
      answer:
        'Sim. Trabalhamos com orçamento fechado por etapa, com aditivos apenas se o cliente solicitar mudanças.',
    },
    {
      question: 'Como acompanho a obra?',
      answer: 'Por relatórios semanais com fotos, além de visitas agendadas.',
    },
    {
      question: 'Qual a garantia?',
      answer: 'Seguimos as garantias previstas em norma, com suporte pós-entrega.',
    },
    {
      question: 'Atendem em outras cidades?',
      answer: 'Atendemos {cidade} e região. Consulte para outras localidades.',
    },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos construindo' },
    { value: '80', suffix: '+', label: 'obras entregues' },
    { value: '50', suffix: 'mil m²', label: 'construídos' },
    { value: '100', suffix: '%', label: 'com ART' },
  ],
  testimonialsHead: { eyebrow: 'Clientes', title: ['Obras que *falam por si*'] },
  testimonials: [
    {
      quote: 'Entregaram a casa no prazo combinado e o acabamento ficou impecável.',
      author: 'Cliente',
      role: 'Residência em {cidade}',
      rating: 5,
    },
    {
      quote: 'Os relatórios semanais me deram tranquilidade mesmo morando longe da obra.',
      author: 'Cliente',
      role: 'Construção residencial',
      rating: 5,
    },
    {
      quote: 'Reformaram a loja em 30 dias sem fechar o atendimento.',
      author: 'Empresária',
      role: 'Reforma comercial',
      rating: 5,
    },
  ],
  projectsHead: { eyebrow: 'Obras', title: ['Obras *entregues*'], intro: ['Uma amostra do nosso trabalho.'] },
  projects: [
    {
      title: 'Residência alto padrão',
      category: 'Residencial',
      description: 'Sobrado de 320 m² em condomínio.',
    },
    { title: 'Galpão industrial', category: 'Industrial', description: 'Estrutura metálica de 1.200 m².' },
    { title: 'Reforma de clínica', category: 'Comercial', description: 'Reforma completa em 45 dias.' },
    { title: 'Edifício residencial', category: 'Incorporação', description: 'Prédio de 6 andares.' },
  ],
  finalCta: {
    eyebrow: 'Vamos construir?',
    title: ['Sua obra começa com um *bom planejamento*'],
    text: ['Fale com nosso engenheiro pelo WhatsApp e receba uma proposta.'],
  },
  contactIntro: ['Orçamentos e visitas técnicas pelo WhatsApp.'],
  marquee: ['Construção', 'Reforma', 'Gerenciamento', 'Projetos', 'Estruturas'],
  keywords: [
    'construtora {cidade}',
    'construção de casas',
    'reforma',
    'empreiteira',
    'gerenciamento de obra',
  ],
  whatsappMessage: 'Olá! Gostaria de um orçamento de obra com a {empresa}.',
  seoDescription: [
    '{empresa}: construtora em {cidade}. Construção residencial, comercial e reformas com planejamento e prazo.',
  ],
};

export const academia: SegmentCopy = {
  segment: 'academia',
  themes: ['high-contrast', 'industrial', 'automotive'],
  layouts: ['impact', 'showcase', 'local'],
  placeholderStyle: 'diagonal',
  hero: {
    eyebrow: ['Academia em {cidade}', 'Treino · Saúde · Resultado', 'Comece hoje'],
    headline: [
      'Treine onde o resultado *aparece*.',
      'Sua melhor versão começa *aqui*.',
      'Força, saúde e *constância*.',
    ],
    sub: [
      'A {empresa} tem estrutura completa, professores presentes e planos sem fidelidade em {cidade}. Faça uma aula experimental grátis.',
      'Musculação, funcional, aulas coletivas e acompanhamento de verdade. Na {empresa}, você treina com orientação e motivação.',
    ],
    badges: ['Aula experimental grátis', 'Sem fidelidade', 'Professores presentes'],
  },
  cta: { primary: ['Agendar aula grátis', 'Ver planos'], secondary: ['Conhecer a estrutura', 'Horários'] },
  manifesto: [
    'Resultado não vem de um treino *perfeito*. Vem de muitos treinos *feitos*.',
    'A gente cuida do método. Você cuida de *aparecer*.',
  ],
  about: {
    eyebrow: 'Sobre a {empresa}',
    title: ['Mais que uma academia, uma *comunidade*.', 'Treino sério em {cidade}.'],
    paragraphs: [
      [
        'A {empresa} é uma academia em {cidade} com equipamentos modernos, aulas coletivas e professores que acompanham cada aluno.',
        'Aqui você recebe avaliação física, treino personalizado e ajustes constantes para evoluir com segurança.',
      ],
      [
        'Há {anos} anos transformando rotinas em {cidade}, a {empresa} acredita que treinar tem que ser acessível, orientado e prazeroso.',
        'Horários amplos, ambiente climatizado e uma comunidade que motiva.',
      ],
    ],
    highlights: [
      { title: 'Avaliação física', text: 'Inclusa em todos os planos.' },
      { title: 'Treino personalizado', text: 'Montado e atualizado por professor.' },
      { title: 'Horário amplo', text: 'Da manhã à noite, todos os dias.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Modalidades',
    title: ['Encontre o treino *certo* para você'],
    intro: ['Opções para todos os objetivos.'],
  },
  services: [
    {
      title: 'Musculação',
      description: 'Equipamentos de última geração e treino montado por professor.',
      icon: 'dumbbell',
    },
    {
      title: 'Funcional',
      description: 'Aulas dinâmicas para condicionamento e queima calórica.',
      icon: 'activity',
    },
    {
      title: 'Aulas coletivas',
      description: 'Dança, spinning, pilates e muito mais na grade semanal.',
      icon: 'users',
    },
    {
      title: 'Personal trainer',
      description: 'Acompanhamento individual para resultados acelerados.',
      icon: 'target',
    },
    {
      title: 'Avaliação física',
      description: 'Bioimpedância e medidas para acompanhar a evolução.',
      icon: 'bar-chart',
    },
    { title: 'Nutrição', description: 'Orientação alimentar com profissional parceiro.', icon: 'leaf' },
  ],
  benefitsHead: {
    eyebrow: 'Diferenciais',
    title: ['Por que treinar na *{empresa}*'],
    intro: ['O que faz você continuar.'],
  },
  benefits: [
    {
      title: 'Professores presentes',
      description: 'Orientação de verdade em todos os horários.',
      icon: 'users',
    },
    {
      title: 'Estrutura completa',
      description: 'Equipamentos novos, climatização e vestiários.',
      icon: 'dumbbell',
    },
    { title: 'Sem fidelidade', description: 'Planos flexíveis, sem multa.', icon: 'check-circle' },
    {
      title: 'Resultados acompanhados',
      description: 'Avaliações periódicas para ver a evolução.',
      icon: 'trending-up',
    },
  ],
  processHead: {
    eyebrow: 'Comece',
    title: ['Seu primeiro treino em *3 passos*'],
    intro: ['Sem compromisso.'],
  },
  steps: [
    { title: 'Agende a aula grátis', description: 'Pelo WhatsApp, escolha dia e horário.' },
    { title: 'Avaliação', description: 'Conhecemos seus objetivos e montamos o treino.' },
    { title: 'Treine', description: 'Com acompanhamento desde o primeiro dia.' },
  ],
  faqs: [
    {
      question: 'Tem taxa de matrícula?',
      answer: 'Consulte as promoções do mês. Frequentemente a matrícula é isenta.',
    },
    {
      question: 'Os planos têm fidelidade?',
      answer: 'Temos planos mensais sem fidelidade e planos anuais com desconto.',
    },
    {
      question: 'Posso fazer uma aula experimental?',
      answer: 'Sim, a primeira aula é grátis. Agende pelo WhatsApp.',
    },
    {
      question: 'Qual o horário de funcionamento?',
      answer: 'Consulte os horários na seção de contato. Abrimos cedo e fechamos tarde.',
    },
    { question: 'Tem personal trainer?', answer: 'Sim, com pacotes de acompanhamento individual.' },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de academia' },
    { value: '1.200', suffix: 'm²', label: 'de estrutura' },
    { value: '30', suffix: '+', label: 'aulas por semana' },
    { value: '2', suffix: 'mil', label: 'alunos' },
  ],
  testimonialsHead: { eyebrow: 'Alunos', title: ['Resultados *reais*'] },
  testimonials: [
    {
      quote: 'Perdi 12 kg em 6 meses com o acompanhamento dos professores. Nunca treinei tão certo.',
      author: 'Aluna',
      rating: 5,
    },
    {
      quote: 'Ambiente motivador, equipamentos novos e professor sempre por perto.',
      author: 'Aluno',
      role: '{cidade}',
      rating: 5,
    },
    {
      quote: 'As aulas coletivas são o melhor horário do meu dia.',
      author: 'Aluna',
      role: 'Aulas coletivas',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Estrutura',
    title: ['Conheça o *espaço*'],
    intro: ['Tudo que você precisa para treinar bem.'],
  },
  projects: [
    { title: 'Área de musculação', category: 'Estrutura', description: 'Equipamentos de última geração.' },
    { title: 'Sala de aulas coletivas', category: 'Estrutura', description: 'Climatizada e com som.' },
    { title: 'Espaço funcional', category: 'Estrutura', description: 'Para treinos dinâmicos.' },
    { title: 'Vestiários', category: 'Estrutura', description: 'Armários e chuveiros.' },
  ],
  finalCta: {
    eyebrow: 'Comece hoje',
    title: ['Sua primeira aula é *por nossa conta*'],
    text: ['Agende pelo WhatsApp e venha conhecer a {empresa}.'],
  },
  contactIntro: ['Matrículas e aulas experimentais pelo WhatsApp.'],
  marquee: ['Musculação', 'Funcional', 'Coletivas', 'Personal', 'Avaliação'],
  keywords: [
    'academia {cidade}',
    'musculação',
    'aulas coletivas',
    'personal trainer',
    'academia perto de mim',
  ],
  whatsappMessage: 'Olá! Quero agendar uma aula experimental na {empresa}.',
  seoDescription: [
    '{empresa}: academia em {cidade} com musculação, funcional, aulas coletivas e professores presentes. Aula experimental grátis.',
  ],
};

export const estetica: SegmentCopy = {
  segment: 'estetica',
  themes: ['luxury-dark', 'minimal-light', 'editorial'],
  layouts: ['editorial', 'local', 'showcase'],
  placeholderStyle: 'organic',
  hero: {
    eyebrow: ['Estética em {cidade}', 'Beleza · Bem-estar · Autoestima', 'Cuide de você'],
    headline: [
      'Cuidar de você é o nosso *trabalho*.',
      'Resultados naturais, com *técnica* e cuidado.',
      'Sua beleza, com a atenção que *merece*.',
    ],
    sub: [
      'A {empresa} oferece tratamentos faciais, corporais e procedimentos estéticos em {cidade} com profissionais qualificados e produtos de alta qualidade.',
      'Avaliação personalizada, protocolos seguros e um ambiente feito para você relaxar. Agende na {empresa}.',
    ],
    badges: ['Avaliação gratuita', 'Profissionais certificados', 'Ambiente exclusivo'],
  },
  cta: { primary: ['Agendar avaliação', 'Falar no WhatsApp'], secondary: ['Ver tratamentos', 'Resultados'] },
  manifesto: [
    'Beleza não é padrão. É se *reconhecer* no espelho.',
    'Técnica, segurança e um resultado que parece *seu*.',
  ],
  about: {
    eyebrow: 'Sobre a {empresa}',
    title: ['Um espaço feito para *você*.', 'Estética com técnica em {cidade}.'],
    paragraphs: [
      [
        'A {empresa} é uma clínica de estética em {cidade} especializada em tratamentos faciais, corporais e bem-estar.',
        'Nossa equipe é formada por profissionais certificados que avaliam cada cliente para indicar o protocolo mais adequado.',
      ],
      [
        'Há {anos} anos cuidando da autoestima de clientes em {cidade}, a {empresa} combina tecnologia, produtos de alta performance e atendimento acolhedor.',
        'Cada tratamento começa com uma avaliação gratuita e um plano personalizado.',
      ],
    ],
    highlights: [
      { title: 'Avaliação personalizada', text: 'Protocolos sob medida.' },
      { title: 'Equipamentos modernos', text: 'Tecnologias certificadas.' },
      { title: 'Ambiente exclusivo', text: 'Privacidade e conforto.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Tratamentos',
    title: ['Tratamentos para *rosto* e *corpo*'],
    intro: ['Protocolos personalizados para cada necessidade.'],
  },
  services: [
    {
      title: 'Limpeza de pele',
      description: 'Limpeza profunda com hidratação e cuidados específicos.',
      icon: 'droplet',
    },
    {
      title: 'Tratamentos faciais',
      description: 'Peelings, microagulhamento e protocolos antiidade.',
      icon: 'sparkles',
    },
    {
      title: 'Tratamentos corporais',
      description: 'Drenagem, modeladora e protocolos redutores.',
      icon: 'heart',
    },
    { title: 'Depilação', description: 'Depilação a laser e cera com conforto e segurança.', icon: 'sun' },
    { title: 'Massagens', description: 'Relaxante, terapêutica e pedras quentes.', icon: 'smile' },
    { title: 'Design de sobrancelhas', description: 'Design, henna e micropigmentação.', icon: 'eye' },
  ],
  benefitsHead: {
    eyebrow: 'Diferenciais',
    title: ['Por que escolher a *{empresa}*'],
    intro: ['O que torna a experiência diferente.'],
  },
  benefits: [
    {
      title: 'Profissionais certificados',
      description: 'Equipe com formação e atualização constante.',
      icon: 'award',
    },
    { title: 'Segurança', description: 'Protocolos e produtos aprovados.', icon: 'shield' },
    {
      title: 'Resultados naturais',
      description: 'Tratamentos que respeitam sua identidade.',
      icon: 'sparkles',
    },
    { title: 'Horário flexível', description: 'Atendimento também aos sábados.', icon: 'calendar' },
  ],
  processHead: {
    eyebrow: 'Como funciona',
    title: ['Do primeiro contato ao *resultado*'],
    intro: ['Simples e acolhedor.'],
  },
  steps: [
    { title: 'Agende', description: 'Pelo WhatsApp, escolha o melhor horário.' },
    { title: 'Avaliação', description: 'Analisamos sua pele ou corpo e indicamos o protocolo.' },
    { title: 'Tratamento', description: 'Sessões com acompanhamento e cuidados em casa.' },
    { title: 'Resultado', description: 'Acompanhamos a evolução e ajustamos o plano.' },
  ],
  faqs: [
    {
      question: 'A avaliação é gratuita?',
      answer: 'Sim, a primeira avaliação é gratuita e sem compromisso.',
    },
    {
      question: 'Os tratamentos doem?',
      answer: 'A maioria é indolor ou causa apenas leve desconforto. Explicamos tudo na avaliação.',
    },
    {
      question: 'Quantas sessões preciso?',
      answer: 'Depende do tratamento e do objetivo. Indicamos o número de sessões no plano personalizado.',
    },
    { question: 'Vendem pacotes?', answer: 'Sim, pacotes com desconto para protocolos de várias sessões.' },
    { question: 'Atendem aos sábados?', answer: 'Sim, consulte os horários disponíveis pelo WhatsApp.' },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de experiência' },
    { value: '5', suffix: 'mil', label: 'clientes atendidas' },
    { value: '20', suffix: '+', label: 'tratamentos' },
    { value: '5', suffix: '★', label: 'avaliação' },
  ],
  testimonialsHead: { eyebrow: 'Clientes', title: ['Quem já se *cuidou* aqui'] },
  testimonials: [
    {
      quote: 'Minha pele nunca esteve tão bonita. Atendimento carinhoso e resultado visível.',
      author: 'Cliente',
      role: 'Tratamento facial',
      rating: 5,
    },
    {
      quote: 'Ambiente lindo e profissionais que explicam tudo. Virou meu momento da semana.',
      author: 'Cliente',
      role: '{cidade}',
      rating: 5,
    },
    {
      quote: 'Fiz o pacote de drenagem e os resultados apareceram rápido.',
      author: 'Cliente',
      role: 'Corporal',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Espaço',
    title: ['Conheça a *{empresa}*'],
    intro: ['Um ambiente feito para relaxar.'],
  },
  projects: [
    { title: 'Recepção', category: 'Espaço', description: 'Acolhedora e perfumada.' },
    { title: 'Salas de tratamento', category: 'Espaço', description: 'Privativas e climatizadas.' },
    { title: 'Equipamentos', category: 'Tecnologia', description: 'Certificados e modernos.' },
    { title: 'Sala de massagem', category: 'Espaço', description: 'Luz baixa e silêncio.' },
  ],
  finalCta: {
    eyebrow: 'Agende',
    title: ['Sua avaliação gratuita *espera por você*'],
    text: ['Chame no WhatsApp e escolha o melhor horário.'],
  },
  contactIntro: ['Agendamentos e dúvidas pelo WhatsApp.'],
  marquee: ['Facial', 'Corporal', 'Depilação', 'Massagem', 'Sobrancelhas'],
  keywords: [
    'estética {cidade}',
    'clínica de estética',
    'limpeza de pele',
    'depilação a laser',
    'tratamento facial',
  ],
  whatsappMessage: 'Olá! Gostaria de agendar uma avaliação na {empresa}.',
  seoDescription: [
    '{empresa}: clínica de estética em {cidade}. Tratamentos faciais, corporais, depilação e massagens com avaliação gratuita.',
  ],
};

export const barbearia: SegmentCopy = {
  segment: 'barbearia',
  themes: ['high-contrast', 'industrial', 'luxury-dark'],
  layouts: ['impact', 'local', 'showcase'],
  placeholderStyle: 'diagonal',
  hero: {
    eyebrow: ['Barbearia em {cidade}', 'Corte · Barba · Estilo', 'Agende seu horário'],
    headline: [
      'Corte na régua, barba no *capricho*.',
      'Estilo não se improvisa. Se *agenda*.',
      'A barbearia que {cidade} *respeita*.',
    ],
    sub: [
      'Na {empresa} você encontra barbeiros experientes, ambiente de respeito e horário marcado pelo WhatsApp. Sem fila, sem pressa.',
      'Cortes clássicos e modernos, barba feita com navalha e toalha quente, e aquela cerveja gelada enquanto espera.',
    ],
    badges: ['Horário marcado', 'Barbeiros experientes', 'Cerveja gelada'],
  },
  cta: {
    primary: ['Agendar horário', 'Chamar no WhatsApp'],
    secondary: ['Ver serviços', 'Tabela de preços'],
  },
  manifesto: ['Um bom corte muda o dia. Um bom barbeiro muda a *semana*.', 'Tradição, navalha e *atitude*.'],
  about: {
    eyebrow: 'A casa',
    title: ['Mais que uma barbearia, um *ponto de encontro*.', 'Tradição em {cidade}.'],
    paragraphs: [
      [
        'A {empresa} é uma barbearia em {cidade} feita para quem valoriza um corte bem feito e um ambiente de respeito.',
        'Barbeiros experientes, produtos de qualidade e agendamento sem complicação pelo WhatsApp.',
      ],
      [
        'Há {anos} anos cuidando do visual de {cidade}, a {empresa} virou ponto de encontro: cadeira confortável, boa música e conversa boa.',
        'Clássico ou moderno, aqui você sai do jeito que entrou pensando.',
      ],
    ],
    highlights: [
      { title: 'Horário marcado', text: 'Sem fila, no seu tempo.' },
      { title: 'Produtos premium', text: 'Pomadas, óleos e balms.' },
      { title: 'Ambiente', text: 'Música, cerveja e respeito.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Serviços',
    title: ['Na *cadeira*'],
    intro: ['Tudo que um homem precisa para sair alinhado.'],
  },
  services: [
    {
      title: 'Corte',
      description: 'Clássico, degradê, social ou moderno, com acabamento na navalha.',
      icon: 'scissors',
      price: 'a partir de R$ 45',
    },
    {
      title: 'Barba',
      description: 'Modelagem com navalha, toalha quente e produtos premium.',
      icon: 'sparkles',
      price: 'a partir de R$ 35',
    },
    {
      title: 'Corte + barba',
      description: 'O combo completo para sair alinhado.',
      icon: 'star',
      price: 'a partir de R$ 70',
    },
    { title: 'Pigmentação', description: 'Disfarce de falhas na barba e no cabelo.', icon: 'paint' },
    { title: 'Sobrancelha', description: 'Alinhamento na navalha ou pinça.', icon: 'eye' },
    { title: 'Dia do noivo', description: 'Pacote para noivo e padrinhos.', icon: 'users' },
  ],
  benefitsHead: {
    eyebrow: 'Por que aqui',
    title: ['Por que a *{empresa}*'],
    intro: ['O que faz você voltar.'],
  },
  benefits: [
    {
      title: 'Barbeiros experientes',
      description: 'Profissionais que entendem o seu estilo.',
      icon: 'award',
    },
    { title: 'Sem espera', description: 'Agendamento online e horário respeitado.', icon: 'clock' },
    { title: 'Produtos de qualidade', description: 'Linha premium para cabelo e barba.', icon: 'sparkles' },
    { title: 'Ambiente', description: 'Música boa, cerveja gelada e papo reto.', icon: 'coffee' },
  ],
  processHead: { eyebrow: 'Agende', title: ['Em *3 passos*'], intro: ['Rápido como tem que ser.'] },
  steps: [
    { title: 'Chame no WhatsApp', description: 'Escolha o serviço e o barbeiro.' },
    { title: 'Confirme o horário', description: 'Receba a confirmação na hora.' },
    { title: 'Chegue e relaxe', description: 'Sua cadeira está esperando.' },
  ],
  faqs: [
    {
      question: 'Precisa agendar?',
      answer: 'Recomendamos agendar pelo WhatsApp para garantir seu horário. Encaixes dependem da agenda.',
    },
    {
      question: 'Qual o valor do corte?',
      answer: 'Consulte a tabela na seção de serviços. Combos têm desconto.',
    },
    { question: 'Atendem crianças?', answer: 'Sim, atendemos crianças a partir de 5 anos.' },
    { question: 'Têm plano mensal?', answer: 'Sim, planos com cortes ilimitados. Consulte as condições.' },
    { question: 'Qual o horário de funcionamento?', answer: 'Confira os horários na seção de contato.' },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de navalha' },
    { value: '15', suffix: 'mil', label: 'cortes feitos' },
    { value: '5', suffix: '★', label: 'avaliação' },
    { value: '0', suffix: '', label: 'minutos de fila' },
  ],
  testimonialsHead: { eyebrow: 'Clientes', title: ['Quem senta na *cadeira* aprova'] },
  testimonials: [
    { quote: 'Melhor degradê de {cidade}. Horário marcado e nunca atrasou.', author: 'Cliente', rating: 5 },
    {
      quote: 'A barba com toalha quente é outro nível. Virei cliente fixo.',
      author: 'Cliente',
      role: 'Barba',
      rating: 5,
    },
    {
      quote: 'Ambiente top, cerveja gelada e corte na régua.',
      author: 'Cliente',
      role: 'Corte + barba',
      rating: 5,
    },
  ],
  projectsHead: { eyebrow: 'Trabalhos', title: ['Alguns *cortes*'], intro: ['Direto da cadeira.'] },
  projects: [
    { title: 'Degradê navalhado', category: 'Corte', description: 'Com acabamento na navalha.' },
    { title: 'Barba modelada', category: 'Barba', description: 'Toalha quente e óleo.' },
    { title: 'Social clássico', category: 'Corte', description: 'Para o dia a dia.' },
    { title: 'Corte moderno', category: 'Corte', description: 'Textura e volume.' },
  ],
  finalCta: {
    eyebrow: 'Bora?',
    title: ['Garanta seu *horário*'],
    text: ['Chame no WhatsApp e escolha o barbeiro.'],
  },
  contactIntro: ['Agendamentos pelo WhatsApp.'],
  marquee: ['Corte', 'Barba', 'Navalha', 'Pigmentação', 'Estilo'],
  keywords: ['barbearia {cidade}', 'barbeiro', 'corte masculino', 'barba', 'degradê'],
  whatsappMessage: 'E aí! Quero agendar um horário na {empresa}.',
  seoDescription: [
    '{empresa}: barbearia em {cidade}. Corte, barba e estilo com horário marcado pelo WhatsApp.',
  ],
};
