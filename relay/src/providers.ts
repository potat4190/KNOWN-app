/**
 * Two adapters behind one interface: complete(system, user) → string.
 * AI_PROVIDER=anthropic|gloo picks one. Provider keys live only in Worker secrets.
 */
import Anthropic from '@anthropic-ai/sdk';
import type { Complete } from './core';
import { glooProvider } from './providers.gloo';

export type Env = {
  AI_PROVIDER?: string;
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  GLOO_API_KEY?: string;
  GLOO_MODEL?: string;
};

const MAX_TOKENS = 600; // short JSON replies

export function anthropicProvider(env: Env): Complete {
  if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not set');
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1, timeout: 7_000 });
  const model = env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001';
  return async (system, user) => {
    const res = await client.messages.create({
      model,
      max_tokens: MAX_TOKENS,
      system,
      messages: [{ role: 'user', content: user }],
    });
    if (res.stop_reason === 'refusal') throw new Error('refusal');
    return res.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  };
}

export function providerFor(env: Env): { name: string; complete: Complete } {
  const name = (env.AI_PROVIDER || 'anthropic').toLowerCase();
  if (name === 'gloo') return { name, complete: glooProvider(env) };
  return { name: 'anthropic', complete: anthropicProvider(env) };
}
