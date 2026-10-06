/**
 * GZ Runtime — interações e animações dos sites gerados.
 * Princípios: propósito, feedback, performance (transform/opacity), respeito a prefers-reduced-motion.
 * Sem JS o site funciona normalmente (conteúdo visível); com JS ele ganha vida.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const intensity = (root.dataset.animIntensity as 'subtle' | 'normal' | 'bold') || 'normal';
const parallaxOn = root.dataset.parallax !== '0' && !reduced;
const magneticOn =
  root.dataset.magnetic !== '0' && !reduced && matchMedia('(hover: hover) and (pointer: fine)').matches;
const isDesktop = () => matchMedia('(min-width: 900px)').matches;

/**
 * Personalidades de motion (V2): o mesmo runtime se comporta de forma diferente por perfil.
 * elegant: suave e lento · performance: rápido e firme · technical: seco, sem floreio
 * editorial: lento, com clip reveals · playful: elástico · minimal: quase nada · cinematic: lento e amplo
 */
type MotionProfile = 'elegant' | 'performance' | 'technical' | 'editorial' | 'playful' | 'minimal' | 'cinematic';
const PROFILES: Record<MotionProfile, { dist: number; dur: number; ease: string; stagger: number; imageScale: number; textRotate: number; glow: boolean }> = {
  elegant: { dist: 1, dur: 1, ease: 'power3.out', stagger: 1, imageScale: 1.15, textRotate: -20, glow: true },
  performance: { dist: 1.3, dur: 0.65, ease: 'power4.out', stagger: 0.6, imageScale: 1.25, textRotate: 0, glow: true },
  technical: { dist: 0.5, dur: 0.5, ease: 'power2.out', stagger: 0.5, imageScale: 1.02, textRotate: 0, glow: false },
  editorial: { dist: 0.8, dur: 1.3, ease: 'power2.out', stagger: 1.2, imageScale: 1.08, textRotate: 0, glow: false },
  playful: { dist: 1.2, dur: 0.9, ease: 'back.out(1.6)', stagger: 1, imageScale: 1.2, textRotate: -30, glow: true },
  minimal: { dist: 0.4, dur: 0.6, ease: 'power1.out', stagger: 0.6, imageScale: 1, textRotate: 0, glow: false },
  cinematic: { dist: 1.4, dur: 1.5, ease: 'expo.out', stagger: 1.3, imageScale: 1.3, textRotate: -12, glow: true },
};
const profile = PROFILES[(root.dataset.motion as MotionProfile) || 'elegant'] ?? PROFILES.elegant;
const dist = Math.round({ subtle: 18, normal: 32, bold: 56 }[intensity] * profile.dist);
const dur = { subtle: 0.7, normal: 0.9, bold: 1.1 }[intensity] * profile.dur;
const ease = profile.ease;

function $all<T extends Element = HTMLElement>(sel: string, scope: ParentNode = document): T[] {
  return Array.from(scope.querySelectorAll<T>(sel));
}

// ---------- Header ----------
function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-gz-header]');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const toggle = document.querySelector<HTMLButtonElement>('[data-gz-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-gz-mobile-menu]');
  if (toggle && menu) {
    const setOpen = (open: boolean) => {
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      if (open && !reduced)
        gsap.fromTo(
          menu.querySelectorAll('a'),
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.05, duration: 0.5, ease, delay: 0.15 },
        );
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
    });
  }
}

// ---------- Reveal / stagger / text / image ----------
function initReveals() {
  if (reduced) return;
  $all('[data-gz="reveal"]').forEach((el) => {
    gsap.fromTo(
      el,
      { y: dist, opacity: 0 },
      { y: 0, opacity: 1, duration: dur, ease, scrollTrigger: { trigger: el, start: 'top 88%', once: true } },
    );
  });
  $all('[data-gz="stagger"]').forEach((el) => {
    const kids = Array.from(el.children);
    if (!kids.length) return;
    gsap.fromTo(
      kids,
      { y: dist, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: dur,
        ease,
        stagger: Math.min(0.12, 0.6 / kids.length) * profile.stagger,
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      },
    );
  });
  $all('[data-gz="text"]').forEach((el) => {
    const words = $all('.word', el);
    if (!words.length) return;
    if (el.hasAttribute('data-gz-scrub')) {
      gsap.fromTo(
        words,
        { opacity: 0.15, y: 6 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.04,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: 0.6 },
        },
      );
    } else {
      gsap.fromTo(
        words,
        { y: '0.6em', opacity: 0, rotateX: profile.textRotate },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 0.8,
          ease,
          stagger: 0.035,
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        },
      );
    }
  });
  $all('[data-gz="image"]').forEach((el) => {
    const img = el.querySelector('img, video');
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    // cortina de baixo para cima (clip-path) + zoom-out suave da imagem
    tl.fromTo(
      el,
      { clipPath: 'inset(0 0 100% 0)' },
      { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'power4.out' },
      0,
    );
    if (img && profile.imageScale > 1)
      tl.fromTo(img, { scale: profile.imageScale }, { scale: 1, duration: 1.4 * profile.dur, ease: 'power3.out' }, 0);
  });
  $all('[data-gz="clip"]').forEach((el) => {
    gsap.fromTo(
      el,
      { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
      {
        clipPath: 'inset(0 0% 0 0)',
        duration: 1,
        ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
      },
    );
  });
}

// ---------- Parallax ----------
function initParallax() {
  if (!parallaxOn) return;
  $all('[data-gz-parallax]').forEach((el) => {
    const amount = parseFloat(el.dataset.gzParallax || '0.15');
    if (!amount) return;
    const isBg = el.hasAttribute('data-gz-parallax-bg');
    const target = isBg ? el.querySelector('img, video') || el : el;
    const px = Math.round(amount * 240);
    gsap.fromTo(
      target,
      { y: isBg ? -px * 0.5 : px * 0.5 },
      {
        y: isBg ? px * 0.5 : -px * 0.5,
        ease: 'none',
        scrollTrigger: {
          trigger: isBg ? el.parentElement || el : el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      },
    );
  });
}

// ---------- Contadores ----------
function initCounters() {
  $all('[data-gz-counter]').forEach((el) => {
    const raw = el.textContent?.trim() ?? '';
    const m = raw.match(/^([\d.,]+)(.*)$/);
    if (!m) return;
    const numStr = m[1].replace(/\./g, '').replace(',', '.');
    const target = parseFloat(numStr);
    if (!isFinite(target) || reduced) return;
    const decimals = (m[1].split(',')[1] || '').length;
    const suffix = m[2];
    const obj = { v: 0 };
    el.textContent = '0' + suffix;
    gsap.to(obj, {
      v: target,
      duration: 1.6,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      onUpdate: () => {
        el.textContent =
          obj.v.toLocaleString('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }) + suffix;
      },
    });
  });
}

// ---------- Timeline progress ----------
function initTimeline() {
  $all('[data-gz-timeline]').forEach((el) => {
    const line = el.querySelector<HTMLElement>('.timeline__line');
    if (!line) return;
    gsap.fromTo(
      line,
      { height: 0 },
      {
        height: '100%',
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 70%', end: 'bottom 60%', scrub: true },
      },
    );
  });
}

// ---------- Horizontal scroll (pin) ----------
function initHScroll() {
  $all('[data-gz-hscroll]').forEach((el) => {
    const track = el.querySelector<HTMLElement>('.hscroll__track');
    const section = el.closest<HTMLElement>('[data-gz-hscroll-section]') || el;
    if (!track) return;
    const setup = () => {
      ScrollTrigger.getById(`hs-${section.id}`)?.kill();
      if (!isDesktop() || reduced) {
        gsap.set(track, { x: 0 });
        return;
      }
      const distance = track.scrollWidth - el.clientWidth;
      if (distance <= 0) return;
      gsap.to(track, {
        x: -distance,
        ease: 'none',
        scrollTrigger: {
          id: `hs-${section.id}`,
          trigger: section,
          start: 'top top+=80',
          end: () => `+=${distance}`,
          pin: true,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
    };
    setup();
    let t: number | undefined;
    window.addEventListener('resize', () => {
      clearTimeout(t);
      t = window.setTimeout(() => {
        setup();
        ScrollTrigger.refresh();
      }, 200);
    });
  });
}

// ---------- Magnetic ----------
function initMagnetic() {
  if (!magneticOn) return;
  $all('[data-gz-magnetic]').forEach((el) => {
    const strength = 0.28;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * strength);
      yTo((e.clientY - (r.top + r.height / 2)) * strength);
    });
    el.addEventListener('mouseleave', () => {
      xTo(0);
      yTo(0);
    });
  });
}

// ---------- Press + spring ----------
function initPress() {
  if (reduced) return;
  document.addEventListener('pointerdown', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.btn, .wa-float, .menu-toggle');
    if (!btn) return;
    gsap.to(btn, { scale: 0.96, duration: 0.08, ease: 'power2.out', overwrite: 'auto' });
    const up = () => {
      gsap.to(btn, { scale: 1, duration: 0.5, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  });
}

// ---------- Sticky CTA ----------
function initStickyCta() {
  const bar = document.querySelector<HTMLElement>('[data-gz-sticky-cta]');
  if (!bar) return;
  const onScroll = () => bar.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ---------- Slider ----------
function initSliders() {
  $all('[data-gz-slider]').forEach((slider) => {
    const nav = slider.nextElementSibling;
    const prev = nav?.querySelector<HTMLButtonElement>('[data-slider-prev]');
    const next = nav?.querySelector<HTMLButtonElement>('[data-slider-next]');
    const step = () => (slider.firstElementChild as HTMLElement | null)?.getBoundingClientRect().width ?? 300;
    prev?.addEventListener('click', () =>
      slider.scrollBy({ left: -step() - 16, behavior: reduced ? 'auto' : 'smooth' }),
    );
    next?.addEventListener('click', () =>
      slider.scrollBy({ left: step() + 16, behavior: reduced ? 'auto' : 'smooth' }),
    );
  });
}

// ---------- Antes/depois ----------
function initCompare() {
  $all('[data-gz-compare]').forEach((el) => {
    const range = el.querySelector<HTMLInputElement>('input[type=range]');
    if (!range) return;
    const set = (v: number) => el.style.setProperty('--pos', `${v}%`);
    range.addEventListener('input', () => set(Number(range.value)));
    set(50);
  });
}

// ---------- FAQ (anima abertura) ----------
function initAccordion() {
  $all<HTMLDetailsElement>('[data-gz-accordion] details').forEach((d) => {
    const body = d.querySelector<HTMLElement>('.faq__answer');
    if (!body || reduced) return;
    d.addEventListener('toggle', () => {
      if (d.open) gsap.fromTo(body, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.35, ease });
    });
  });
}

// ---------- Formulário: Enviar → Enviando → Enviado ----------
function initForms() {
  $all<HTMLFormElement>('form[data-gz-form]').forEach((form) => {
    const mode = form.dataset.gzForm || 'whatsapp';
    const btn = form.querySelector<HTMLButtonElement>('button[type=submit]');
    const status = form.querySelector<HTMLElement>('.form__status');
    const setState = (s: 'idle' | 'sending' | 'sent') => btn?.setAttribute('data-state', s);
    const say = (msg: string, kind: 'success' | 'error' | '' = '') => {
      if (!status) return;
      status.textContent = msg;
      status.className = 'form__status' + (kind ? ` is-${kind}` : '');
    };
    const validate = (): boolean => {
      let ok = true;
      form
        .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea, select')
        .forEach((f) => {
          const field = f.closest('.field');
          if (!field) return;
          let valid = f.checkValidity();
          if (f.type === 'tel' && f.value && f.value.replace(/\D/g, '').length < 10) valid = false;
          field.classList.toggle('field--error', !valid);
          if (!valid) ok = false;
        });
      return ok;
    };
    form.addEventListener('input', (e) =>
      (e.target as HTMLElement).closest('.field')?.classList.remove('field--error'),
    );
    form.addEventListener('submit', async (e) => {
      // honeypot
      const hp = form.querySelector<HTMLInputElement>('input[name="empresa-site"]');
      if (hp && hp.value) {
        e.preventDefault();
        return;
      }
      if (!validate()) {
        e.preventDefault();
        say('Confira os campos destacados.', 'error');
        form.querySelector<HTMLElement>('.field--error input, .field--error textarea')?.focus();
        return;
      }
      const data = new FormData(form);
      const lines: string[] = [];
      form
        .querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
          '.field input, .field textarea, .field select',
        )
        .forEach((f) => {
          const label =
            form.querySelector(`label[for="${f.id}"]`)?.textContent?.replace('*', '').trim() ?? f.name;
          if (f.value) lines.push(`*${label}:* ${f.value}`);
        });
      if (mode === 'netlify') {
        e.preventDefault();
        setState('sending');
        try {
          const res = await fetch(form.getAttribute('action') || '/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(data as unknown as Record<string, string>).toString(),
          });
          if (!res.ok) throw new Error(String(res.status));
          setState('sent');
          say(form.dataset.success || 'Mensagem enviada!', 'success');
          form.reset();
        } catch {
          setState('idle');
          say('Não foi possível enviar agora. Tente pelo WhatsApp.', 'error');
        }
        return;
      }
      e.preventDefault();
      setState('sending');
      await new Promise((r) => setTimeout(r, 450));
      const text = `Olá! Vim pelo site.\n${lines.join('\n')}`;
      if (mode === 'whatsapp' && form.dataset.wa) {
        window.open(`${form.dataset.wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      } else if (form.dataset.email) {
        window.location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent('Contato pelo site')}&body=${encodeURIComponent(text.replace(/\*/g, ''))}`;
      }
      setState('sent');
      say(form.dataset.success || 'Pronto! Continue a conversa na janela que abriu.', 'success');
      setTimeout(() => setState('idle'), 6000);
    });
  });
}

// ---------- Cursor glow (desktop, sutil) ----------
function initCursorGlow() {
  if (reduced || !magneticOn || intensity === 'subtle' || !profile.glow) return;
  const glow = document.createElement('div');
  glow.className = 'gz-cursor-glow';
  document.body.appendChild(glow);
  const xTo = gsap.quickTo(glow, 'left', { duration: 0.8, ease: 'power3.out' });
  const yTo = gsap.quickTo(glow, 'top', { duration: 0.8, ease: 'power3.out' });
  window.addEventListener(
    'mousemove',
    (e) => {
      glow.style.opacity = '1';
      xTo(e.clientX);
      yTo(e.clientY);
    },
    { passive: true },
  );
}

// ---------- Vídeo de hero (V2) ----------
// Toca só quando visível, pausa fora da tela; respeita reduced-motion e Save-Data; se falhar, mostra o poster.
function initVideo() {
  const saveData = !!(navigator as any).connection?.saveData;
  $all<HTMLVideoElement>('video[data-gz-video]').forEach((v) => {
    const off = () => {
      v.pause();
      v.removeAttribute('autoplay');
      v.classList.add('is-off');
    };
    if (reduced || saveData) return off();
    v.addEventListener('error', off, { once: true });
    v.querySelectorAll('source').forEach((s) => s.addEventListener('error', off, { once: true }));
    const tryPlay = () => v.play().catch(off);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(
        (entries) => entries.forEach((e) => (e.isIntersecting ? tryPlay() : v.pause())),
        { threshold: 0.15 },
      ).observe(v);
    } else tryPlay();
  });
}

// ---------- Boot ----------
function boot() {
  initHeader();
  initVideo();
  initReveals();
  initParallax();
  initCounters();
  initTimeline();
  initHScroll();
  initMagnetic();
  initPress();
  initStickyCta();
  initSliders();
  initCompare();
  initAccordion();
  initForms();
  initCursorGlow();
  // refresh após fontes/imagens carregarem (evita triggers desalinhados)
  window.addEventListener('load', () => ScrollTrigger.refresh());
  if ((document as any).fonts?.ready) (document as any).fonts.ready.then(() => ScrollTrigger.refresh());
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();

(window as any).GZ = { gsap, ScrollTrigger, version: '2.0.0', motion: root.dataset.motion || 'elegant' };
