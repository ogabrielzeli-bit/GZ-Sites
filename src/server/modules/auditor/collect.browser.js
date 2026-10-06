/* eslint-disable */
// GZ Auditor — código executado DENTRO da página auditada. JS puro (sem TS) para evitar helpers injetados pelo bundler.
/* Funções executadas dentro do navegador (avaliadas como string pelo Playwright) */

function analyzeDom() {
  const q = (s) => document.querySelector(s);
  const qa = (s) => Array.from(document.querySelectorAll(s));
  const metaContent = (sel) => q(sel)?.content ?? null;
  const text = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
  const og = {};
  qa('meta[property^="og:"]').forEach((m) => (og[m.getAttribute('property')] = m.content));
  const ld = qa('script[type="application/ld+json"]')
    .map((s) => {
      try {
        const j = JSON.parse(s.textContent || '{}');
        const t = Array.isArray(j) ? j.map((x) => x['@type']).join(',') : j['@type'] || (j['@graph'] ? j['@graph'].map((x) => x['@type']).join(',') : '');
        return String(t || 'unknown');
      } catch {
        return 'inválido';
      }
    })
    .filter(Boolean);
  const imgs = qa('img');
  const oversized = imgs
    .filter((i) => i.naturalWidth > 0 && i.clientWidth > 0 && i.naturalWidth > i.clientWidth * 2.2 && i.naturalWidth > 800)
    .slice(0, 10)
    .map((i) => ({ src: i.currentSrc || i.src, natural: `${i.naturalWidth}×${i.naturalHeight}`, rendered: `${i.clientWidth}×${i.clientHeight}` }));
  const links = qa('a[href]');
  const host = location.hostname.replace(/^www\./, '');
  let internal = 0,
    external = 0;
  for (const a of links) {
    try {
      const u = new URL(a.href, location.href);
      if (u.hostname.replace(/^www\./, '') === host) internal++;
      else if (u.protocol.startsWith('http')) external++;
    } catch {}
  }
  const hasTel = links.some((a) => a.href.startsWith('tel:'));
  const hasWa = links.some((a) => /wa\.me|api\.whatsapp\.com|whatsapp:\/\/|whatsapp\.com\/send/i.test(a.href));
  const hasMail = links.some((a) => a.href.startsWith('mailto:'));
  const ctaWords = /(contato|orçamento|orcamento|whatsapp|fale|ligue|agende|agendar|comprar|compre|solicite|solicitar|pedir|peça|reserve|reservar|saiba mais|cadastre|assine|começar|comece|quero)/i;
  const ctaCandidates = (qa('a, button'))
    .filter((el) => ctaWords.test(el.innerText || '') || /tel:|wa\.me|whatsapp/i.test(el.href || ''))
    .slice(0, 15)
    .map((el) => {
      const r = el.getBoundingClientRect();
      return { text: (el.innerText || '').trim().slice(0, 60), href: (el.href || '').slice(0, 200), visibleAboveFold: r.top >= 0 && r.top < window.innerHeight && r.width > 0 && r.height > 0 };
    });
  const forms = (qa('form')).map((f) => {
    const fields = f.querySelectorAll('input:not([type=hidden]):not([type=submit]), textarea, select');
    const withLabel = Array.from(fields).filter((i) => (i.id && f.querySelector(`label[for="${i.id}"]`)) || i.closest('label') || i.getAttribute('aria-label') || i.getAttribute('placeholder'));
    return { fields: fields.length, hasLabels: fields.length > 0 && withLabel.length === fields.length, hasSubmit: !!f.querySelector('button, input[type=submit]') };
  });
  const fonts = new Set();
  (qa('h1,h2,h3,p,a,li,span,div')).slice(0, 400).forEach((el) => fonts.add(getComputedStyle(el).fontFamily.split(',')[0].trim().toLowerCase()));
  const styles = qa('*').slice(0, 1500);
  let flexGrid = false;
  for (const el of styles) {
    const d = getComputedStyle(el).display;
    if (d === 'flex' || d === 'grid' || d === 'inline-flex') {
      flexGrid = true;
      break;
    }
  }
  const yearMatch = (document.body?.innerText || '').match(/(?:©|copyright|todos os direitos)[^\d]{0,30}(20\d{2}|19\d{2})/i) || (document.body?.innerText || '').match(/\b(20[01]\d)\b(?![\d])/);
  const legacy = [];
  if (q('table[width], table[border], table[cellpadding]') && !q('table[role=presentation]')) legacy.push('Layout baseado em tabelas');
  if (q('font, center, marquee, blink')) legacy.push('Tags HTML obsoletas (<font>, <center>, <marquee>)');
  if (q('object[type*=flash], embed[src$=".swf"]')) legacy.push('Conteúdo em Flash');
  const scripts = qa('script[src]');
  if (scripts.some((s) => /jquery[-.](1\.[0-9]|2\.)/i.test(s.src))) legacy.push('jQuery antigo (1.x/2.x)');
  if (/bootstrap\/3\.|bootstrap\.min\.css\?ver=3/i.test(document.documentElement.outerHTML)) legacy.push('Bootstrap 3');
  const generator = metaContent('meta[name="generator"]');
  if (generator && /wix|joomla|blogger|site123|webnode|uol host|weebly/i.test(generator)) legacy.push(`Construtor genérico (${generator.split(' ')[0]})`);
  if (!q('meta[name="viewport"]')) legacy.push('Sem meta viewport (não responsivo)');
  if (/wix\.com|wixstatic/i.test(document.documentElement.outerHTML)) legacy.push('Plataforma Wix');
  if (qa('[style*="font-size"]').length > 40) legacy.push('Excesso de estilos inline');
  const heroImg = imgs.find((i) => i.getBoundingClientRect().top < 900 && i.clientWidth >= 500 && i.clientHeight >= 300);
  const bgHero = (qa('header, section, div')).slice(0, 60).some((el) => {
    const r = el.getBoundingClientRect();
    return r.top < 900 && r.height >= 300 && r.width >= 600 && /url\(/.test(getComputedStyle(el).backgroundImage);
  });
  const longBlocks = (qa('p')).filter((p) => (p.innerText || '').length > 600).length;
  const favicon = !!q('link[rel~="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]');

  return {
    title: document.title || null,
    description: metaContent('meta[name="description"]'),
    h1: (qa('h1')).map((h) => (h.innerText || '').trim().slice(0, 120)).filter(Boolean),
    headings: (qa('h1,h2,h3')).slice(0, 40).map((h) => ({ tag: h.tagName.toLowerCase(), text: (h.innerText || '').trim().slice(0, 100) })),
    canonical: q('link[rel="canonical"]')?.href ?? null,
    viewport: metaContent('meta[name="viewport"]'),
    favicon,
    openGraph: og,
    structuredData: ld,
    lang: document.documentElement.lang || null,
    generator,
    wordCount: text ? text.split(' ').length : 0,
    linksInternal: internal,
    linksExternal: external,
    imagesTotal: imgs.length,
    imagesWithoutAlt: imgs.filter((i) => !i.hasAttribute('alt') || (!i.alt.trim() && !i.closest('a'))).length,
    imagesLazy: imgs.filter((i) => i.loading === 'lazy').length,
    imagesOversized: oversized,
    forms,
    fontsFamilies: fonts.size,
    hasTelLink: hasTel,
    hasWhatsappLink: hasWa,
    hasEmailLink: hasMail,
    ctaCandidates,
    phoneVisibleAboveFold: false,
    whatsappVisibleAboveFold: false,
    ctaAboveFold: false,
    year: yearMatch ? Number(yearMatch[1]) : null,
    usesTables: legacy.includes('Layout baseado em tabelas'),
    legacySignals: legacy,
    scriptsCount: scripts.length,
    inlineStylesCount: qa('[style]').length,
    usesFlexOrGrid: flexGrid,
    hasHeroImage: !!heroImg || bgHero,
    textBlocksLong: longBlocks,
  };
}

function analyzeAboveFold() {
  const vh = window.innerHeight;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && r.top < vh && r.bottom > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const els = Array.from(document.querySelectorAll('a, button, p, span, div, li'));
  const phoneRe = /\(?\d{2}\)?\s?9?\d{4}[-\s]?\d{4}/;
  const phoneVisible = els.some((el) => el.children.length === 0 && phoneRe.test((el).innerText || '') && visible(el)) || Array.from(document.querySelectorAll('a[href^="tel:"]')).some(visible);
  const waVisible = Array.from(document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"], [class*="whatsapp"], [id*="whatsapp"]')).some(visible);
  const ctaWords = /(contato|orçamento|orcamento|whatsapp|fale|ligue|agende|agendar|comprar|solicite|solicitar|pedir|reserve|reservar|cadastre|quero|começar)/i;
  const ctaVisible = Array.from(document.querySelectorAll('a, button')).some((el) => ctaWords.test((el).innerText || '') && visible(el) && el.getBoundingClientRect().height >= 28);
  return { phoneVisibleAboveFold: phoneVisible, whatsappVisibleAboveFold: waVisible, ctaAboveFold: ctaVisible };
}

function analyzeMobile() {
  const docW = document.documentElement.clientWidth;
  const scrollW = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0);
  const all = Array.from(document.querySelectorAll('body *'));
  let small = 0,
    smallestFont = null,
    clipped = 0;
  const textEls = all.filter((el) => el.children.length === 0 && (el.innerText || '').trim().length > 3);
  for (const el of textEls.slice(0, 800)) {
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 12) small++;
    if (smallestFont === null || fs < smallestFont) smallestFont = fs;
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > docW + 2 || r.left < -2)) clipped++;
  }
  const targets = Array.from(document.querySelectorAll('a, button, input[type=submit], [role=button]'));
  const smallTap = targets.filter((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.display !== 'none' && (r.height < 32 || r.width < 32) && r.top < 4000;
  }).length;
  const menu = !!document.querySelector('[class*="hamburger"], [class*="menu-toggle"], [class*="navbar-toggle"], [aria-label*="menu" i], button[aria-expanded], [class*="mobile-menu"], [class*="burger"]');
  // sobreposição: elementos fixed que cobrem >35% da tela
  let overlapping = 0;
  for (const el of all.slice(0, 1500)) {
    const cs = getComputedStyle(el);
    if (cs.position === 'fixed' || cs.position === 'sticky') {
      const r = el.getBoundingClientRect();
      if (r.width * r.height > window.innerWidth * window.innerHeight * 0.35 && cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.1) overlapping++;
    }
  }
  return { horizontalOverflow: scrollW > docW + 4, overflowWidth: scrollW - docW, viewportWidth: docW, smallFontElements: small, smallTapTargets: smallTap, hasMobileMenu: menu, overlappingElements: overlapping, clippedElements: clipped, smallestFontPx: smallestFont };
}
window.__gzAudit = { analyzeDom, analyzeAboveFold, analyzeMobile };
