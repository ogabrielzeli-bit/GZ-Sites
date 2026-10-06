import type { SegmentCopy } from './types';

export const loja: SegmentCopy = {
  segment: 'loja',
  themes: ['ecommerce', 'local-business', 'minimal-light'],
  layouts: ['catalog', 'local', 'trust'],
  placeholderStyle: 'geometric',
  hero: {
    eyebrow: ['Loja em {cidade}', 'Variedade · Preço · Atendimento', 'Visite ou peça pelo WhatsApp'],
    headline: [
      'Tudo que você procura, *pertinho* de você.',
      'Variedade, preço justo e atendimento de *verdade*.',
      'A loja que {cidade} *conhece*.',
    ],
    sub: [
      'A {empresa} tem os produtos que você precisa com preço justo e entrega em {cidade}. Peça pelo WhatsApp ou visite a loja.',
      'Estoque sempre renovado, marcas de confiança e uma equipe que ajuda a escolher. Esse é o jeito {empresa} de atender.',
    ],
    badges: ['Entrega em {cidade}', 'Parcelamento', 'Troca garantida'],
  },
  cta: { primary: ['Pedir pelo WhatsApp', 'Ver produtos'], secondary: ['Como chegar', 'Ofertas'] },
  manifesto: [
    'Loja de bairro boa é a que lembra o seu nome e tem o que você *precisa*.',
    'Preço justo, produto bom e um *obrigado* de verdade.',
  ],
  about: {
    eyebrow: 'Sobre a {empresa}',
    title: ['Uma loja feita para *{cidade}*.', 'Atendimento de perto.'],
    paragraphs: [
      [
        'A {empresa} é uma loja em {cidade} com variedade de produtos, preço competitivo e atendimento próximo.',
        'Trabalhamos com marcas de confiança e renovamos o estoque toda semana para você sempre encontrar novidade.',
      ],
      [
        'Há {anos} anos atendendo {cidade}, a {empresa} cresceu com indicação de cliente para cliente. Atendimento pelo WhatsApp e entrega rápida fazem parte do dia a dia.',
        'Visite a loja ou peça online: a gente separa e entrega.',
      ],
    ],
    highlights: [
      { title: 'Variedade', text: 'Estoque renovado toda semana.' },
      { title: 'Entrega', text: 'Rápida em {cidade}.' },
      { title: 'Parcelamento', text: 'No cartão, sem complicação.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Categorias',
    title: ['O que você *encontra* na loja'],
    intro: ['Produtos selecionados para você.'],
  },
  services: [
    { title: 'Novidades', description: 'Lançamentos e tendências que acabaram de chegar.', icon: 'sparkles' },
    { title: 'Mais vendidos', description: 'Os produtos preferidos dos nossos clientes.', icon: 'star' },
    { title: 'Ofertas', description: 'Promoções da semana com desconto real.', icon: 'tag' },
    { title: 'Presentes', description: 'Opções para presentear com embalagem especial.', icon: 'package' },
    { title: 'Encomendas', description: 'Não achou? Encomendamos para você.', icon: 'truck' },
    { title: 'Atacado', description: 'Condições especiais para revendedores.', icon: 'shopping-bag' },
  ],
  benefitsHead: {
    eyebrow: 'Vantagens',
    title: ['Por que comprar na *{empresa}*'],
    intro: ['Mais motivos para visitar.'],
  },
  benefits: [
    { title: 'Atendimento que ajuda', description: 'Equipe que conhece cada produto.', icon: 'users' },
    { title: 'Preço justo', description: 'Sem truque: preço bom todo dia.', icon: 'tag' },
    { title: 'Entrega rápida', description: 'Peça pelo WhatsApp e receba em casa.', icon: 'truck' },
    { title: 'Troca garantida', description: 'Trocas simples em até 7 dias.', icon: 'check-circle' },
  ],
  processHead: {
    eyebrow: 'Como comprar',
    title: ['Pedido pelo WhatsApp em *3 passos*'],
    intro: ['Simples e rápido.'],
  },
  steps: [
    { title: 'Escolha', description: 'Veja os produtos aqui ou peça sugestões.' },
    { title: 'Confirme', description: 'Enviamos o valor e as formas de pagamento.' },
    { title: 'Receba', description: 'Entrega em {cidade} ou retirada na loja.' },
  ],
  faqs: [
    { question: 'Fazem entrega?', answer: 'Sim, entregamos em {cidade} e enviamos para outras cidades.' },
    { question: 'Quais formas de pagamento?', answer: 'Pix, cartão de crédito e débito, com parcelamento.' },
    { question: 'Posso trocar?', answer: 'Sim, trocas em até 7 dias com o produto sem uso e etiqueta.' },
    {
      question: 'Têm loja física?',
      answer: 'Sim, visite nosso endereço em {cidade}. Veja o mapa na seção de contato.',
    },
    { question: 'Vendem no atacado?', answer: 'Sim, consulte as condições para revendedores pelo WhatsApp.' },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de loja' },
    { value: '3', suffix: 'mil', label: 'produtos' },
    { value: '10', suffix: 'mil', label: 'clientes' },
    { value: '4.9', suffix: '★', label: 'avaliação' },
  ],
  testimonialsHead: { eyebrow: 'Clientes', title: ['Quem compra *volta*'] },
  testimonials: [
    {
      quote: 'Pedi pelo WhatsApp de manhã e à tarde já estava em casa. Atendimento nota 10.',
      author: 'Cliente',
      rating: 5,
    },
    {
      quote: 'Sempre tem novidade e o preço é melhor que no shopping.',
      author: 'Cliente',
      role: '{cidade}',
      rating: 5,
    },
    {
      quote: 'Me ajudaram a escolher o presente certo. Recomendo.',
      author: 'Cliente',
      role: 'Presentes',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Destaques',
    title: ['Produtos em *destaque*'],
    intro: ['Os queridinhos da semana.'],
  },
  projects: [
    { title: 'Lançamento da semana', category: 'Novidade', description: 'Acabou de chegar.' },
    { title: 'Mais vendido', category: 'Best-seller', description: 'O preferido dos clientes.' },
    { title: 'Oferta especial', category: 'Promoção', description: 'Por tempo limitado.' },
    { title: 'Kit presente', category: 'Presentes', description: 'Com embalagem especial.' },
  ],
  finalCta: {
    eyebrow: 'Fale com a gente',
    title: ['Peça agora pelo *WhatsApp*'],
    text: ['Mande o que você procura e a gente separa.'],
  },
  contactIntro: ['Pedidos e dúvidas pelo WhatsApp. Visite também a loja.'],
  marquee: ['Novidades', 'Ofertas', 'Presentes', 'Entrega', 'Parcelamento'],
  keywords: ['loja {cidade}', 'comprar em {cidade}', 'loja perto de mim', 'entrega', 'ofertas'],
  whatsappMessage: 'Olá! Vi o site da {empresa} e gostaria de fazer um pedido.',
  seoDescription: [
    '{empresa}: loja em {cidade} com variedade, preço justo e entrega rápida. Peça pelo WhatsApp.',
  ],
};

export const ecommerce: SegmentCopy = {
  segment: 'ecommerce',
  themes: ['ecommerce', 'minimal-light', 'high-contrast'],
  layouts: ['catalog', 'trust', 'showcase'],
  placeholderStyle: 'geometric',
  hero: {
    eyebrow: ['Loja online', 'Compre com segurança', 'Entrega para todo o Brasil'],
    headline: [
      'Compre online com *segurança* e receba em casa.',
      'Produtos selecionados, entrega *rápida*.',
      'A loja online que *entrega* o que promete.',
    ],
    sub: [
      'A {empresa} entrega para todo o Brasil com pagamento seguro, rastreio e troca fácil. Explore o catálogo e peça em poucos cliques.',
      'Curadoria de produtos, preços honestos e atendimento humano pelo WhatsApp. Compre na {empresa} sem medo.',
    ],
    badges: ['Pagamento seguro', 'Entrega para todo o Brasil', 'Troca fácil'],
  },
  cta: { primary: ['Ver catálogo', 'Comprar pelo WhatsApp'], secondary: ['Mais vendidos', 'Como funciona'] },
  manifesto: [
    'Comprar online tem que ser simples, seguro e *rápido*. O resto é desculpa.',
    'Produto bom, preço justo e *entrega* no prazo.',
  ],
  about: {
    eyebrow: 'Sobre a {empresa}',
    title: ['Uma loja online com *gente* por trás.', 'Curadoria, confiança e entrega.'],
    paragraphs: [
      [
        'A {empresa} é uma loja online que seleciona produtos de qualidade e entrega para todo o Brasil com rastreio e suporte humano.',
        'Pagamento seguro via Pix e cartão, troca facilitada e atendimento pelo WhatsApp em horário comercial.',
      ],
      [
        'Há {anos} anos vendendo online, a {empresa} construiu reputação com milhares de pedidos entregues e clientes que voltam.',
        'Estoque próprio, envio em até 24h úteis e embalagem cuidadosa.',
      ],
    ],
    highlights: [
      { title: 'Envio em 24h', text: 'Em dias úteis, após confirmação.' },
      { title: 'Pagamento seguro', text: 'Pix, cartão e boleto.' },
      { title: 'Troca fácil', text: 'Em até 7 dias.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Categorias',
    title: ['Navegue por *categoria*'],
    intro: ['Encontre o que procura.'],
  },
  services: [
    { title: 'Lançamentos', description: 'As novidades mais recentes da loja.', icon: 'sparkles' },
    { title: 'Mais vendidos', description: 'Os favoritos dos nossos clientes.', icon: 'star' },
    { title: 'Promoções', description: 'Descontos reais por tempo limitado.', icon: 'tag' },
    { title: 'Kits', description: 'Combos com preço especial.', icon: 'package' },
    { title: 'Presentes', description: 'Opções para presentear com embalagem.', icon: 'heart' },
    { title: 'Atacado', description: 'Condições para revendedores.', icon: 'shopping-bag' },
  ],
  benefitsHead: {
    eyebrow: 'Vantagens',
    title: ['Por que comprar na *{empresa}*'],
    intro: ['Segurança em cada etapa.'],
  },
  benefits: [
    { title: 'Compra segura', description: 'Pagamento protegido e dados criptografados.', icon: 'lock' },
    { title: 'Entrega rastreada', description: 'Código de rastreio em todos os pedidos.', icon: 'truck' },
    {
      title: 'Suporte humano',
      description: 'Atendimento pelo WhatsApp em horário comercial.',
      icon: 'message-circle',
    },
    { title: 'Troca e devolução', description: 'Política clara e sem burocracia.', icon: 'check-circle' },
  ],
  processHead: {
    eyebrow: 'Como funciona',
    title: ['Do pedido à *entrega*'],
    intro: ['Simples e transparente.'],
  },
  steps: [
    { title: 'Escolha', description: 'Navegue pelo catálogo e escolha.' },
    { title: 'Pague', description: 'Pix, cartão ou boleto com segurança.' },
    { title: 'Envio', description: 'Separamos e enviamos em até 24h úteis.' },
    { title: 'Receba', description: 'Acompanhe pelo rastreio e receba em casa.' },
  ],
  faqs: [
    {
      question: 'Qual o prazo de entrega?',
      answer: 'Depende da região. O prazo aparece na finalização da compra e enviamos em até 24h úteis.',
    },
    { question: 'Quais formas de pagamento?', answer: 'Pix, cartão de crédito em até 12x e boleto.' },
    {
      question: 'Como funciona a troca?',
      answer: 'Você tem 7 dias após o recebimento para solicitar troca ou devolução.',
    },
    {
      question: 'É seguro comprar?',
      answer: 'Sim. Usamos pagamento protegido e seus dados são criptografados.',
    },
    { question: 'Vendem no atacado?', answer: 'Sim, consulte condições especiais pelo WhatsApp.' },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos online' },
    { value: '50', suffix: 'mil', label: 'pedidos entregues' },
    { value: '24', suffix: 'h', label: 'para envio' },
    { value: '4.9', suffix: '★', label: 'avaliação' },
  ],
  testimonialsHead: { eyebrow: 'Avaliações', title: ['Clientes *satisfeitos*'] },
  testimonials: [
    {
      quote: 'Chegou antes do prazo e muito bem embalado. Já fiz o segundo pedido.',
      author: 'Cliente',
      rating: 5,
    },
    {
      quote: 'Precisei trocar e foi super simples. Atendimento rápido pelo WhatsApp.',
      author: 'Cliente',
      role: 'Troca',
      rating: 5,
    },
    { quote: 'Produto igual ao da foto e preço melhor que nos marketplaces.', author: 'Cliente', rating: 5 },
  ],
  projectsHead: { eyebrow: 'Destaques', title: ['*Mais vendidos*'], intro: ['Os queridinhos do momento.'] },
  projects: [
    { title: 'Produto destaque', category: 'Best-seller', description: 'O mais pedido do mês.' },
    { title: 'Lançamento', category: 'Novidade', description: 'Acabou de chegar.' },
    { title: 'Kit especial', category: 'Kit', description: 'Combo com desconto.' },
    { title: 'Promoção', category: 'Oferta', description: 'Por tempo limitado.' },
  ],
  finalCta: {
    eyebrow: 'Compre agora',
    title: ['Encontre o que você *procura*'],
    text: ['Fale com a gente pelo WhatsApp ou explore o catálogo.'],
  },
  contactIntro: ['Dúvidas, pedidos e trocas pelo WhatsApp.'],
  marquee: ['Envio rápido', 'Pagamento seguro', 'Troca fácil', 'Suporte humano'],
  keywords: ['loja online', 'comprar online', 'entrega para todo o Brasil', 'e-commerce', '{empresa}'],
  whatsappMessage: 'Olá! Vi o site da {empresa} e gostaria de fazer um pedido.',
  comparison: {
    title: 'Por que comprar direto da {empresa}',
    left: {
      title: 'Marketplace',
      items: ['Vendedor desconhecido', 'Suporte por robô', 'Embalagem genérica', 'Preço com comissão'],
    },
    right: {
      title: 'Na {empresa}',
      items: [
        'Loja com nome e endereço',
        'Atendimento humano no WhatsApp',
        'Embalagem cuidadosa',
        'Preço direto, sem intermediário',
      ],
    },
  },
  seoDescription: ['{empresa}: loja online com entrega para todo o Brasil, pagamento seguro e troca fácil.'],
};

export const servicos: SegmentCopy = {
  segment: 'servicos',
  themes: ['local-business', 'minimal-light', 'industrial'],
  layouts: ['local', 'trust', 'impact'],
  placeholderStyle: 'geometric',
  hero: {
    eyebrow: ['Serviços em {cidade}', 'Atendimento rápido e profissional', 'Orçamento pelo WhatsApp'],
    headline: [
      'Serviço bem feito, no *prazo* e sem dor de cabeça.',
      'Resolvemos o que você precisa, *hoje*.',
      'Profissionais de confiança em *{cidade}*.',
    ],
    sub: [
      'A {empresa} atende {cidade} e região com profissionais qualificados, orçamento transparente e garantia no serviço. Chame no WhatsApp.',
      'Atendimento rápido, preço justo e trabalho com garantia. Esse é o compromisso da {empresa} com cada cliente.',
    ],
    badges: ['Orçamento grátis', 'Garantia no serviço', 'Atendimento rápido'],
  },
  cta: { primary: ['Pedir orçamento', 'Chamar no WhatsApp'], secondary: ['Ver serviços', 'Como funciona'] },
  manifesto: [
    'Serviço bom é o que você não precisa chamar *de novo*.',
    'Chegar na hora, fazer bem feito e cobrar o *justo*.',
  ],
  about: {
    eyebrow: 'Sobre a {empresa}',
    title: ['Profissionais de *confiança* em {cidade}.', 'Qualidade em cada serviço.'],
    paragraphs: [
      [
        'A {empresa} é uma empresa de serviços em {cidade} que atende residências e empresas com equipe qualificada e orçamento transparente.',
        'Cada atendimento é feito com cuidado, pontualidade e garantia, porque sabemos que confiança se conquista no detalhe.',
      ],
      [
        'Há {anos} anos atendendo {cidade}, a {empresa} cresceu pela indicação de clientes satisfeitos. Pontualidade e trabalho bem feito são o nosso cartão de visita.',
        'Atendemos com agendamento rápido e emergências sob consulta.',
      ],
    ],
    highlights: [
      { title: 'Equipe qualificada', text: 'Profissionais treinados.' },
      { title: 'Orçamento claro', text: 'Sem surpresa no final.' },
      { title: 'Garantia', text: 'Em todos os serviços.' },
    ],
  },
  servicesHead: { eyebrow: 'Serviços', title: ['O que *fazemos*'], intro: ['Residencial e comercial.'] },
  services: [
    { title: 'Instalação', description: 'Instalação profissional com garantia e acabamento.', icon: 'tool' },
    { title: 'Manutenção', description: 'Preventiva e corretiva, com agendamento rápido.', icon: 'wrench' },
    { title: 'Reparos', description: 'Consertos com diagnóstico e orçamento prévio.', icon: 'hammer' },
    {
      title: 'Atendimento comercial',
      description: 'Contratos de manutenção para empresas.',
      icon: 'briefcase',
    },
    { title: 'Emergência', description: 'Atendimento prioritário sob consulta.', icon: 'zap' },
    { title: 'Consultoria', description: 'Avaliação e orientação técnica.', icon: 'file-text' },
  ],
  benefitsHead: {
    eyebrow: 'Diferenciais',
    title: ['Por que chamar a *{empresa}*'],
    intro: ['O que faz a diferença.'],
  },
  benefits: [
    { title: 'Pontualidade', description: 'Chegamos no horário combinado.', icon: 'clock' },
    {
      title: 'Orçamento sem compromisso',
      description: 'Avaliação e valor antes de começar.',
      icon: 'file-text',
    },
    { title: 'Garantia', description: 'Serviço garantido por escrito.', icon: 'shield' },
    { title: 'Limpeza e cuidado', description: 'Deixamos o local como encontramos.', icon: 'sparkles' },
  ],
  processHead: { eyebrow: 'Como funciona', title: ['Em *4 passos*'], intro: ['Sem complicação.'] },
  steps: [
    { title: 'Contato', description: 'Chame no WhatsApp e descreva o que precisa.' },
    { title: 'Orçamento', description: 'Enviamos valor e prazo.' },
    { title: 'Execução', description: 'Serviço feito por profissionais qualificados.' },
    { title: 'Garantia', description: 'Entrega com garantia e suporte.' },
  ],
  faqs: [
    { question: 'O orçamento é gratuito?', answer: 'Sim, o orçamento é gratuito e sem compromisso.' },
    {
      question: 'Atendem com urgência?',
      answer: 'Sim, consulte a disponibilidade para atendimento prioritário.',
    },
    {
      question: 'Qual a garantia?',
      answer: 'Todos os serviços têm garantia, com prazo informado no orçamento.',
    },
    { question: 'Atendem empresas?', answer: 'Sim, com contratos de manutenção e atendimento recorrente.' },
    {
      question: 'Quais formas de pagamento?',
      answer: 'Pix, cartão e transferência. Parcelamento sob consulta.',
    },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de experiência' },
    { value: '3', suffix: 'mil', label: 'atendimentos' },
    { value: '100', suffix: '%', label: 'com garantia' },
    { value: '4.9', suffix: '★', label: 'avaliação' },
  ],
  testimonialsHead: { eyebrow: 'Clientes', title: ['Quem já *contratou*'] },
  testimonials: [
    {
      quote: 'Chegaram no horário, fizeram rápido e deixaram tudo limpo. Recomendo.',
      author: 'Cliente',
      rating: 5,
    },
    {
      quote: 'Orçamento justo e serviço com garantia. Virei cliente.',
      author: 'Cliente',
      role: '{cidade}',
      rating: 5,
    },
    {
      quote: 'Atendem nossa empresa há anos. Nunca falharam.',
      author: 'Gerente',
      role: 'Cliente empresarial',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Trabalhos',
    title: ['Serviços *realizados*'],
    intro: ['Alguns dos nossos atendimentos.'],
  },
  projects: [
    {
      title: 'Instalação residencial',
      category: 'Residencial',
      description: 'Serviço completo com garantia.',
    },
    { title: 'Manutenção comercial', category: 'Comercial', description: 'Contrato mensal.' },
    { title: 'Reparo emergencial', category: 'Emergência', description: 'Atendido no mesmo dia.' },
    { title: 'Projeto completo', category: 'Residencial', description: 'Do orçamento à entrega.' },
  ],
  finalCta: {
    eyebrow: 'Fale conosco',
    title: ['Precisa de um serviço? *Resolvemos.*'],
    text: ['Chame no WhatsApp e receba o orçamento rapidinho.'],
  },
  contactIntro: ['Orçamentos e agendamentos pelo WhatsApp.'],
  marquee: ['Instalação', 'Manutenção', 'Reparos', 'Garantia', 'Pontualidade'],
  keywords: ['serviços {cidade}', 'prestador de serviços', 'manutenção', 'instalação', 'orçamento'],
  whatsappMessage: 'Olá! Gostaria de um orçamento com a {empresa}.',
  seoDescription: [
    '{empresa}: serviços profissionais em {cidade} com orçamento grátis, pontualidade e garantia.',
  ],
};

export const b2b: SegmentCopy = {
  segment: 'b2b',
  themes: ['minimal-light', 'architecture', 'high-contrast'],
  layouts: ['trust', 'editorial', 'impact'],
  placeholderStyle: 'grid',
  hero: {
    eyebrow: ['Soluções para empresas', 'Parceria estratégica', 'Resultados mensuráveis'],
    headline: [
      'Soluções que fazem sua empresa *crescer*.',
      'Parceria estratégica para *resultados* reais.',
      'Eficiência, escala e *confiança*.',
    ],
    sub: [
      'A {empresa} ajuda empresas em {cidade} e em todo o Brasil a operar melhor, com soluções sob medida, implementação rápida e suporte contínuo.',
      'Entendemos o seu negócio, desenhamos a solução e acompanhamos os resultados. É assim que a {empresa} trabalha.',
    ],
    badges: ['Atendimento dedicado', 'Implementação rápida', 'Suporte contínuo'],
  },
  cta: { primary: ['Agendar reunião', 'Falar com consultor'], secondary: ['Ver soluções', 'Cases'] },
  manifesto: [
    'Parceria de verdade é a que *mede* resultado e ajusta a rota.',
    'Soluções simples para problemas *complexos*.',
  ],
  about: {
    eyebrow: 'Sobre a {empresa}',
    title: ['Experiência que gera *resultado*.', 'Parceiros do seu crescimento.'],
    paragraphs: [
      [
        'A {empresa} é uma empresa B2B sediada em {cidade} que atende clientes de diversos setores com soluções personalizadas e suporte dedicado.',
        'Nosso método une diagnóstico, implementação e acompanhamento, com indicadores claros em cada etapa.',
      ],
      [
        'Há {anos} anos atuando no mercado, a {empresa} já atendeu centenas de empresas com um compromisso simples: entregar o que foi combinado e medir o impacto.',
        'Contamos com equipe especializada e processos maduros para projetos de qualquer porte.',
      ],
    ],
    highlights: [
      { title: 'Diagnóstico', text: 'Entendemos antes de propor.' },
      { title: 'Implementação', text: 'Cronograma e responsáveis definidos.' },
      { title: 'Indicadores', text: 'Resultados acompanhados.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Soluções',
    title: ['Como *ajudamos* sua empresa'],
    intro: ['Serviços sob medida para cada operação.'],
  },
  services: [
    { title: 'Consultoria', description: 'Diagnóstico e plano de ação com metas claras.', icon: 'bar-chart' },
    { title: 'Implementação', description: 'Execução com equipe dedicada e cronograma.', icon: 'layers' },
    { title: 'Suporte contínuo', description: 'Acompanhamento e evolução constante.', icon: 'handshake' },
    { title: 'Treinamento', description: 'Capacitação da sua equipe.', icon: 'users' },
    { title: 'Integração', description: 'Conectamos sistemas e processos.', icon: 'globe' },
    { title: 'Gestão de projetos', description: 'Planejamento, execução e entrega.', icon: 'target' },
  ],
  benefitsHead: {
    eyebrow: 'Diferenciais',
    title: ['Por que empresas escolhem a *{empresa}*'],
    intro: ['O que garante a entrega.'],
  },
  benefits: [
    { title: 'Foco em resultado', description: 'Indicadores definidos desde o início.', icon: 'trending-up' },
    { title: 'Equipe sênior', description: 'Profissionais experientes em cada projeto.', icon: 'award' },
    { title: 'Transparência', description: 'Relatórios e comunicação constante.', icon: 'eye' },
    { title: 'Escalabilidade', description: 'Soluções que crescem com você.', icon: 'layers' },
  ],
  processHead: {
    eyebrow: 'Metodologia',
    title: ['Como *trabalhamos*'],
    intro: ['Processo claro do início ao fim.'],
  },
  steps: [
    { title: 'Diagnóstico', description: 'Entendemos o cenário e os objetivos.' },
    { title: 'Proposta', description: 'Escopo, cronograma e investimento.' },
    { title: 'Implementação', description: 'Execução com equipe dedicada.' },
    { title: 'Acompanhamento', description: 'Medição e otimização contínua.' },
  ],
  faqs: [
    {
      question: 'Atendem empresas de qual porte?',
      answer: 'De pequenas empresas a grandes operações. As soluções são dimensionadas para cada caso.',
    },
    {
      question: 'Como é feito o orçamento?',
      answer: 'Após o diagnóstico, enviamos uma proposta com escopo, prazo e investimento detalhados.',
    },
    {
      question: 'Qual o prazo de implementação?',
      answer: 'Depende do escopo. Projetos típicos levam de 4 a 12 semanas.',
    },
    {
      question: 'Oferecem suporte após a entrega?',
      answer: 'Sim, com planos de suporte e acompanhamento contínuo.',
    },
    {
      question: 'Atendem fora de {cidade}?',
      answer: 'Sim, atendemos clientes em todo o Brasil, presencialmente ou remotamente.',
    },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de mercado' },
    { value: '300', suffix: '+', label: 'empresas atendidas' },
    { value: '95', suffix: '%', label: 'de retenção' },
    { value: '12', suffix: '', label: 'setores atendidos' },
  ],
  testimonialsHead: { eyebrow: 'Cases', title: ['O que dizem nossos *clientes*'] },
  testimonials: [
    {
      quote: 'Reduzimos custos operacionais em 20% no primeiro semestre com a implementação.',
      author: 'Diretor de operações',
      role: 'Indústria',
      rating: 5,
    },
    {
      quote: 'Equipe sênior, comunicação clara e entrega no prazo.',
      author: 'CEO',
      role: 'Empresa de serviços',
      rating: 5,
    },
    {
      quote: 'Parceria que evoluiu junto com a nossa empresa.',
      author: 'Gerente',
      role: 'Varejo',
      rating: 5,
    },
  ],
  projectsHead: { eyebrow: 'Cases', title: ['Projetos *entregues*'], intro: ['Alguns resultados recentes.'] },
  projects: [
    { title: 'Reestruturação operacional', category: 'Indústria', description: 'Redução de 20% nos custos.' },
    {
      title: 'Implementação de processos',
      category: 'Serviços',
      description: 'Equipe treinada em 6 semanas.',
    },
    { title: 'Integração de sistemas', category: 'Varejo', description: 'Dados unificados em tempo real.' },
    { title: 'Expansão regional', category: 'Logística', description: 'Nova operação em 90 dias.' },
  ],
  finalCta: {
    eyebrow: 'Próximo passo',
    title: ['Vamos conversar sobre o seu *desafio*?'],
    text: ['Agende uma reunião de diagnóstico sem compromisso.'],
  },
  contactIntro: ['Reuniões presenciais ou online.'],
  marquee: ['Consultoria', 'Implementação', 'Suporte', 'Treinamento', 'Resultados'],
  keywords: [
    'empresa B2B {cidade}',
    'consultoria empresarial',
    'soluções para empresas',
    'fornecedor',
    'parceria',
  ],
  whatsappMessage: 'Olá! Gostaria de agendar uma conversa com a {empresa}.',
  seoDescription: [
    '{empresa}: soluções B2B com diagnóstico, implementação e suporte contínuo para empresas em {cidade} e todo o Brasil.',
  ],
};

export const industria: SegmentCopy = {
  segment: 'industria',
  themes: ['industrial', 'architecture', 'high-contrast'],
  layouts: ['impact', 'trust', 'showcase'],
  placeholderStyle: 'grid',
  hero: {
    eyebrow: ['Indústria em {cidade}', 'Produção · Qualidade · Escala', 'Fornecedor de confiança'],
    headline: [
      'Capacidade industrial com *qualidade* certificada.',
      'Produção em escala, com controle em cada *etapa*.',
      'Seu fornecedor de *confiança*.',
    ],
    sub: [
      'A {empresa} fabrica e fornece com tecnologia, controle de qualidade e prazos confiáveis. Atendemos clientes em {cidade} e em todo o Brasil.',
      'Parque fabril moderno, equipe técnica e logística própria. A {empresa} entrega volume sem abrir mão da qualidade.',
    ],
    badges: ['Controle de qualidade', 'Entrega em todo o Brasil', 'Produção sob medida'],
  },
  cta: {
    primary: ['Solicitar cotação', 'Falar com vendas'],
    secondary: ['Ver produtos', 'Conhecer a fábrica'],
  },
  manifesto: [
    'Qualidade não é inspeção no final. É *processo* do começo ao fim.',
    'Produzir bem é produzir *sempre igual*.',
  ],
  about: {
    eyebrow: 'Sobre a {empresa}',
    title: ['Tecnologia e *tradição* industrial.', 'Fabricação em {cidade} para todo o Brasil.'],
    paragraphs: [
      [
        'A {empresa} é uma indústria em {cidade} com parque fabril moderno, equipe técnica qualificada e processos padronizados.',
        'Atendemos clientes de diversos setores com produção seriada e sob medida, sempre com controle de qualidade rigoroso.',
      ],
      [
        'Há {anos} anos fabricando em {cidade}, a {empresa} investe continuamente em tecnologia e capacitação para manter a qualidade e a competitividade.',
        'Logística própria e parceiros homologados garantem entregas pontuais em todo o território nacional.',
      ],
    ],
    highlights: [
      { title: 'Parque fabril', text: 'Equipamentos modernos.' },
      { title: 'Qualidade', text: 'Controle em cada etapa.' },
      { title: 'Logística', text: 'Entrega em todo o Brasil.' },
    ],
  },
  servicesHead: {
    eyebrow: 'Linhas',
    title: ['O que *produzimos*'],
    intro: ['Produtos e serviços industriais.'],
  },
  services: [
    {
      title: 'Produção seriada',
      description: 'Alta capacidade com padronização e rastreabilidade.',
      icon: 'factory',
    },
    {
      title: 'Sob medida',
      description: 'Desenvolvimento de produtos conforme especificação do cliente.',
      icon: 'ruler',
    },
    {
      title: 'Usinagem e montagem',
      description: 'Precisão e acabamento para peças e conjuntos.',
      icon: 'cog',
    },
    { title: 'Engenharia', description: 'Projeto, prototipagem e melhoria de processos.', icon: 'pen-tool' },
    { title: 'Logística', description: 'Entrega programada em todo o Brasil.', icon: 'truck' },
    { title: 'Assistência técnica', description: 'Suporte e manutenção pós-venda.', icon: 'wrench' },
  ],
  benefitsHead: {
    eyebrow: 'Diferenciais',
    title: ['Por que a *{empresa}*'],
    intro: ['O que garante sua operação.'],
  },
  benefits: [
    { title: 'Qualidade certificada', description: 'Processos padronizados e auditados.', icon: 'award' },
    { title: 'Capacidade produtiva', description: 'Volume para atender grandes demandas.', icon: 'layers' },
    { title: 'Prazo confiável', description: 'Planejamento de produção e entrega.', icon: 'clock' },
    { title: 'Atendimento técnico', description: 'Engenharia disponível para o seu projeto.', icon: 'users' },
  ],
  processHead: {
    eyebrow: 'Como funciona',
    title: ['Da cotação à *entrega*'],
    intro: ['Processo industrial organizado.'],
  },
  steps: [
    { title: 'Cotação', description: 'Envie a especificação ou o desenho.' },
    { title: 'Proposta técnica', description: 'Prazo, volume e condições.' },
    { title: 'Produção', description: 'Com controle de qualidade e acompanhamento.' },
    { title: 'Entrega', description: 'Logística programada até o seu endereço.' },
  ],
  faqs: [
    {
      question: 'Qual o lote mínimo?',
      answer: 'Depende do produto. Consulte nossa equipe comercial com a especificação.',
    },
    {
      question: 'Produzem sob medida?',
      answer: 'Sim, desenvolvemos produtos conforme desenho ou amostra do cliente.',
    },
    {
      question: 'Entregam em todo o Brasil?',
      answer: 'Sim, com logística própria e transportadoras parceiras.',
    },
    {
      question: 'Possuem certificações?',
      answer: 'Consulte as certificações e laudos disponíveis pelo nosso comercial.',
    },
    {
      question: 'Qual o prazo de produção?',
      answer: 'Varia por produto e volume. Informamos o prazo na proposta.',
    },
  ],
  stats: [
    { value: '{anos}', suffix: '+', label: 'anos de indústria' },
    { value: '10', suffix: 'mil m²', label: 'de fábrica' },
    { value: '500', suffix: '+', label: 'clientes ativos' },
    { value: '99', suffix: '%', label: 'de entregas no prazo' },
  ],
  testimonialsHead: { eyebrow: 'Clientes', title: ['Parceiros de *longa data*'] },
  testimonials: [
    {
      quote: 'Fornecedor há mais de 5 anos. Qualidade constante e prazo respeitado.',
      author: 'Gerente de compras',
      role: 'Indústria automotiva',
      rating: 5,
    },
    {
      quote: 'Desenvolveram uma peça sob medida para nossa linha em tempo recorde.',
      author: 'Engenheiro',
      role: 'Cliente',
      rating: 5,
    },
    {
      quote: 'Atendimento técnico que resolve. Recomendo.',
      author: 'Diretor',
      role: 'Construção',
      rating: 5,
    },
  ],
  projectsHead: {
    eyebrow: 'Estrutura',
    title: ['Nosso *parque fabril*'],
    intro: ['Tecnologia e capacidade.'],
  },
  projects: [
    { title: 'Linha de produção', category: 'Fábrica', description: 'Alta capacidade e automação.' },
    { title: 'Controle de qualidade', category: 'Qualidade', description: 'Laboratório e inspeção.' },
    { title: 'Expedição', category: 'Logística', description: 'Estoque e carregamento.' },
    { title: 'Engenharia', category: 'Desenvolvimento', description: 'Projeto e prototipagem.' },
  ],
  finalCta: {
    eyebrow: 'Cotação',
    title: ['Precisa de um fornecedor *confiável*?'],
    text: ['Envie sua especificação e receba uma proposta técnica.'],
  },
  contactIntro: ['Cotações e atendimento comercial pelo WhatsApp ou e-mail.'],
  marquee: ['Produção', 'Qualidade', 'Engenharia', 'Logística', 'Escala'],
  keywords: ['indústria {cidade}', 'fabricante', 'fornecedor industrial', 'produção sob medida', 'cotação'],
  whatsappMessage: 'Olá! Gostaria de solicitar uma cotação com a {empresa}.',
  seoDescription: [
    '{empresa}: indústria em {cidade} com produção seriada e sob medida, controle de qualidade e entrega em todo o Brasil.',
  ],
};
