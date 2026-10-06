/**
 * Pesquisa de fontes públicas (site, Instagram, Google Maps, links) — só fatos verificáveis.
 * Cada fonte é independente: se bloquear ou falhar, é ignorada e registrada como não acessível.
 */
import { chromium } from 'playwright';
import type { Prospect } from '@shared/schemas';
import type { Research, ResearchFacts, ResearchSource, Location } from '@shared/v2';
import { instagramUrl, normalizeUrl, uniq } from '@shared/utils';

const SERVICE_HINTS =
  /(lavagem|higieniza|polimento|insulfilm|detalhamento|vitrifica|cristaliza|instala|manuten|reparo|conserto|revis|troca|projeto|reforma|constru|consulta|exame|tratamento|limpeza|corte|barba|design|avalia|aluguel|venda|loca|entrega|servi[çc]o|especialidade|atendimento|aplica|pintura|solda|estrutura|port[ãa]o|esquadria|cobertura|massagem|depila|hidrata|laser|clareamento|implante|ortodont|pediatr|cardio|dermato|fisioterap|nutri|psic|advocacia|trabalhista|civil|empresarial|imobili|financiamento|buffet|evento|casamento|almo[çc]o|jantar|delivery|reserva)/i;
const HOURS_RE =
  /\b(seg|ter|qua|qui|sex|s[áa]b|dom|segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo)[^\n]{0,40}?\d{1,2}[:h]\d{0,2}\s?(?:[àa-]s?|-|até)\s?\d{1,2}[:h]?\d{0,2}/gi;
const PHONE_RE = /\(?\b\d{2}\)?\s?9?\d{4}[-\s]?\d{4}\b/g;
const ADDRESS_RE =
  /\b(Rua|Av\.?|Avenida|Alameda|Travessa|Rodovia|Estrada|Praça|R\.)\s[^\n,;|]{4,80}(?:,\s?\d{1,6})?[^\n|]{0,80}/g;
const DIFF_HINTS =
  /(garantia|anos de experi[êe]ncia|desde \d{4}|certificad|premiad|especializad|atendimento 24|agendamento online|estacionamento|or[çc]amento gr[áa]tis|entrega gr[áa]tis|parcel|primeira linha|equipe pr[óo]pria|fabrica[çc][ãa]o pr[óo]pria|leva e traz|hora marcada)/i;

const emptyFacts = (): ResearchFacts => ({
  services: [],
  positioning: [],
  language: [],
  locations: [],
  hours: [],
  differentials: [],
  contentTypes: [],
  colors: [],
  socials: [],
  phones: [],
});

function clean(s: string) {
  return s.replace(/\s+/g, ' ').trim();
}
function titleCase(s: string) {
  const t = clean(s).toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Script avaliado na página (JS puro) */
const EXTRACT_JS = `(() => {
  const q = (s) => document.querySelector(s);
  const txt = (el) => (el && (el.innerText || el.textContent) || '').trim();
  const meta = (n) => { const m = q('meta[name="' + n + '"], meta[property="' + n + '"]'); return m ? m.content : ''; };
  const heads = Array.from(document.querySelectorAll('h1,h2,h3')).map(txt).filter(Boolean).slice(0, 60);
  const items = Array.from(document.querySelectorAll('li, .card h3, .card h4, .service, [class*="servic"] h3, [class*="servic"] h4, [class*="servic"] li')).map(txt).filter((t) => t.length > 3 && t.length < 80).slice(0, 200);
  const links = Array.from(document.querySelectorAll('a[href]')).map((a) => a.href);
  const body = (document.body && document.body.innerText || '').slice(0, 20000);
  const styles = Array.from(document.querySelectorAll('header, nav, .btn, button, a.button, footer, h1')).slice(0, 40).map((el) => { const cs = getComputedStyle(el); return [cs.backgroundColor, cs.color]; }).flat();
  const videos = document.querySelectorAll('video, iframe[src*="youtube"], iframe[src*="vimeo"]').length;
  const imgs = document.querySelectorAll('img').length;
  const testimonials = /depoimento|avalia|clientes dizem|o que dizem/i.test(body);
  const products = /produto|cat[áa]logo|comprar|pre[çc]o|R\\$/i.test(body);
  return { title: document.title, description: meta('description') || meta('og:description'), ogSite: meta('og:site_name'), heads, items, links, body, styles, videos, imgs, testimonials, products };
})()`;

function rgbToHex(c: string): string | null {
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!m || (m[4] !== undefined && Number(m[4]) < 0.5)) return null;
  return '#' + [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, '0')).join('');
}

function extractFacts(data: any, facts: ResearchFacts, found: Set<string>) {
  const body: string = data.body || '';
  // posicionamento: title / description / h1
  for (const t of [data.title, data.description, ...(data.heads || []).slice(0, 2)])
    if (t && clean(t).length > 8) facts.positioning.push(clean(t).slice(0, 160));
  if (facts.positioning.length) found.add('posicionamento');
  // serviços: headings e itens com termos de serviço
  const svc = [...(data.heads || []), ...(data.items || [])]
    .map(clean)
    .filter(
      (t) =>
        t.length >= 4 &&
        t.length <= 60 &&
        SERVICE_HINTS.test(t) &&
        !/^(home|in[íi]cio|contato|sobre|quem somos|blog)$/i.test(t),
    );
  if (svc.length) {
    facts.services.push(...uniq(svc.map(titleCase)).slice(0, 20));
    found.add('serviços');
  }
  // diferenciais
  const diffs = body
    .split(/\n|\.\s/)
    .map(clean)
    .filter((l) => l.length > 10 && l.length < 140 && DIFF_HINTS.test(l));
  if (diffs.length) {
    facts.differentials.push(...uniq(diffs).slice(0, 8));
    found.add('diferenciais');
  }
  // horários
  const hours = (body.match(HOURS_RE) || []).map(clean);
  if (hours.length) {
    facts.hours.push(...uniq(hours).slice(0, 6));
    found.add('horários');
  }
  // telefones
  const phones = (body.match(PHONE_RE) || []).map((p) => p.replace(/\D/g, '')).filter((p) => p.length >= 10);
  if (phones.length) {
    facts.phones.push(...uniq(phones).slice(0, 5));
    found.add('telefones');
  }
  // endereços / unidades
  const addrs = uniq((body.match(ADDRESS_RE) || []).map(clean)).slice(0, 5);
  if (addrs.length) {
    for (const a of addrs)
      facts.locations.push({
        name: '',
        address: a,
        city: '',
        state: '',
        phone: '',
        whatsapp: '',
        mapsUrl: '',
        openingHours: '',
      });
    found.add(addrs.length > 1 ? 'unidades' : 'localização');
  }
  // linguagem da marca: palavras recorrentes (sem stopwords)
  const words = body.toLowerCase().match(/\b[a-záàâãéêíóôõúç]{6,}\b/g) || [];
  const stop = new Set([
    'sobre',
    'contato',
    'nossos',
    'nossas',
    'todos',
    'todas',
    'através',
    'também',
    'quando',
    'empresa',
    'serviços',
    'serviço',
    'porque',
    'mesmo',
    'ainda',
    'sempre',
    'podemos',
    'melhor',
    'muito',
    'entre',
    'estão',
    'cliente',
    'clientes',
    'direitos',
    'reservados',
    'política',
    'privacidade',
  ]);
  const freq = new Map<string, number>();
  for (const w of words) if (!stop.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  const top = Array.from(freq.entries())
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([w]) => w);
  if (top.length) {
    facts.language.push(...top);
    found.add('linguagem');
  }
  // conteúdo publicado
  const ct: string[] = [];
  if (data.imgs > 8) ct.push('fotos');
  if (data.videos > 0) ct.push('vídeos');
  if (data.testimonials) ct.push('depoimentos');
  if (data.products) ct.push('produtos/preços');
  if (ct.length) {
    facts.contentTypes.push(...ct);
    found.add('tipos de conteúdo');
  }
  // cores da identidade (fundos/texto de header, botões)
  const cols = uniq((data.styles || []).map(rgbToHex).filter(Boolean) as string[])
    .filter((c) => !['#ffffff', '#000000'].includes(c))
    .slice(0, 5);
  if (cols.length) {
    facts.colors.push(...cols);
    found.add('cores');
  }
  // redes sociais
  const socials = uniq(
    ((data.links || []) as string[]).filter((l: string) =>
      /instagram\.com|facebook\.com|tiktok\.com|youtube\.com|linkedin\.com|wa\.me|whatsapp/i.test(l),
    ),
  ).slice(0, 8);
  if (socials.length) {
    facts.socials.push(...socials);
    found.add('redes sociais');
  }
}

export async function researchProspect(
  p: Pick<Prospect, 'website' | 'instagram' | 'links' | 'name'>,
  opts: { timeoutMs?: number } = {},
): Promise<Research> {
  const timeout = opts.timeoutMs ?? 15000;
  const facts = emptyFacts();
  const sources: ResearchSource[] = [];
  const targets: { type: ResearchSource['type']; url: string }[] = [];
  const site = normalizeUrl(p.website);
  if (site) targets.push({ type: 'website', url: site });
  const ig = instagramUrl(p.instagram);
  if (ig) targets.push({ type: 'instagram', url: ig });
  for (const l of p.links ?? []) {
    const u = normalizeUrl(l.url);
    if (!u) continue;
    targets.push({
      type: /google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps/i.test(u) ? 'maps' : 'link',
      url: u,
    });
  }
  if (!targets.length) return { researchedAt: new Date().toISOString(), sources: [], facts };

  const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
  try {
    const ctx = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36',
      locale: 'pt-BR',
      ignoreHTTPSErrors: true,
    });
    for (const t of targets.slice(0, 6)) {
      const found = new Set<string>();
      const page = await ctx.newPage();
      try {
        const res = await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout });
        if (!res || res.status() >= 400) throw new Error(`HTTP ${res?.status() ?? 'sem resposta'}`);
        await page.waitForTimeout(800);
        const data: any = await page.evaluate(EXTRACT_JS);
        if (t.type === 'instagram') {
          // só o que é público: bio na og:description / title
          const bio = clean(String(data.description || ''));
          if (/login|entrar/i.test(String(data.title)) && !bio) throw new Error('bloqueado (login)');
          if (bio) {
            facts.positioning.push(bio.slice(0, 200));
            found.add('bio do Instagram');
            if (SERVICE_HINTS.test(bio)) found.add('serviços (bio)');
          }
        } else if (t.type === 'maps') {
          const title = clean(String(data.title || '')).replace(/ - Google Maps$/i, '');
          if (title) {
            facts.positioning.push(title);
            found.add('nome no Maps');
          }
          extractFacts(data, facts, found);
        } else extractFacts(data, facts, found);
        sources.push({ type: t.type, url: t.url, ok: true, found: Array.from(found) });
      } catch (e) {
        sources.push({
          type: t.type,
          url: t.url,
          ok: false,
          error: (e as Error).message.slice(0, 120),
          found: [],
        });
      } finally {
        await page.close().catch(() => {});
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }
  for (const k of Object.keys(facts) as (keyof ResearchFacts)[])
    if (k !== 'locations') (facts as any)[k] = uniq((facts as any)[k]);
  facts.locations = dedupeLocations(facts.locations);
  return { researchedAt: new Date().toISOString(), sources, facts };
}

function dedupeLocations(list: Location[]): Location[] {
  const seen = new Set<string>();
  return list.filter((l) => {
    const k = l.address.toLowerCase().slice(0, 40);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/** Resumo legível para o painel/mensagens */
export function summarizeResearch(r: Research | null | undefined): {
  found: string[];
  sources: { type: string; url: string; ok: boolean }[];
} {
  if (!r) return { found: [], sources: [] };
  return {
    found: uniq(r.sources.flatMap((s) => s.found)),
    sources: r.sources.map((s) => ({ type: s.type, url: s.url, ok: s.ok })),
  };
}
