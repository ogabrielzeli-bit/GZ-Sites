/**
 * Seleciona o provider de IA a partir do .env (+ preferência salva nas configurações).
 * Sem chave → NoAIProvider. Nunca lança erro na seleção.
 */
import { env } from '../../env';
import type { Settings } from '@shared/schemas';
import type { AIProvider } from './provider';
import { NoAIProvider } from './none';
import { LLMProvider, anthropicBackend, openAICompatibleBackend } from './llm';

export function createAIProvider(settings?: Settings): AIProvider {
  const pref =
    settings?.ai.provider && settings.ai.provider !== 'none' ? settings.ai.provider : env.ai.provider;
  const model = settings?.ai.model || '';
  switch (pref) {
    case 'openai':
      if (env.ai.openaiKey)
        return new LLMProvider(
          'openai',
          openAICompatibleBackend({
            baseUrl: 'https://api.openai.com/v1',
            apiKey: env.ai.openaiKey,
            model: model || env.ai.openaiModel,
          }),
        );
      break;
    case 'anthropic':
      if (env.ai.anthropicKey)
        return new LLMProvider(
          'anthropic',
          anthropicBackend({ apiKey: env.ai.anthropicKey, model: model || env.ai.anthropicModel }),
        );
      break;
    case 'openai-compatible': {
      const base = settings?.ai.baseUrl || env.ai.compatBaseUrl;
      if (base)
        return new LLMProvider(
          'openai-compatible',
          openAICompatibleBackend({
            baseUrl: base,
            apiKey: env.ai.compatKey,
            model: model || env.ai.compatModel || 'default',
          }),
        );
      break;
    }
  }
  return new NoAIProvider();
}

export function aiStatus(settings?: Settings) {
  const p = createAIProvider(settings);
  return {
    provider: p.id,
    available: p.available,
    configured: {
      openai: !!env.ai.openaiKey,
      anthropic: !!env.ai.anthropicKey,
      compatible: !!(settings?.ai.baseUrl || env.ai.compatBaseUrl),
    },
    envProvider: env.ai.provider,
  };
}

export type { AIProvider, AIContext, Tone } from './provider';
export { NoAIProvider } from './none';
