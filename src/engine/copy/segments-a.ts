import type { SegmentCopy } from './types';

export const serralheria: SegmentCopy = {
  segment: 'serralheria',
  themes: ['industrial', 'high-contrast', 'luxury-dark'],
  layouts: ['impact', 'local', 'showcase'],
  placeholderStyle: 'diagonal',
  hero: {
    eyebrow: ['Serralheria em {cidade}', 'Estruturas metálicas sob medida', 'Ferro, aço e precisão'],
    headline: [
      'Projetos em serralheria feitos para *durar*.',
      'Portões, estruturas e esquadrias com acabamento de *verdade*.',
      'Metal trabalhado com *precisão* para o seu projeto.',
    ],
    sub: [
      'Da fabricação à instalação, a {empresa} atende {cidade} com soluções sob medida em portões, grades, escadas, coberturas e estruturas metálicas.',
      'Fabricação própria, medidas exatas e prazo cumprido. A {empresa} transforma ferro e aço em soluções seguras para residências, comércios e indústrias em {cidade}.',
      'Orçamento rápido, visita técnica e instalação feita por quem fabrica. Esse é o jeito {empresa} de trabalhar em {cidade}.',
    ],
    badges: ['Orçamento sem compromisso', 'Fabricação própria', 'Instalação inclusa'],
  },
  cta: {
    primary: ['Pedir orçamento', 'Falar no WhatsApp', 'Solicitar visita técnica'],
    secondary: ['Ver trabalhos', 'Conhecer serviços'],
  },
  manifesto: [
    'Cada peça sai da nossa oficina com uma regra: tem que aguentar o tempo, o uso e o olhar mais exigente.',
    'Serralheria boa não é a mais barata. É a que você instala uma vez e esquece por *décadas*.',
  ],
  about: {
    eyebrow: 'Sobre a {empresa}',
    title: ['Oficina própria, mão de obra *especializada*.', 'Tradição em metal, feita em {cidade}.'],
    paragraphs: [
      [
        'A {empresa} nasceu da bancada: anos de solda, corte e montagem transformados em uma serralheria completa, que atende desde o portão residencial até a estrutura metálica de um galpão.',
        'Trabalhamos com projeto, medida exata e acabamento em pintura eletrostática ou galvanização, para que o resultado seja bonito no primeiro dia e firme nos próximos vinte anos.',
      ],
      [
        'Há {anos} anos fabricando e instalando em {cidade}, aprendemos que cliente satisfeito é aquele que não precisa chamar de novo. Por isso cada etapa é feita pela nossa própria equipe.',
        'Do orçamento à instalação, você fala direto com quem executa. Sem intermediário, sem surpresa no prazo.',
      ],
    ],
    highlights: [
      { title: 'Fabricação própria', text: 'Controle total de qualidade e prazo.' },
      { title: 'Projeto sob medida', text: 'Cada peça desenhada para o seu espaço.' },
      { title: 'Garantia de serviço', text: 'Instalação feita por quem fabrica.' },
    ],
  },
  servicesHead: {
    eyebrow: 'O que fazemos',
    title: ['Serviços de *serralheria*', 'Soluções em metal para cada necessidade'],
    intro: [
      'Residencial, comercial e industrial. Se é em ferro, aço ou alumínio, a gente projeta, fabrica e instala.',
    ],
  },
  services: [
    {
      title: 'Portões e grades',
      description:
        'Portões de correr, basculantes e pivotantes, com automatização e grades de proteção sob medida.',
      icon: 'home',
    },
    {
      title: 'Estruturas metálicas',
      description:
        'Mezaninos, galpões, coberturas e reforços estruturais com projeto e ART quando necessário.',
      icon: 'layers',
    },
    {
      title: 'Escadas e corrimãos',
      description: 'Escadas retas, caracol e marinheiro, guarda-corpos e corrimãos em aço ou inox.',
      icon: 'ruler',
    },
    {
      title: 'Esquadrias',
      description:
        'Janelas, portas e fechamentos em alumínio e ferro, com vidro e acabamento de alto padrão.',
      icon: 'building',
    },
    {
      title: 'Coberturas e toldos',
      description: 'Estruturas para garagens, áreas gourmet e fachadas, com telha metálica ou policarbonato.',
      icon: 'shield',
    },
    {
      title: 'Manutenção e reforma',
      description: 'Reparo, troca de peças, pintura e automatização de portões e estruturas existentes.',
      icon: 'wrench',
    },
  ],
  benefitsHead: {
    eyebrow: 'Por que a {empresa}',
    title: ['Feito para durar. Feito para *você*.'],
    intro: ['O que diferencia uma serralheria séria de um serviço improvisado.'],
  },
  benefits: [
    {
      title: 'Medida exata',
      description: 'Visita técnica com medição no local. Nada de peça que não encaixa.',
      icon: 'ruler',
    },
    {
      title: 'Acabamento profissional',
      description: 'Solda limpa, pintura eletrostática e detalhes que fazem diferença.',
      icon: 'sparkles',
    },
    {
      title: 'Prazo combinado',
      description: 'Você sabe quando começa e quando termina. E a gente cumpre.',
      icon: 'clock',
    },
    {
      title: 'Segurança em primeiro lugar',
      description: 'Estruturas dimensionadas e instaladas com responsabilidade.',
      icon: 'shield',
    },
  ],
  processHead: {
    eyebrow: 'Como funciona',
    title: ['Do orçamento à *instalação*'],
    intro: ['Processo simples e transparente, sem surpresas.'],
  },
  steps: [
    {
      title: 'Contato e visita',
      description: 'Você chama no WhatsApp, agendamos a visita e medimos tudo no local.',
    },
    {
      title: 'Projeto e orçamento',
      description: 'Enviamos proposta detalhada com material, prazo e valor fechado.',
    },
    { title: 'Fabricação', description: 'A peça é produzida na nossa oficina com acompanhamento por fotos.' },
    { title: 'Instalação', description: 'Nossa equipe instala, testa e entrega pronto para uso.' },
  ],
  faqs: [
    {
      question: 'Vocês fazem orçamento sem compromisso?',
      answer: 'Sim. O orçamento é gratuito e, quando necessário, fazemos visita técnica para medir no local.',
    },
    {
      question: 'Qual o prazo médio de um portão?',
      answer:
        'Depende do modelo e do acabamento, mas a maioria dos portões fica pronta entre 10 e 20 dias úteis após a aprovação.',
    },
    {
      question: 'Vocês instalam ou só fabricam?',
      answer:
        'Fabricamos e instalamos. A instalação é feita pela nossa própria equipe, com garantia do serviço.',
    },
    {
      question: 'Trabalham com automatização?',
      answer: 'Sim, instalamos motores e automatizadores em portões novos e existentes.',
    },
    {
      question: 'Atendem fora de {cidade}?',
      answer: 'Atendemos {cidade} e região. Consulte a disponibilidade para a sua cidade pelo WhatsApp.',
    },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de experiência' },
    { value: '500', suffix: '+', label: 'projetos entregues' },
    { value: '100', suffix: '%', label: 'fabricação própria' },
    { value: '5', suffix: '★', label: 'avaliação dos clientes' },
  ],
  testimonialsHead: { eyebrow: 'Depoimentos', title: ['Quem já contratou *recomenda*'] },
  testimonials: [
    {
      quote:
        'Fizeram o portão da minha casa com um acabamento que eu não esperava. Prazo cumprido e instalação impecável.',
      author: 'Cliente residencial',
      role: '{cidade}',
      rating: 5,
    },
    {
      quote:
        'Precisávamos de um mezanino para o estoque e eles resolveram do projeto à montagem. Equipe séria.',
      author: 'Cliente comercial',
      role: 'Loja em {cidade}',
      rating: 5,
    },
    {
      quote: 'Atendimento direto com quem executa faz toda a diferença. Recomendo.',
      author: 'Cliente',
      role: 'Reforma de escada',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Trabalhos',
    title: ['Alguns *projetos* recentes'],
    intro: ['Uma amostra do que sai da nossa oficina.'],
  },
  projects: [
    {
      title: 'Portão pivotante residencial',
      category: 'Residencial',
      description: 'Portão em aço com ripado e automatização.',
    },
    {
      title: 'Mezanino para estoque',
      category: 'Comercial',
      description: 'Estrutura metálica com piso e escada de acesso.',
    },
    {
      title: 'Cobertura de garagem',
      category: 'Residencial',
      description: 'Estrutura com telha termoacústica.',
    },
    {
      title: 'Guarda-corpo em inox',
      category: 'Residencial',
      description: 'Guarda-corpo com vidro para varanda.',
    },
  ],
  finalCta: {
    eyebrow: 'Vamos começar?',
    title: ['Peça seu orçamento *hoje*', 'Seu projeto em metal começa aqui'],
    text: ['Mande as medidas ou uma foto do local pelo WhatsApp. Respondemos rápido com uma estimativa.'],
  },
  contactIntro: ['Chame no WhatsApp, ligue ou envie o formulário. Respondemos em horário comercial.'],
  marquee: ['Portões', 'Estruturas', 'Escadas', 'Esquadrias', 'Coberturas', 'Grades'],
  keywords: [
    'serralheria {cidade}',
    'portão de ferro',
    'estrutura metálica',
    'serralheiro',
    'grades de proteção',
  ],
  whatsappMessage: 'Olá! Vi o site da {empresa} e gostaria de um orçamento.',
  comparison: {
    title: 'Serralheria profissional faz diferença',
    left: {
      title: 'Serviço improvisado',
      items: ['Medida "no olho"', 'Solda aparente e pintura fraca', 'Prazo que não fecha', 'Sem garantia'],
    },
    right: {
      title: 'Com a {empresa}',
      items: [
        'Visita técnica e medida exata',
        'Acabamento eletrostático',
        'Prazo combinado em contrato',
        'Instalação garantida',
      ],
    },
  },
  seoDescription: [
    '{empresa}: serralheria em {cidade}. Portões, grades, estruturas metálicas, escadas e esquadrias sob medida. Orçamento pelo WhatsApp.',
  ],
};

export const arquitetura: SegmentCopy = {
  segment: 'arquitetura',
  themes: ['architecture', 'editorial', 'minimal-light'],
  layouts: ['editorial', 'showcase', 'impact'],
  placeholderStyle: 'blueprint',
  hero: {
    eyebrow: ['Escritório de arquitetura', 'Arquitetura e interiores em {cidade}', 'Projetos autorais'],
    headline: [
      'Espaços que contam a *sua* história.',
      'Arquitetura com propósito, do conceito à *obra*.',
      'Projetos pensados para quem vai *viver* neles.',
    ],
    sub: [
      'A {empresa} desenvolve projetos residenciais, comerciais e de interiores em {cidade}, unindo estética, funcionalidade e execução cuidadosa.',
      'Cada projeto começa com escuta. Entendemos como você vive e trabalha para desenhar espaços que fazem sentido no dia a dia.',
    ],
    badges: ['Projeto completo', 'Acompanhamento de obra', 'Interiores'],
  },
  cta: {
    primary: ['Agendar conversa', 'Falar com o escritório'],
    secondary: ['Ver projetos', 'Conhecer o processo'],
  },
  manifesto: [
    'Acreditamos que bom projeto é o que desaparece: você só sente que tudo está no *lugar certo*.',
    'Luz, proporção e materiais honestos. O resto é *consequência*.',
  ],
  about: {
    eyebrow: 'O escritório',
    title: ['Arquitetura feita de *escuta* e detalhe.', 'Um estúdio, muitas histórias.'],
    paragraphs: [
      [
        'A {empresa} é um escritório de arquitetura em {cidade} que atua em projetos residenciais, comerciais e de interiores, com acompanhamento do início ao fim.',
        'Nosso método combina pesquisa, desenho e presença em obra. Acreditamos que arquitetura de qualidade nasce de decisões bem fundamentadas e de uma execução acompanhada de perto.',
      ],
      [
        'Há {anos} anos desenhamos espaços em {cidade} e região. Cada projeto é tratado como único, com soluções que respeitam o terreno, o orçamento e a forma de viver de cada cliente.',
        'Trabalhamos com uma rede de fornecedores e engenheiros parceiros para que o que está no papel chegue à obra com fidelidade.',
      ],
    ],
    highlights: [
      { title: 'Projeto autoral', text: 'Nada de soluções copiadas.' },
      { title: 'Compatibilização', text: 'Projetos integrados, menos retrabalho.' },
      { title: 'Acompanhamento', text: 'Presença em obra até a entrega.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Serviços',
    title: ['Do *conceito* à entrega das chaves'],
    intro: ['Atuamos em todas as etapas, com a profundidade que cada projeto exige.'],
  },
  services: [
    {
      title: 'Projeto arquitetônico',
      description: 'Estudo preliminar, anteprojeto, projeto legal e executivo para residências e comércios.',
      icon: 'compass',
    },
    {
      title: 'Design de interiores',
      description: 'Layout, iluminação, marcenaria e especificação de acabamentos e mobiliário.',
      icon: 'pen-tool',
    },
    {
      title: 'Reformas',
      description: 'Transformação de espaços existentes com planejamento e mínimo transtorno.',
      icon: 'hammer',
    },
    {
      title: 'Projetos comerciais',
      description: 'Lojas, clínicas, escritórios e restaurantes que traduzem a identidade da marca.',
      icon: 'building',
    },
    {
      title: 'Acompanhamento de obra',
      description: 'Visitas técnicas, gestão de fornecedores e controle de qualidade da execução.',
      icon: 'eye',
    },
    {
      title: 'Consultoria',
      description: 'Análise de imóvel, viabilidade e orientação de projeto por hora.',
      icon: 'file-text',
    },
  ],
  benefitsHead: {
    eyebrow: 'Método',
    title: ['Por que trabalhar com a *{empresa}*'],
    intro: ['O que garante que o projeto saia do papel como foi imaginado.'],
  },
  benefits: [
    {
      title: 'Briefing profundo',
      description: 'Começamos entendendo rotina, desejos e restrições antes de qualquer traço.',
      icon: 'users',
    },
    {
      title: 'Visualização 3D',
      description: 'Você vê o projeto antes de construir e decide com segurança.',
      icon: 'eye',
    },
    {
      title: 'Projetos compatibilizados',
      description: 'Arquitetura, estrutura e instalações integradas para evitar surpresas.',
      icon: 'layers',
    },
    {
      title: 'Transparência de custos',
      description: 'Especificações claras para orçar a obra com precisão.',
      icon: 'file-text',
    },
  ],
  processHead: {
    eyebrow: 'Processo',
    title: ['Como o projeto *acontece*'],
    intro: ['Etapas claras, com entregas e aprovações em cada fase.'],
  },
  steps: [
    {
      title: 'Conversa inicial',
      description: 'Entendemos o imóvel, as necessidades e o investimento previsto.',
    },
    {
      title: 'Estudo preliminar',
      description: 'Primeiras propostas de layout e volumetria para alinhar direção.',
    },
    { title: 'Projeto executivo', description: 'Detalhamento completo para orçamento e execução da obra.' },
    { title: 'Obra acompanhada', description: 'Visitas periódicas e suporte à equipe de execução.' },
  ],
  faqs: [
    {
      question: 'Quanto custa um projeto de arquitetura?',
      answer:
        'O valor depende da área, da complexidade e das etapas contratadas. Após a conversa inicial, enviamos uma proposta clara e detalhada.',
    },
    {
      question: 'Vocês acompanham a obra?',
      answer:
        'Sim. Oferecemos acompanhamento técnico com visitas programadas e suporte aos profissionais da execução.',
    },
    {
      question: 'Fazem projeto de interiores separado?',
      answer:
        'Sim. O projeto de interiores pode ser contratado de forma independente, para imóveis novos ou reformas.',
    },
    {
      question: 'Quanto tempo leva um projeto residencial?',
      answer:
        'Em média, de 2 a 4 meses entre estudo preliminar e projeto executivo, variando com o porte e o ritmo de aprovações.',
    },
    {
      question: 'Atendem em outras cidades?',
      answer: 'Atendemos {cidade} e região, e projetos em outras localidades mediante consulta.',
    },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de escritório' },
    { value: '120', suffix: '+', label: 'projetos desenvolvidos' },
    { value: '40', suffix: 'mil m²', label: 'projetados' },
    { value: '100', suffix: '%', label: 'projetos autorais' },
  ],
  testimonialsHead: { eyebrow: 'Clientes', title: ['O que dizem sobre *trabalhar conosco*'] },
  testimonials: [
    {
      quote: 'Entenderam exatamente como a gente queria morar. A casa ficou melhor do que imaginávamos.',
      author: 'Família cliente',
      role: 'Residência em {cidade}',
      rating: 5,
    },
    {
      quote: 'O acompanhamento de obra evitou vários erros. Valeu cada centavo.',
      author: 'Cliente',
      role: 'Reforma de apartamento',
      rating: 5,
    },
    {
      quote: 'Projeto comercial entregue no prazo e com identidade. A loja virou referência.',
      author: 'Empresária',
      role: 'Loja em {cidade}',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Portfólio',
    title: ['Projetos *selecionados*'],
    intro: ['Residências, interiores e espaços comerciais.'],
  },
  projects: [
    {
      title: 'Casa entre árvores',
      category: 'Residencial',
      description: 'Residência térrea integrada ao terreno.',
    },
    { title: 'Apartamento luz', category: 'Interiores', description: 'Reforma com integração de ambientes.' },
    { title: 'Café de bairro', category: 'Comercial', description: 'Projeto de interiores para cafeteria.' },
    {
      title: 'Clínica integrada',
      category: 'Comercial',
      description: 'Recepção e consultórios com conforto acústico.',
    },
    {
      title: 'Cobertura urbana',
      category: 'Interiores',
      description: 'Terraço e living com marcenaria sob medida.',
    },
    { title: 'Casa pátio', category: 'Residencial', description: 'Volumes em torno de um jardim central.' },
  ],
  finalCta: {
    eyebrow: 'Próximo passo',
    title: ['Vamos conversar sobre o seu *projeto*?'],
    text: ['Conte um pouco sobre o imóvel e o que você imagina. Respondemos com os próximos passos.'],
  },
  contactIntro: ['Atendemos com hora marcada no escritório ou por videochamada.'],
  marquee: ['Residencial', 'Interiores', 'Comercial', 'Reformas', 'Acompanhamento de obra'],
  keywords: [
    'arquiteto {cidade}',
    'escritório de arquitetura',
    'projeto de interiores',
    'projeto residencial',
    'reforma',
  ],
  whatsappMessage: 'Olá! Vi o site da {empresa} e gostaria de conversar sobre um projeto.',
  seoDescription: [
    '{empresa}: escritório de arquitetura e interiores em {cidade}. Projetos residenciais, comerciais e acompanhamento de obra.',
  ],
};

export const restaurante: SegmentCopy = {
  segment: 'restaurante',
  themes: ['luxury-dark', 'editorial', 'local-business'],
  layouts: ['impact', 'local', 'editorial'],
  placeholderStyle: 'organic',
  hero: {
    eyebrow: ['Restaurante em {cidade}', 'Cozinha de verdade', 'Reserve sua mesa'],
    headline: [
      'Comida feita com *tempo* e com afeto.',
      'Sabores que fazem você *voltar*.',
      'A mesa que {cidade} *comenta*.',
    ],
    sub: [
      'Ingredientes frescos, receitas da casa e um ambiente para ficar. A {empresa} é o lugar certo para o almoço de todo dia e o jantar especial.',
      'Pratos preparados na hora, carta de bebidas selecionada e atendimento que cuida de você. Venha conhecer a {empresa}.',
    ],
    badges: ['Reservas pelo WhatsApp', 'Delivery e retirada', 'Ambiente climatizado'],
  },
  cta: { primary: ['Reservar mesa', 'Pedir pelo WhatsApp'], secondary: ['Ver cardápio', 'Como chegar'] },
  manifesto: [
    'Não acreditamos em pressa na cozinha. Acreditamos em *panela* no fogo e gente feliz na mesa.',
    'Cada prato é uma conversa entre ingrediente, técnica e *memória*.',
  ],
  about: {
    eyebrow: 'Nossa história',
    title: ['Uma cozinha com *alma*.', 'Feito em casa, servido com orgulho.'],
    paragraphs: [
      [
        'A {empresa} nasceu da vontade de servir, em {cidade}, a comida que a gente gosta de comer: honesta, saborosa e sem frescura.',
        'Trabalhamos com fornecedores locais, produção própria e uma equipe que trata cada mesa como se fosse a da própria família.',
      ],
      [
        'Há {anos} anos a {empresa} é ponto de encontro em {cidade}. Do almoço executivo ao jantar de comemoração, a cozinha segue a mesma regra: fazer bem feito.',
        'Nosso cardápio muda com as estações e com as melhores compras da semana, mas os clássicos da casa nunca saem.',
      ],
    ],
    highlights: [
      { title: 'Ingredientes frescos', text: 'Compras diárias e produção própria.' },
      { title: 'Ambiente acolhedor', text: 'Para almoços rápidos e noites longas.' },
      { title: 'Eventos', text: 'Espaço para grupos e comemorações.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Experiências',
    title: ['Muito além do *prato*'],
    intro: ['Jeitos diferentes de aproveitar a {empresa}.'],
  },
  services: [
    {
      title: 'Almoço executivo',
      description: 'Opções do dia com entrada, prato e sobremesa, servidas com agilidade.',
      icon: 'utensils',
    },
    {
      title: 'Jantar à la carte',
      description: 'Cardápio completo com pratos da casa e sugestões do chef.',
      icon: 'chef-hat',
    },
    {
      title: 'Delivery e retirada',
      description: 'Os pratos da casa na sua mesa, com embalagem pensada para chegar bem.',
      icon: 'truck',
    },
    {
      title: 'Eventos e grupos',
      description: 'Aniversários, confraternizações e reuniões com menu fechado.',
      icon: 'users',
    },
    {
      title: 'Carta de bebidas',
      description: 'Vinhos, cervejas artesanais e drinks autorais para acompanhar.',
      icon: 'glass-wine',
    },
    {
      title: 'Café e sobremesas',
      description: 'Doces da casa e café especial para fechar com chave de ouro.',
      icon: 'coffee',
    },
  ],
  benefitsHead: {
    eyebrow: 'Por que vir',
    title: ['Motivos para *reservar* hoje'],
    intro: ['O que faz a {empresa} ser diferente.'],
  },
  benefits: [
    {
      title: 'Feito na hora',
      description: 'Nada pré-pronto: cada prato sai da cozinha quando você pede.',
      icon: 'chef-hat',
    },
    {
      title: 'Atendimento atencioso',
      description: 'Equipe que conhece o cardápio e cuida da sua mesa.',
      icon: 'smile',
    },
    {
      title: 'Localização fácil',
      description: 'Estacionamento próximo e acesso simples em {cidade}.',
      icon: 'pin',
    },
    {
      title: 'Opções para todos',
      description: 'Pratos vegetarianos, infantis e adaptações sob consulta.',
      icon: 'heart',
    },
  ],
  processHead: { eyebrow: 'Reservas', title: ['Garanta sua *mesa* em 3 passos'], intro: ['Simples assim.'] },
  steps: [
    { title: 'Chame no WhatsApp', description: 'Informe data, horário e número de pessoas.' },
    { title: 'Confirmação', description: 'Confirmamos a disponibilidade em poucos minutos.' },
    { title: 'Aproveite', description: 'Chegue e a mesa estará esperando por você.' },
  ],
  faqs: [
    {
      question: 'Precisa reservar?',
      answer:
        'Para jantares e fins de semana recomendamos reservar pelo WhatsApp. No almoço, atendemos por ordem de chegada.',
    },
    {
      question: 'Fazem delivery?',
      answer: 'Sim. Peça pelo WhatsApp ou pelos aplicativos de entrega disponíveis na sua região.',
    },
    {
      question: 'Têm opções vegetarianas?',
      answer: 'Sim, temos pratos vegetarianos fixos no cardápio e adaptamos outros sob consulta.',
    },
    {
      question: 'Aceitam grupos grandes?',
      answer: 'Sim. Para grupos acima de 10 pessoas, montamos um menu fechado. Fale com a gente.',
    },
    {
      question: 'Qual o horário de funcionamento?',
      answer: 'Consulte os horários atualizados na seção de contato ou no nosso Instagram.',
    },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de casa' },
    { value: '50', suffix: '+', label: 'pratos no cardápio' },
    { value: '4.9', suffix: '★', label: 'avaliação média' },
    { value: '100', suffix: '%', label: 'produção própria' },
  ],
  testimonialsHead: { eyebrow: 'Avaliações', title: ['Quem comeu *aprovou*'] },
  testimonials: [
    {
      quote: 'Melhor almoço de {cidade}. Comida caseira com apresentação de restaurante.',
      author: 'Cliente frequente',
      rating: 5,
    },
    {
      quote: 'Fizemos o aniversário da minha mãe lá. Atendimento impecável e todo mundo elogiou a comida.',
      author: 'Cliente',
      role: 'Evento em família',
      rating: 5,
    },
    {
      quote: 'O delivery chega quente e bem embalado. Virou nosso programa de sexta.',
      author: 'Cliente',
      role: 'Delivery',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Cardápio',
    title: ['Destaques da *casa*'],
    intro: ['Alguns dos pratos mais pedidos.'],
  },
  projects: [
    { title: 'Prato da casa', category: 'Principal', description: 'A receita que deu nome à {empresa}.' },
    { title: 'Entrada para compartilhar', category: 'Entrada', description: 'Para começar bem a mesa.' },
    { title: 'Sobremesa do dia', category: 'Sobremesa', description: 'Feita todas as manhãs.' },
    { title: 'Drink autoral', category: 'Bebidas', description: 'Criação do nosso bar.' },
  ],
  finalCta: {
    eyebrow: 'Reserve',
    title: ['Sua mesa está *esperando*'],
    text: ['Chame no WhatsApp e garanta seu lugar hoje mesmo.'],
  },
  contactIntro: ['Reservas, delivery e eventos pelo WhatsApp.'],
  marquee: ['Almoço', 'Jantar', 'Delivery', 'Eventos', 'Drinks', 'Sobremesas'],
  keywords: ['restaurante {cidade}', 'almoço executivo', 'delivery', 'reserva de mesa', 'jantar'],
  whatsappMessage: 'Olá! Gostaria de fazer uma reserva na {empresa}.',
  seoDescription: [
    '{empresa}: restaurante em {cidade} com comida feita na hora, delivery e reservas pelo WhatsApp.',
  ],
};

export const buffet: SegmentCopy = {
  segment: 'buffet',
  themes: ['luxury-dark', 'editorial', 'minimal-light'],
  layouts: ['impact', 'editorial', 'trust'],
  placeholderStyle: 'organic',
  hero: {
    eyebrow: ['Buffet e eventos em {cidade}', 'Casamentos · Corporativo · Festas', 'Eventos inesquecíveis'],
    headline: [
      'Eventos que seus convidados vão *lembrar*.',
      'Gastronomia e serviço à altura do seu *momento*.',
      'Do casamento ao corporativo, tudo *impecável*.',
    ],
    sub: [
      'A {empresa} cuida de cardápio, equipe, montagem e serviço para que você aproveite o evento como convidado. Atendemos {cidade} e região.',
      'Menus personalizados, equipe treinada e logística completa. Casamentos, aniversários, formaturas e eventos corporativos com a assinatura {empresa}.',
    ],
    badges: ['Degustação', 'Equipe completa', 'Cardápio personalizado'],
  },
  cta: {
    primary: ['Solicitar orçamento', 'Agendar degustação'],
    secondary: ['Ver cardápios', 'Conhecer eventos'],
  },
  manifesto: [
    'Um evento perfeito é aquele em que o anfitrião também *aproveita*.',
    'Cuidamos de cada detalhe para que o seu único trabalho seja *celebrar*.',
  ],
  about: {
    eyebrow: 'Sobre a {empresa}',
    title: ['Experiência em servir *momentos*.', 'Gastronomia e organização de eventos.'],
    paragraphs: [
      [
        'A {empresa} é especializada em buffet para eventos sociais e corporativos em {cidade}. Da degustação ao último brinde, cuidamos de cardápio, equipe e montagem.',
        'Trabalhamos com cozinha própria, ingredientes selecionados e um time que já serviu centenas de eventos com o mesmo cuidado.',
      ],
      [
        'Há {anos} anos a {empresa} transforma festas em {cidade} em memórias. Cada evento recebe um cardápio pensado para o perfil dos convidados e para o estilo da celebração.',
        'Atendemos desde eventos íntimos até grandes recepções, sempre com logística própria e equipe uniformizada.',
      ],
    ],
    highlights: [
      { title: 'Cardápio personalizado', text: 'Montado com você na degustação.' },
      { title: 'Equipe própria', text: 'Garçons, cozinha e coordenação.' },
      { title: 'Logística completa', text: 'Louças, montagem e desmontagem.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Eventos',
    title: ['Para cada *celebração*, um serviço'],
    intro: ['Sociais, corporativos e íntimos.'],
  },
  services: [
    {
      title: 'Casamentos',
      description: 'Coquetel, jantar servido ou buffet, bolo e mesa de doces com planejamento completo.',
      icon: 'heart',
    },
    {
      title: 'Eventos corporativos',
      description: 'Coffee break, almoços, confraternizações e lançamentos para empresas.',
      icon: 'briefcase',
    },
    {
      title: 'Aniversários e 15 anos',
      description: 'Festas com cardápio adaptado à idade e ao estilo dos convidados.',
      icon: 'cake',
    },
    {
      title: 'Formaturas',
      description: 'Serviço completo para grandes públicos com agilidade e organização.',
      icon: 'award',
    },
    {
      title: 'Eventos íntimos',
      description: 'Jantares e reuniões em casa com chef e equipe de serviço.',
      icon: 'users',
    },
    {
      title: 'Coquetel e finger food',
      description: 'Canapés, estações gastronômicas e drinks para eventos em pé.',
      icon: 'glass-wine',
    },
  ],
  benefitsHead: {
    eyebrow: 'Diferenciais',
    title: ['Por que escolher a *{empresa}*'],
    intro: ['O que você ganha ao contratar um buffet profissional.'],
  },
  benefits: [
    {
      title: 'Degustação antes de decidir',
      description: 'Prove o cardápio e ajuste tudo com a nossa equipe.',
      icon: 'chef-hat',
    },
    {
      title: 'Coordenação no dia',
      description: 'Um responsável acompanha o evento do início ao fim.',
      icon: 'users',
    },
    {
      title: 'Flexibilidade de cardápio',
      description: 'Opções para restrições alimentares e preferências.',
      icon: 'heart',
    },
    {
      title: 'Transparência',
      description: 'Proposta detalhada por pessoa, sem custos escondidos.',
      icon: 'file-text',
    },
  ],
  processHead: {
    eyebrow: 'Como funciona',
    title: ['Do primeiro contato ao *brinde*'],
    intro: ['Planejamento sem estresse.'],
  },
  steps: [
    { title: 'Briefing', description: 'Data, local, número de convidados e estilo do evento.' },
    { title: 'Proposta', description: 'Cardápios sugeridos com valores por pessoa.' },
    { title: 'Degustação', description: 'Você prova e ajusta cada detalhe.' },
    { title: 'O grande dia', description: 'Montagem, serviço e desmontagem por nossa conta.' },
  ],
  faqs: [
    {
      question: 'Qual o número mínimo de convidados?',
      answer:
        'Atendemos eventos a partir de 20 pessoas. Para grupos menores, consulte nossos serviços de chef em casa.',
    },
    {
      question: 'A degustação é gratuita?',
      answer:
        'A degustação é oferecida para eventos acima de um número mínimo de convidados. Consulte as condições.',
    },
    {
      question: 'Vocês fornecem louças e equipe?',
      answer: 'Sim. Louças, talheres, equipe de serviço e coordenação estão incluídos na proposta.',
    },
    {
      question: 'Atendem em qualquer local?',
      answer: 'Atendemos em salões, casas, sítios e espaços corporativos em {cidade} e região.',
    },
    {
      question: 'Com quanta antecedência devo contratar?',
      answer:
        'Recomendamos de 3 a 6 meses para casamentos e grandes eventos, e 30 dias para eventos corporativos.',
    },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de eventos' },
    { value: '800', suffix: '+', label: 'eventos realizados' },
    { value: '150', suffix: 'mil', label: 'convidados servidos' },
    { value: '5', suffix: '★', label: 'avaliação média' },
  ],
  testimonialsHead: { eyebrow: 'Depoimentos', title: ['Anfitriões que *confiaram*'] },
  testimonials: [
    {
      quote:
        'Nosso casamento foi perfeito. A comida foi o assunto da festa e a equipe, invisível e impecável.',
      author: 'Noivos',
      role: 'Casamento em {cidade}',
      rating: 5,
    },
    {
      quote: 'Contratamos para a confraternização da empresa e todos elogiaram. Já reservamos o próximo.',
      author: 'Gerente de RH',
      role: 'Evento corporativo',
      rating: 5,
    },
    {
      quote: 'Cuidaram de tudo. Eu só aproveitei a festa da minha filha.',
      author: 'Mãe da aniversariante',
      role: 'Festa de 15 anos',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Eventos',
    title: ['Momentos que *servimos*'],
    intro: ['Uma amostra dos nossos eventos.'],
  },
  projects: [
    {
      title: 'Casamento ao ar livre',
      category: 'Social',
      description: 'Jantar servido para 200 convidados.',
    },
    {
      title: 'Confraternização corporativa',
      category: 'Corporativo',
      description: 'Coquetel e estações para 300 pessoas.',
    },
    { title: 'Festa de 15 anos', category: 'Social', description: 'Buffet e mesa de doces.' },
    { title: 'Jantar íntimo', category: 'Chef em casa', description: 'Menu degustação para 12 pessoas.' },
  ],
  finalCta: {
    eyebrow: 'Seu evento',
    title: ['Vamos planejar o seu *evento*?'],
    text: ['Conte a data e o número de convidados. Enviamos uma proposta personalizada.'],
  },
  contactIntro: ['Orçamentos e degustações pelo WhatsApp ou formulário.'],
  marquee: ['Casamentos', 'Corporativo', 'Aniversários', 'Formaturas', 'Coquetéis'],
  keywords: ['buffet {cidade}', 'buffet para casamento', 'buffet corporativo', 'eventos', 'coffee break'],
  whatsappMessage: 'Olá! Gostaria de um orçamento de buffet com a {empresa}.',
  seoDescription: [
    '{empresa}: buffet para casamentos, eventos corporativos e festas em {cidade}. Cardápio personalizado e equipe completa.',
  ],
};

export const oficina: SegmentCopy = {
  segment: 'oficina',
  themes: ['automotive', 'industrial', 'high-contrast'],
  layouts: ['trust', 'local', 'impact'],
  placeholderStyle: 'diagonal',
  hero: {
    eyebrow: ['Oficina mecânica em {cidade}', 'Mecânica · Elétrica · Injeção', 'Seu carro em boas mãos'],
    headline: [
      'Seu carro de volta à rua, *sem dor de cabeça*.',
      'Diagnóstico honesto, conserto *bem feito*.',
      'Manutenção com confiança em *{cidade}*.',
    ],
    sub: [
      'A {empresa} faz revisão, mecânica geral, elétrica e injeção eletrônica com diagnóstico transparente e orçamento aprovado antes de qualquer serviço.',
      'Equipamentos modernos, peças de qualidade e mecânicos experientes. Na {empresa}, você sabe exatamente o que está sendo feito no seu carro.',
    ],
    badges: ['Orçamento antes do serviço', 'Garantia nos serviços', 'Agendamento pelo WhatsApp'],
  },
  cta: { primary: ['Agendar revisão', 'Falar no WhatsApp'], secondary: ['Ver serviços', 'Como chegar'] },
  manifesto: [
    'Explicar o problema em linguagem simples e cobrar o justo. É assim que uma oficina conquista *confiança*.',
    'Carro bem cuidado não dá surpresa. Nossa missão é manter o seu *rodando*.',
  ],
  about: {
    eyebrow: 'Sobre a {empresa}',
    title: ['Mecânica de *confiança* em {cidade}.', 'Transparência em cada serviço.'],
    paragraphs: [
      [
        'A {empresa} é uma oficina mecânica em {cidade} que atende carros nacionais e importados com diagnóstico computadorizado e equipe especializada.',
        'Aqui você recebe o orçamento detalhado antes do serviço, acompanha o andamento pelo WhatsApp e leva o carro com garantia.',
      ],
      [
        'Há {anos} anos cuidando dos carros de {cidade}, construímos uma base de clientes fiéis que voltam porque confiam. Sem empurrar serviço, sem peça desnecessária.',
        'Investimos em ferramentas e treinamento constante para atender os veículos mais modernos com segurança.',
      ],
    ],
    highlights: [
      { title: 'Diagnóstico computadorizado', text: 'Scanner para todas as marcas.' },
      { title: 'Peças de qualidade', text: 'Originais ou de primeira linha.' },
      { title: 'Garantia', text: 'Em peças e mão de obra.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Serviços',
    title: ['Tudo que seu carro *precisa*'],
    intro: ['Da revisão periódica ao reparo complexo.'],
  },
  services: [
    {
      title: 'Revisão preventiva',
      description: 'Checklist completo, troca de óleo e filtros, e relatório do estado do veículo.',
      icon: 'check-circle',
    },
    {
      title: 'Mecânica geral',
      description: 'Motor, câmbio, embreagem, correias e suspensão com peças de qualidade.',
      icon: 'wrench',
    },
    {
      title: 'Elétrica e injeção',
      description: 'Diagnóstico por scanner, módulos, sensores, alternador e bateria.',
      icon: 'zap',
    },
    {
      title: 'Freios',
      description: 'Pastilhas, discos, fluido e sistema ABS com teste de segurança.',
      icon: 'shield',
    },
    {
      title: 'Suspensão e alinhamento',
      description: 'Amortecedores, buchas, alinhamento e balanceamento.',
      icon: 'gauge',
    },
    {
      title: 'Ar-condicionado',
      description: 'Higienização, carga de gás e reparo do sistema.',
      icon: 'wind',
    },
  ],
  benefitsHead: {
    eyebrow: 'Por que a {empresa}',
    title: ['Oficina que você *recomenda*'],
    intro: ['O que muda quando a oficina é séria.'],
  },
  benefits: [
    {
      title: 'Orçamento aprovado antes',
      description: 'Nada é feito sem o seu OK. Sem surpresa na conta.',
      icon: 'file-text',
    },
    {
      title: 'Acompanhamento por foto',
      description: 'Você recebe fotos das peças trocadas e do serviço.',
      icon: 'camera',
    },
    { title: 'Prazo combinado', description: 'Informamos o tempo de serviço e cumprimos.', icon: 'clock' },
    { title: 'Garantia real', description: 'Serviços com garantia em peças e mão de obra.', icon: 'shield' },
  ],
  processHead: {
    eyebrow: 'Como funciona',
    title: ['Simples e *transparente*'],
    intro: ['Em quatro passos seu carro está de volta.'],
  },
  steps: [
    { title: 'Agende', description: 'Chame no WhatsApp e escolha o melhor horário.' },
    { title: 'Diagnóstico', description: 'Avaliamos o veículo e enviamos orçamento detalhado.' },
    { title: 'Aprovação e serviço', description: 'Com seu OK, executamos com peças de qualidade.' },
    { title: 'Entrega', description: 'Teste final e carro pronto, com garantia.' },
  ],
  faqs: [
    {
      question: 'Precisa agendar?',
      answer:
        'Recomendamos agendar pelo WhatsApp para garantir atendimento rápido, mas também recebemos sem hora marcada.',
    },
    {
      question: 'Vocês cobram pelo diagnóstico?',
      answer:
        'O diagnóstico básico é gratuito quando o serviço é feito conosco. Consulte para casos específicos.',
    },
    {
      question: 'Atendem carros importados?',
      answer: 'Sim, atendemos nacionais e importados com scanner e peças compatíveis.',
    },
    {
      question: 'Qual a garantia dos serviços?',
      answer:
        'Oferecemos garantia em peças e mão de obra. O prazo varia conforme o serviço e é informado no orçamento.',
    },
    {
      question: 'Têm serviço de leva e traz?',
      answer: 'Consulte a disponibilidade de leva e traz para a sua região em {cidade}.',
    },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de oficina' },
    { value: '10', suffix: 'mil', label: 'carros atendidos' },
    { value: '98', suffix: '%', label: 'clientes que voltam' },
    { value: '4.9', suffix: '★', label: 'avaliação no Google' },
  ],
  testimonialsHead: { eyebrow: 'Clientes', title: ['Quem já deixou o carro *com a gente*'] },
  testimonials: [
    {
      quote: 'Explicaram tudo com calma, mandaram foto das peças e cobraram exatamente o que combinaram.',
      author: 'Cliente',
      role: 'Revisão completa',
      rating: 5,
    },
    {
      quote: 'Resolveram um problema elétrico que duas oficinas não acharam. Virei cliente fixo.',
      author: 'Cliente',
      role: 'Elétrica',
      rating: 5,
    },
    { quote: 'Oficina honesta é raro. Essa é.', author: 'Cliente', role: '{cidade}', rating: 5 },
  ],
  projectsHead: {
    eyebrow: 'Estrutura',
    title: ['Nossa *oficina*'],
    intro: ['Equipamentos e espaço preparados para o seu carro.'],
  },
  projects: [
    {
      title: 'Elevadores e boxes',
      category: 'Estrutura',
      description: 'Boxes equipados para atendimento rápido.',
    },
    { title: 'Scanner multimarcas', category: 'Diagnóstico', description: 'Leitura de módulos e sensores.' },
    { title: 'Alinhamento 3D', category: 'Equipamento', description: 'Precisão para suspensão e direção.' },
    { title: 'Recepção', category: 'Atendimento', description: 'Espaço confortável para esperar.' },
  ],
  finalCta: {
    eyebrow: 'Agende agora',
    title: ['Seu carro merece uma oficina de *confiança*'],
    text: ['Chame no WhatsApp e agende a revisão ou o diagnóstico.'],
  },
  contactIntro: ['Agendamentos e dúvidas pelo WhatsApp.'],
  marquee: ['Revisão', 'Mecânica', 'Elétrica', 'Freios', 'Suspensão', 'Ar-condicionado'],
  keywords: [
    'oficina mecânica {cidade}',
    'mecânico',
    'revisão de carro',
    'injeção eletrônica',
    'auto elétrica',
  ],
  whatsappMessage: 'Olá! Gostaria de agendar um serviço na {empresa}.',
  comparison: {
    title: 'A diferença de uma oficina séria',
    left: {
      title: 'Oficina comum',
      items: [
        'Orçamento "mais ou menos"',
        'Serviço sem explicação',
        'Peça trocada sem mostrar',
        'Prazo indefinido',
      ],
    },
    right: {
      title: 'Na {empresa}',
      items: [
        'Orçamento detalhado por escrito',
        'Explicação clara do problema',
        'Fotos das peças trocadas',
        'Prazo combinado e garantia',
      ],
    },
  },
  seoDescription: [
    '{empresa}: oficina mecânica em {cidade}. Revisão, mecânica geral, elétrica, injeção e freios com orçamento transparente.',
  ],
};
