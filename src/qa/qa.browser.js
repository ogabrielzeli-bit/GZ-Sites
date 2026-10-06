/* eslint-disable */
// GZ QA — código executado DENTRO da página testada (JS puro, avaliado como string pelo Playwright).

function overflowInfo() {
  const w = document.documentElement.clientWidth;
  const ov = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - w;
  const culprits = Array.from(document.querySelectorAll('body *'))
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.right > w + 4 && r.width > 0;
    })
    .slice(0, 5)
    .map((el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''));
  return { overflow: ov, culprits };
}

function mobileChecks() {
  const targets = Array.from(document.querySelectorAll('a, button'));
  const small = targets.filter((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && (r.height < 36 || r.width < 36) && !el.closest('.nav, .footer, .hero__badges');
  });
  const texts = Array.from(document.querySelectorAll('p, li, span, a, h1, h2, h3'));
  const tiny = texts.filter((el) => el.children.length === 0 && (el.innerText || '').trim().length > 3 && parseFloat(getComputedStyle(el).fontSize) < 12);
  return { small: small.slice(0, 8).map((el) => (el.innerText || el.getAttribute('aria-label') || el.tagName).trim().slice(0, 30)), tiny: tiny.length };
}

function imagesCheck() {
  const imgs = Array.from(document.images);
  const broken = imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src') || '?');
  const notLoaded = imgs.filter((i) => !i.complete).length;
  return { total: imgs.length, broken, notLoaded };
}

function buttonsCheck() {
  const problems = [];
  const btns = Array.from(document.querySelectorAll('a.btn, button, .wa-float, .nav a'));
  for (const b of btns) {
    const text = (b.innerText || b.textContent || b.getAttribute('aria-label') || '').trim();
    if (!text) problems.push('Botão sem texto/aria-label: ' + b.outerHTML.slice(0, 60));
    if (b.tagName === 'A') {
      const href = b.getAttribute('href') || '';
      if (!href || href === '#') problems.push('Link sem destino: "' + text + '"');
      else if (href.startsWith('#') && !document.getElementById(href.slice(1))) problems.push('Âncora inexistente ' + href + ' em "' + text + '"');
    }
    if (b.tagName === 'BUTTON' && !b.getAttribute('type')) problems.push('Button sem type: "' + text + '"');
  }
  return { count: btns.length, problems };
}

function a11yCheck() {
  const items = [];
  if (!document.querySelector('main')) items.push('Sem <main>');
  if (!document.querySelector('.skip-link, a[href="#conteudo"]')) items.push('Sem skip link');
  const h1 = document.querySelectorAll('h1').length;
  if (h1 !== 1) items.push(h1 + ' H1 na página');
  for (const f of Array.from(document.querySelectorAll('input:not([type=hidden]), textarea, select'))) {
    const id = f.id;
    if (!(id && document.querySelector('label[for="' + id + '"]')) && !f.getAttribute('aria-label') && !f.closest('label')) items.push('Campo sem label: ' + f.getAttribute('name'));
  }
  for (const b of Array.from(document.querySelectorAll('button'))) if (!(b.innerText || '').trim() && !b.getAttribute('aria-label')) items.push('Botão sem nome acessível');
  const iframes = Array.from(document.querySelectorAll('iframe')).filter((i) => !i.title);
  if (iframes.length) items.push(iframes.length + ' iframe(s) sem title');
  return items;
}

function focusedInfo() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const cs = getComputedStyle(el);
  return { tag: el.tagName, outline: cs.outlineStyle !== 'none' || cs.boxShadow !== 'none' };
}

function externalHrefs() {
  return Array.from(new Set(Array.from(document.querySelectorAll('a[href^="http"]')).map((a) => a.href))).filter((h) => !/wa\.me|whatsapp|instagram|facebook|google\.com\/maps|linkedin|tiktok|youtube/i.test(h));
}

function stubWindowOpen() {
  window.__opened = [];
  window.open = (u) => {
    window.__opened.push(String(u));
    return null;
  };
  return true;
}

function openedUrls() {
  return window.__opened || [];
}

async function scrollThrough() {
  const total = document.documentElement.scrollHeight;
  for (let y = 0; y < total; y += Math.max(400, window.innerHeight * 0.8)) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 70));
  }
  window.scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 250));
  return true;
}

window.__gzQa = { overflowInfo, mobileChecks, imagesCheck, buttonsCheck, a11yCheck, focusedInfo, externalHrefs, stubWindowOpen, openedUrls, scrollThrough };
