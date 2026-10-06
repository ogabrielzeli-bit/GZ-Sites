/** Utilidades puras compartilhadas entre servidor, engine e dashboard. */

export function slugify(input: string): string {
  return (
    input
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'item'
  );
}

/** Mantém só dígitos; adiciona 55 (Brasil) quando parece número nacional sem DDI. */
export function normalizeWhatsapp(raw?: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
  if (digits.length === 10 || digits.length === 11) digits = '55' + digits;
  if (digits.length < 10 || digits.length > 15) return null;
  return digits;
}

export function whatsappLink(raw?: string | null, message?: string): string | null {
  const n = normalizeWhatsapp(raw);
  if (!n) return null;
  const q = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${n}${q}`;
}

export function formatPhoneBR(raw?: string | null): string {
  if (!raw) return '';
  const d = raw.replace(/\D/g, '').replace(/^55/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

export function formatCurrency(value: number | null | undefined, currency = 'BRL', locale = 'pt-BR'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(
      value,
    );
  } catch {
    return `${currency} ${value.toFixed(0)}`;
  }
}

export function formatDate(iso?: string | null, withTime = false): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(
    'pt-BR',
    withTime
      ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: '2-digit', year: 'numeric' },
  );
}

export function relativeTime(iso?: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const min = 60_000,
    hour = 3_600_000,
    day = 86_400_000;
  const future = diff < 0;
  let s: string;
  if (abs < min) s = 'agora';
  else if (abs < hour) s = `${Math.round(abs / min)} min`;
  else if (abs < day) s = `${Math.round(abs / hour)} h`;
  else s = `${Math.round(abs / day)} d`;
  if (s === 'agora') return s;
  return future ? `em ${s}` : `há ${s}`;
}

export function normalizeUrl(raw?: string | null): string | null {
  if (!raw) return null;
  let u = raw.trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  try {
    const parsed = new URL(u);
    if (!parsed.hostname.includes('.')) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

export function instagramHandle(raw?: string | null): string | null {
  if (!raw) return null;
  const m = raw.trim().match(/(?:instagram\.com\/)?@?([A-Za-z0-9._]{1,60})\/?$/);
  return m ? m[1] : null;
}

export function instagramUrl(raw?: string | null): string | null {
  const h = instagramHandle(raw);
  return h ? `https://instagram.com/${h}` : null;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** Hash determinístico simples (FNV-1a) para escolher variações de forma estável. */
export function hashString(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Gerador pseudo-aleatório determinístico (mulberry32) */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(arr: readonly T[], rnd: () => number): T {
  return arr[Math.floor(rnd() * arr.length)];
}

export function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

export function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
