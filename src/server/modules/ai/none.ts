/**
 * NoAIProvider — fallback determinístico. Usa a biblioteca de copy do engine.
 * É o provider padrão e garante que nada no GZ OS dependa de IA.
 */
import { createPicker, getCopy } from '../../../engine/copy';
import { isSegmentId } from '@shared/segments';
import type { AIContext, AIProvider, AuditSummaryInput, Tone } from './provider';

export class NoAIProvider implements AIProvider {
  readonly id = 'none';
  readonly available = false;

  async improveCopy(text: string): Promise<string> {
    // sem IA: só normaliza espaços e pontuação final
    const t = text.replace(/\s+/g, ' ').trim();
    return /[.!?…]$/.test(t) || t.length < 20 ? t : t + '.';
  }

  async headlines(ctx: AIContext, count = 3): Promise<string[]> {
    const copy = getCopy(isSegmentId(ctx.segment) ? ctx.segment : 'servicos');
    const pick = createPicker({ empresa: ctx.company, cidade: ctx.city }, ctx.company);
    return copy.hero.headline.slice(0, count).map((h) => pick.text(h).replace(/\*/g, ''));
  }

  async adaptTone(text: string, tone: Tone): Promise<string> {
    const map: Record<Tone, [RegExp, string][]> = {
      formal: [
        [/\bvocê\b/gi, 'o(a) senhor(a)'],
        [/\ba gente\b/gi, 'nós'],
        [/\bOi\b/g, 'Olá'],
      ],
      amigavel: [
        [/\bOlá\b/g, 'Oi'],
        [/\bnós\b/gi, 'a gente'],
      ],
      direto: [
        [/\bsem compromisso\b/gi, ''],
        [/\s{2,}/g, ' '],
      ],
      premium: [
        [/\bbarato\b/gi, 'acessível'],
        [/\bpreço\b/gi, 'investimento'],
      ],
      descontraido: [
        [/\bOlá\b/g, 'E aí'],
        [/\bPrezado\b/gi, 'Fala'],
      ],
    };
    let out = text;
    for (const [re, rep] of map[tone] ?? []) out = out.replace(re, rep);
    return out.replace(/ {2,}/g, ' ').trim();
  }

  async summarizeAudit(a: AuditSummaryInput): Promise<string> {
    const worst = Object.entries(a.scores)
      .filter(([k]) => k !== 'overall')
      .sort((x, y) => x[1] - y[1])
      .slice(0, 2)
      .map(([k, v]) => `${labelFor(k)} (${v})`);
    const top = a.opportunities.slice(0, 3).map((o) => o.title.toLowerCase());
    return `O site ${a.url} está com nota geral ${a.scores.overall}/100. Os pontos mais fracos são ${worst.join(' e ')}. Na prática, isso significa ${top.join(', ')}. Um site novo resolve esses pontos e transforma visitas em contatos pelo WhatsApp.`;
  }

  async proposalText(ctx: AIContext & { problems: string[]; pages: string[] }): Promise<string> {
    return `Propomos um novo site para a ${ctx.company}, focado em resolver ${ctx.problems.length ? ctx.problems.slice(0, 2).join(' e ').toLowerCase() : 'os principais pontos de conversão'}: visual profissional, carregamento rápido, WhatsApp sempre à mão e otimização para buscas locais${ctx.city ? ` em ${ctx.city}` : ''}. Estrutura: ${ctx.pages.join(', ')}.`;
  }

  async suggestStructure(ctx: AIContext): Promise<string[]> {
    const copy = getCopy(isSegmentId(ctx.segment) ? ctx.segment : 'servicos');
    const layout = copy.layouts[0];
    const { LAYOUTS } = await import('../../../engine/presets/layouts');
    return LAYOUTS[layout].map((b) => b.type);
  }
}

function labelFor(k: string) {
  return (
    (
      {
        visual: 'visual',
        mobile: 'mobile',
        performance: 'performance',
        seo: 'SEO',
        conversion: 'conversão',
        security: 'segurança',
      } as Record<string, string>
    )[k] ?? k
  );
}
