/**
 * Gerador de copy sem IA: escolhe frases da biblioteca do segmento de forma determinística
 * (seed = nome da empresa + variação) e interpola variáveis.
 */
import type { SegmentId } from '@shared/segments';
import { hashString, seededRandom } from '@shared/utils';
import type { SegmentCopy } from './types';
import { serralheria, arquitetura, restaurante, buffet, oficina } from './segments-a';
import { lojaAutomotiva, concessionaria, clinica, medico, advogado } from './segments-b';
import { imobiliaria, construcao, academia, estetica, barbearia } from './segments-c';
import { loja, ecommerce, servicos, b2b, industria } from './segments-d';

export const COPY_LIBRARY: Record<SegmentId, SegmentCopy> = {
  serralheria,
  arquitetura,
  restaurante,
  buffet,
  oficina,
  'loja-automotiva': lojaAutomotiva,
  concessionaria,
  clinica,
  medico,
  advogado,
  imobiliaria,
  construcao,
  academia,
  estetica,
  barbearia,
  loja,
  ecommerce,
  servicos,
  b2b,
  industria,
};

export function getCopy(segment: string): SegmentCopy {
  return COPY_LIBRARY[segment as SegmentId] ?? COPY_LIBRARY.servicos;
}

export interface CopyVars {
  empresa: string;
  cidade?: string;
  estado?: string;
  anos?: number;
  responsavel?: string;
  regiao?: string;
}

const VAR_RE = /\{(empresa|cidade|estado|anos|responsavel|regiao)\}/g;

/** Verifica se o texto usa variáveis que não temos (ex.: {anos} sem anos informados). */
export function usable(text: string, vars: CopyVars): boolean {
  let ok = true;
  text.replace(VAR_RE, (_m, k: keyof CopyVars) => {
    if (k === 'anos' && !vars.anos) ok = false;
    if (k === 'responsavel' && !vars.responsavel) ok = false;
    return '';
  });
  return ok;
}

export function interpolate(text: string, vars: CopyVars): string {
  return text.replace(VAR_RE, (_m, k: keyof CopyVars) => {
    switch (k) {
      case 'empresa':
        return vars.empresa;
      case 'cidade':
        return vars.cidade || vars.regiao || 'toda a região';
      case 'estado':
        return vars.estado || '';
      case 'anos':
        return vars.anos ? String(vars.anos) : '';
      case 'responsavel':
        return vars.responsavel || vars.empresa;
      case 'regiao':
        return vars.regiao || (vars.cidade ? `${vars.cidade} e região` : 'toda a região');
    }
    return '';
  });
}

/**
 * Seleciona um texto de uma lista, determinístico pelo seed; pula textos com variáveis indisponíveis.
 * `slot` separa escolhas por campo para evitar que todas as listas usem o mesmo índice.
 */
export function createPicker(vars: CopyVars, seed: string) {
  let counter = 0;
  const base = hashString(seed);
  return {
    pick(list: string[], slot?: number): string {
      const candidates = list.filter((t) => usable(t, vars));
      const pool = candidates.length ? candidates : list;
      if (!pool.length) return '';
      const rnd = seededRandom(base + (slot ?? counter++) * 7919);
      return interpolate(pool[Math.floor(rnd() * pool.length)], vars);
    },
    text(t: string): string {
      return interpolate(t, vars);
    },
    /** interpola campos string de um objeto (raso) */
    obj<T extends Record<string, unknown>>(o: T): T {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(o)) out[k] = typeof v === 'string' ? interpolate(v, vars) : v;
      return out as T;
    },
    list<T extends Record<string, unknown>>(arr: T[]): T[] {
      return arr
        .filter((o) => Object.values(o).every((v) => typeof v !== 'string' || usable(v, vars)))
        .map((o) => this.obj(o));
    },
  };
}

export type { SegmentCopy, LayoutArchetype } from './types';
