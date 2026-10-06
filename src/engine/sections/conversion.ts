import { z } from 'zod';
import {
  accentText,
  attrs,
  button,
  CtaProp,
  cx,
  defineSection,
  esc,
  icon,
  ImageProp,
  img,
  resolveCta,
  sectionHead,
  wrap,
} from './types';
import type { RenderContext } from './types';

const Tone = z.enum(['default', 'alt', 'surface', 'accent', 'dark']).default('default');
const Head = {
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  intro: z.string().optional(),
  navLabel: z.string().optional(),
  tone: Tone,
  id: z.string().optional(),
};

// ---------------- CTA ----------------
export const cta = defineSection({
  type: 'cta',
  name: 'Chamada final',
  description: 'Última chamada para ação: faixa, cartão colorido ou tela cheia com imagem.',
  variants: [
    { id: 'band', label: 'Faixa' },
    { id: 'card', label: 'Cartão colorido' },
    { id: 'full', label: 'Tela cheia com imagem' },
  ],
  props: z.object({
    ...Head,
    text: z.string().optional(),
    primaryCta: CtaProp,
    secondaryCta: CtaProp,
    image: ImageProp,
  }),
  render(p, ctx, variant) {
    const primary = resolveCta(ctx, p.primaryCta, ctx.primaryCta.label)!;
    const secondary = p.secondaryCta
      ? button({ label: p.secondaryCta.label, href: p.secondaryCta.href ?? '#contato', variant: 'secondary' })
      : '';
    const title = p.title ?? 'Vamos conversar?';
    if (variant === 'card') {
      return wrap(
        ctx,
        `<div class="cta-card" data-gz="reveal"><div class="cta-card__orb" aria-hidden="true"></div>${p.eyebrow ? `<p class="eyebrow">${esc(p.eyebrow)}</p>` : ''}<h2 class="h2">${accentText(title)}</h2>${
          p.text ? `<p class="lead">${esc(p.text)}</p>` : ''
        }<div class="btn-group">${button({ ...primary, size: 'lg' })}${secondary}</div></div>`,
        { id: p.id ?? 'cta', tone: p.tone },
      );
    }
    if (variant === 'full') {
      const im = ctx.assets.image(p.image, { key: 'cta-bg', w: 1920, h: 1080, label: 'Foto de fundo' });
      return `<section class="cta-full" id="${esc(p.id ?? 'cta')}"><div class="hero__bg" data-gz-parallax="0.2" data-gz-parallax-bg>${img(im)}</div><div class="container" data-gz="reveal">${
        p.eyebrow ? `<p class="eyebrow">${esc(p.eyebrow)}</p>` : ''
      }<h2>${accentText(title)}</h2>${p.text ? `<p class="lead">${esc(p.text)}</p>` : ''}<div class="btn-group">${button({ ...primary, size: 'lg' })}${secondary}</div></div></section>`;
    }
    return wrap(
      ctx,
      `<div class="cta-band" data-gz="reveal"><div>${p.eyebrow ? `<p class="eyebrow">${esc(p.eyebrow)}</p>` : ''}<h2 class="h2">${accentText(title)}</h2>${
        p.text ? `<p class="lead">${esc(p.text)}</p>` : ''
      }</div><div class="btn-group">${button({ ...primary, size: 'lg' })}${secondary}</div></div>`,
      { id: p.id ?? 'cta', tone: p.tone === 'default' ? 'alt' : p.tone },
    );
  },
});

// ---------------- Formulário ----------------
const FieldSchema = z.object({
  name: z.string(),
  label: z.string(),
  type: z.enum(['text', 'email', 'tel', 'textarea', 'select']).default('text'),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
});
const DEFAULT_FIELDS: z.infer<typeof FieldSchema>[] = [
  { name: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Seu nome' },
  { name: 'telefone', label: 'WhatsApp', type: 'tel', required: true, placeholder: '(00) 00000-0000' },
  { name: 'email', label: 'E-mail', type: 'email', required: false, placeholder: 'voce@email.com' },
  {
    name: 'mensagem',
    label: 'Como podemos ajudar?',
    type: 'textarea',
    required: true,
    placeholder: 'Conte rapidamente o que você precisa',
  },
];

export function renderForm(
  ctx: RenderContext,
  o: {
    fields?: z.infer<typeof FieldSchema>[];
    submitLabel?: string;
    successMessage?: string;
    formName?: string;
  } = {},
) {
  const fields = o.fields?.length ? o.fields : DEFAULT_FIELDS;
  const mode = ctx.config.integrations.form;
  const wa = ctx.contact.whatsappUrl?.split('?')[0] ?? '';
  const email = ctx.config.contact.email ?? '';
  const name = o.formName ?? 'contato';
  const field = (f: z.infer<typeof FieldSchema>) => {
    const id = `f-${name}-${f.name}`;
    const common = attrs({
      id,
      name: f.name,
      required: f.required,
      placeholder: f.placeholder,
      autocomplete:
        f.type === 'email' ? 'email' : f.type === 'tel' ? 'tel' : f.name === 'nome' ? 'name' : undefined,
    });
    let control: string;
    if (f.type === 'textarea') control = `<textarea ${common} rows="4"></textarea>`;
    else if (f.type === 'select')
      control = `<select ${common}><option value="">Selecione</option>${(f.options ?? []).map((op) => `<option>${esc(op)}</option>`).join('')}</select>`;
    else control = `<input type="${f.type}" ${common}>`;
    return `<div class="field"><label for="${id}">${esc(f.label)}${f.required ? ' *' : ''}</label>${control}<span class="field__error">Preencha este campo corretamente.</span></div>`;
  };
  const short = fields.filter((f) => f.type !== 'textarea');
  const long = fields.filter((f) => f.type === 'textarea');
  const rows: string[] = [];
  for (let i = 0; i < short.length; i += 2)
    rows.push(
      `<div class="form__row">${short
        .slice(i, i + 2)
        .map(field)
        .join('')}</div>`,
    );
  rows.push(...long.map(field));
  const netlifyAttrs =
    mode === 'netlify'
      ? `method="POST" data-netlify="true" netlify-honeypot="empresa-site" name="${esc(name)}"`
      : '';
  return `<form class="form" ${netlifyAttrs} ${attrs({
    'data-gz-form': mode,
    'data-wa': wa || undefined,
    'data-email': email || undefined,
    'data-success': o.successMessage ?? 'Recebemos sua mensagem! Vamos responder em breve.',
    novalidate: true,
    action: mode === 'netlify' ? '/?enviado=1' : undefined,
  })}>${mode === 'netlify' ? `<input type="hidden" name="form-name" value="${esc(name)}">` : ''}<div class="form__hp" aria-hidden="true"><label>Não preencha<input type="text" name="empresa-site" tabindex="-1" autocomplete="off"></label></div>${rows.join(
    '',
  )}<button type="submit" class="btn btn--lg" data-state="idle"><span class="btn__label--idle">${esc(o.submitLabel ?? 'Enviar mensagem')}</span><span class="btn__label--sending"><span class="spinner"></span> Enviando…</span><span class="btn__label--sent">${icon(
    'check',
  )} Enviado!</span></button><p class="form__status" role="status" aria-live="polite"></p><p class="form__privacy">Seus dados são usados apenas para responder ao seu contato.</p></form>`;
}

export const form = defineSection({
  type: 'form',
  name: 'Formulário',
  description: 'Formulário de contato com validação, honeypot e estados Enviar → Enviando → Enviado.',
  variants: [
    { id: 'card', label: 'Em cartão' },
    { id: 'plain', label: 'Simples' },
  ],
  props: z.object({
    ...Head,
    fields: z.array(FieldSchema).default([]),
    submitLabel: z.string().optional(),
    successMessage: z.string().optional(),
  }),
  render(p, ctx, variant) {
    const f = renderForm(ctx, {
      fields: p.fields,
      submitLabel: p.submitLabel,
      successMessage: p.successMessage,
    });
    const body =
      variant === 'card'
        ? `<div class="form-card" data-gz="reveal">${f}</div>`
        : `<div data-gz="reveal">${f}</div>`;
    return wrap(
      ctx,
      sectionHead({
        eyebrow: p.eyebrow,
        title: p.title ?? 'Fale com a gente',
        intro: p.intro,
        align: 'center',
      }) + body,
      { id: p.id ?? 'formulario', tone: p.tone, container: 'narrow' },
    );
  },
});

// ---------------- Mapa ----------------
function mapEmbed(ctx: RenderContext, query?: string, tall = false) {
  const q = query ?? ctx.config.contact.mapQuery ?? ctx.config.contact.address;
  if (!q)
    return `<div class="${cx('map', tall && 'map--tall')}"><div class="map__placeholder">${icon('pin')}<p>Adicione o endereço nas configurações para exibir o mapa.</p></div></div>`;
  const src = `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
  return `<div class="${cx('map', tall && 'map--tall')}"><iframe src="${esc(src)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen title="Mapa: ${esc(q)}"></iframe></div>`;
}
export const map = defineSection({
  type: 'map',
  name: 'Mapa',
  description: 'Mapa do Google (embed, sem chave de API).',
  variants: [{ id: 'wide', label: 'Largo' }],
  props: z.object({ ...Head, query: z.string().optional() }),
  render(p, ctx) {
    return wrap(
      ctx,
      sectionHead({ eyebrow: p.eyebrow, title: p.title, intro: p.intro }) +
        `<div data-gz="reveal">${mapEmbed(ctx, p.query)}</div>`,
      { id: p.id ?? 'mapa', tone: p.tone, container: 'wide', tight: true },
    );
  },
});

// ---------------- Contato ----------------
export const contact = defineSection({
  type: 'contact',
  name: 'Contato',
  description: 'Canais de contato + formulário ou mapa. A seção que fecha a venda.',
  variants: [
    { id: 'form', label: 'Canais + formulário' },
    { id: 'map', label: 'Canais + mapa' },
    { id: 'simple', label: 'Só canais (WhatsApp em destaque)' },
  ],
  props: z.object({
    ...Head,
    showHours: z.boolean().default(true),
    fields: z.array(FieldSchema).default([]),
    successMessage: z.string().optional(),
  }),
  render(p, ctx, variant) {
    const c = ctx.config.contact;
    const items: string[] = [];
    if (ctx.contact.whatsappUrl)
      items.push(
        `<a href="${esc(ctx.contact.whatsappUrl)}" target="_blank" rel="noopener noreferrer"><span class="ico">${icon('whatsapp')}</span><div><strong>WhatsApp</strong><span>${esc(ctx.contact.phoneDisplay ?? 'Chamar no WhatsApp')}</span></div></a>`,
      );
    if (ctx.contact.phoneHref)
      items.push(
        `<a href="${esc(ctx.contact.phoneHref)}"><span class="ico">${icon('phone')}</span><div><strong>Telefone</strong><span>${esc(ctx.contact.phoneDisplay ?? c.phone ?? '')}</span></div></a>`,
      );
    if (ctx.contact.emailHref)
      items.push(
        `<a href="${esc(ctx.contact.emailHref)}"><span class="ico">${icon('mail')}</span><div><strong>E-mail</strong><span>${esc(c.email ?? '')}</span></div></a>`,
      );
    if (c.address)
      items.push(
        `<div><span class="ico">${icon('pin')}</span><div><strong>Endereço</strong><span>${esc(c.address)}</span></div></div>`,
      );
    if (ctx.contact.instagramUrl)
      items.push(
        `<a href="${esc(ctx.contact.instagramUrl)}" target="_blank" rel="noopener noreferrer"><span class="ico">${icon('instagram')}</span><div><strong>Instagram</strong><span>${esc(c.instagram ?? '')}</span></div></a>`,
      );
    const hours =
      p.showHours && ctx.config.business.hours.length
        ? `<table class="hours-table mt-4"><tbody>${ctx.config.business.hours.map((h) => `<tr><td>${esc(h.days)}</td><td>${esc(h.hours)}</td></tr>`).join('')}</tbody></table>`
        : '';
    const left = `<div data-gz="reveal">${sectionHead({ eyebrow: p.eyebrow ?? 'Contato', title: p.title ?? 'Fale com a gente', intro: p.intro })}<div class="contact-list">${items.join('')}</div>${hours}${
      variant === 'simple' && ctx.contact.whatsappUrl
        ? `<div class="mt-4">${button({ label: 'Chamar no WhatsApp', href: ctx.contact.whatsappUrl, variant: 'whatsapp', size: 'lg', icon: 'whatsapp' })}</div>`
        : ''
    }</div>`;
    const right =
      variant === 'map'
        ? `<div data-gz="reveal">${mapEmbed(ctx, undefined, true)}</div>`
        : variant === 'simple'
          ? ''
          : `<div class="form-card" data-gz="reveal">${renderForm(ctx, { fields: p.fields, successMessage: p.successMessage })}</div>`;
    return wrap(ctx, `<div class="${variant === 'simple' ? '' : 'contact-grid'}">${left}${right}</div>`, {
      id: p.id ?? 'contato',
      tone: p.tone,
    });
  },
});

// ---------------- Sticky CTA (mobile) ----------------
export const stickyCta = defineSection({
  type: 'sticky-cta',
  name: 'CTA fixo (mobile)',
  description: 'Barra fixa no rodapé do celular com WhatsApp/ligar. Aparece após o primeiro scroll.',
  variants: [{ id: 'default', label: 'Padrão' }],
  overlay: true,
  props: z.object({
    label: z.string().optional(),
    href: z.string().optional(),
    secondaryLabel: z.string().optional(),
    secondaryHref: z.string().optional(),
  }),
  render(p, ctx) {
    const href = p.href ?? ctx.primaryCta.href;
    const isWa = href.includes('wa.me');
    const second = p.secondaryHref ?? ctx.contact.phoneHref;
    return `<div class="sticky-cta" data-gz-sticky-cta>${button({ label: p.label ?? ctx.primaryCta.label, href, variant: isWa ? 'whatsapp' : 'primary', icon: isWa ? 'whatsapp' : undefined, magnetic: false })}${
      second && second !== href
        ? button({
            label: p.secondaryLabel ?? 'Ligar',
            href: second,
            variant: 'secondary',
            icon: 'phone',
            magnetic: false,
          })
        : ''
    }</div>`;
  },
});

// ---------------- WhatsApp flutuante ----------------
export const whatsappFloat = defineSection({
  type: 'whatsapp-float',
  name: 'WhatsApp flutuante',
  description: 'Botão redondo fixo no canto, com dica ao passar o mouse.',
  variants: [{ id: 'default', label: 'Padrão' }],
  overlay: true,
  props: z.object({ tip: z.string().default('Fale conosco no WhatsApp'), message: z.string().optional() }),
  render(p, ctx) {
    if (!ctx.contact.whatsappUrl) return '';
    const url = p.message
      ? `${ctx.contact.whatsappUrl.split('?')[0]}?text=${encodeURIComponent(p.message)}`
      : ctx.contact.whatsappUrl;
    return `<a class="wa-float" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="Conversar no WhatsApp" data-gz-magnetic>${icon('whatsapp')}<span class="wa-float__tip" aria-hidden="true">${esc(p.tip)}</span></a>`;
  },
});

export const CONVERSION_SECTIONS = [cta, form, map, contact, stickyCta, whatsappFloat];
