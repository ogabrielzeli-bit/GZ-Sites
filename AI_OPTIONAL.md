# IA opcional

O GZ OS **não depende de IA**. Nenhuma auditoria, prévia, proposta, mensagem, build, QA ou deploy chama um modelo. A IA é uma camada opcional para refinar textos.

## Princípio

- Fable 5 (ou qualquer modelo) foi usado **durante o desenvolvimento** para projetar e escrever o sistema.
- Em runtime, `AI_PROVIDER=none` é o padrão e tudo funciona.
- Toda função de IA tem um **fallback determinístico** (`NoAIProvider`), e os providers reais caem nesse fallback se a chamada falhar (rede, chave inválida, limite).
- Nunca há chamada por cliente/site/auditoria de forma automática: a IA só roda quando você clica em um botão específico.

## Interface

`src/server/modules/ai/provider.ts`:

```ts
interface AIProvider {
  id: string; available: boolean;
  improveCopy(text, ctx)            // melhora um texto
  headlines(ctx, count)             // headlines alternativas
  adaptTone(text, tone, ctx)        // formal | amigavel | direto | premium | descontraido
  summarizeAudit(audit, ctx)        // resumo em linguagem de venda
  proposalText(ctx + problemas)     // parágrafo "A solução"
  suggestStructure(ctx)             // lista de seções
}
```

Implementações:
- `none.ts` — **NoAIProvider**: usa a biblioteca de copy, regras simples de tom e textos-modelo.
- `llm.ts` — **LLMProvider** genérico sobre um `ChatBackend`:
  - `openAICompatibleBackend` — OpenAI e qualquer API compatível (Ollama, LM Studio, Groq, OpenRouter…), via `fetch`, sem SDK.
  - `anthropicBackend` — Messages API da Anthropic, via `fetch`.
- `index.ts` — `createAIProvider(settings)` escolhe pelo `.env` + preferência salva nas Configurações. Sem chave → NoAI.

## Configurar

`.env`:
```
AI_PROVIDER=openai            # none | openai | anthropic | openai-compatible
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
# ou
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001
# ou local
OPENAI_COMPATIBLE_BASE_URL=http://localhost:11434/v1
OPENAI_COMPATIBLE_MODEL=llama3.1
```
No painel (**Configurações → IA opcional**) você escolhe o provider preferido, modelo e base URL — as chaves ficam só no `.env`. O status aparece como "ativo (openai)" ou "desligado".

## Onde a IA aparece no painel

| Lugar | Botão | Sem IA |
| --- | --- | --- |
| Auditoria | Gerar resumo | resumo por regras (piores categorias + oportunidades) |
| Proposta | Regerar texto | texto-modelo com problemas e páginas |
| Mensagens | Adaptar tom (só aparece com IA ativa) | — (templates já são naturais) |
| API `/api/ai/copy` | improve / headlines / tone / structure | copy da biblioteca |

## Custos

Só se você ligar um provider pago. As chamadas são curtas (≤ 600 tokens de saída) e disparadas manualmente. Modelos locais (Ollama) custam zero.

## Adicionar outro provider

Implemente um `ChatBackend` (`chat(system, user, opts) → Promise<string>`) em `llm.ts` e registre em `createAIProvider`. A interface `AIProvider` não muda.
