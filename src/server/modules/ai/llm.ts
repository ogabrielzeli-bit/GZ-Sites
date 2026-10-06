/**
 * LLMProvider — implementação genérica sobre um ChatBackend (OpenAI, Anthropic ou compatível).
 * Qualquer falha de rede/chave cai no NoAIProvider, para o fluxo nunca travar.
 */
import type { AIContext, AIProvider, AuditSummaryInput, ChatBackend, Tone } from './provider';
import { NoAIProvider } from './none';

const SYSTEM =
  'Você é redator sênior de uma agência de sites brasileira (GZ Sites). Escreve em português do Brasil, direto, sem clichês, sem emojis, focado em conversão para pequenas e médias empresas. Responda só com o texto pedido.';

export class LLMProvider implements AIProvider {
  readonly available = true;
  private fallback = new NoAIProvider();
  constructor(
    readonly id: string,
    private backend: ChatBackend,
  ) {}

  private ctxLine(ctx: AIContext) {
    return `Empresa: ${ctx.company}. Segmento: ${ctx.segment}.${ctx.city ? ` Cidade: ${ctx.city}.` : ''}${ctx.differentials?.length ? ` Diferenciais: ${ctx.differentials.join(', ')}.` : ''}${ctx.notes ? ` Observações: ${ctx.notes}` : ''}`;
  }

  private async safe<T>(fn: () => Promise<T>, fb: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (e) {
      console.warn(`[ai:${this.id}] falhou, usando fallback:`, (e as Error).message);
      return fb();
    }
  }

  improveCopy(text: string, ctx: AIContext) {
    return this.safe(
      async () =>
        (
          await this.backend.chat(
            SYSTEM,
            `${this.ctxLine(ctx)}\n\nMelhore este texto mantendo o sentido e o tamanho aproximado:\n\n${text}`,
          )
        ).trim(),
      () => this.fallback.improveCopy(text),
    );
  }

  headlines(ctx: AIContext, count = 3) {
    return this.safe(
      async () => {
        const out = await this.backend.chat(
          SYSTEM,
          `${this.ctxLine(ctx)}\n\nEscreva ${count} headlines curtas (máx. 9 palavras) para o topo do site. Uma por linha, sem numeração.`,
        );
        return out
          .split('\n')
          .map((l) => l.replace(/^[\d\-.*\s]+/, '').trim())
          .filter(Boolean)
          .slice(0, count);
      },
      () => this.fallback.headlines(ctx, count),
    );
  }

  adaptTone(text: string, tone: Tone, ctx: AIContext) {
    return this.safe(
      async () =>
        (
          await this.backend.chat(
            SYSTEM,
            `${this.ctxLine(ctx)}\n\nReescreva no tom "${tone}", mantendo o conteúdo:\n\n${text}`,
          )
        ).trim(),
      () => this.fallback.adaptTone(text, tone),
    );
  }

  summarizeAudit(a: AuditSummaryInput, ctx: AIContext) {
    return this.safe(
      async () =>
        (
          await this.backend.chat(
            SYSTEM,
            `${this.ctxLine(ctx)}\n\nResuma em 3 frases, para enviar ao dono da empresa no WhatsApp, o diagnóstico do site ${a.url}. Notas: ${JSON.stringify(a.scores)}. Problemas: ${a.opportunities.map((o) => o.title).join('; ')}. Termine convidando a ver uma prévia do site novo.`,
          )
        ).trim(),
      () => this.fallback.summarizeAudit(a),
    );
  }

  proposalText(ctx: AIContext & { problems: string[]; pages: string[] }) {
    return this.safe(
      async () =>
        (
          await this.backend.chat(
            SYSTEM,
            `${this.ctxLine(ctx)}\n\nEscreva o parágrafo "A solução" de uma proposta comercial de site (máx. 90 palavras). Problemas a resolver: ${ctx.problems.join('; ')}. Páginas: ${ctx.pages.join(', ')}.`,
          )
        ).trim(),
      () => this.fallback.proposalText(ctx),
    );
  }

  suggestStructure(ctx: AIContext) {
    return this.safe(
      async () => {
        const out = await this.backend.chat(
          SYSTEM,
          `${this.ctxLine(ctx)}\n\nListe, uma por linha, as seções ideais da home deste site (use só: header, hero, hero-fullscreen, hero-split, manifesto, benefits, services, about, numbers, projects, gallery, testimonials, faq, process, team, cta, contact, footer, whatsapp-float, sticky-cta).`,
        );
        return out
          .split('\n')
          .map((l) =>
            l
              .replace(/^[\d\-.*\s]+/, '')
              .trim()
              .toLowerCase(),
          )
          .filter(Boolean);
      },
      () => this.fallback.suggestStructure(ctx),
    );
  }
}

/** Backend OpenAI / compatível (Ollama, Groq, LM Studio…) via fetch, sem SDK. */
export function openAICompatibleBackend(o: { baseUrl: string; apiKey: string; model: string }): ChatBackend {
  return {
    async chat(system, user, opts) {
      const res = await fetch(`${o.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(o.apiKey ? { Authorization: `Bearer ${o.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: o.model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          max_tokens: opts?.maxTokens ?? 600,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      return j.choices?.[0]?.message?.content ?? '';
    },
  };
}

/** Backend Anthropic (Messages API) via fetch, sem SDK. */
export function anthropicBackend(o: { apiKey: string; model: string }): ChatBackend {
  return {
    async chat(system, user, opts) {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': o.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: o.model,
          max_tokens: opts?.maxTokens ?? 600,
          system,
          messages: [{ role: 'user', content: user }],
        }),
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const j = (await res.json()) as { content?: { type: string; text?: string }[] };
      return (j.content ?? [])
        .filter((c) => c.type === 'text')
        .map((c) => c.text ?? '')
        .join('\n');
    },
  };
}
