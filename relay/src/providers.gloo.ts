/** Gloo AI Studio adapter (no SDK import, so it is unit-tested directly). */
import type { Complete } from './core';
import type { Env } from './providers';

const MAX_TOKENS = 600;

/**
 * Gloo AI Studio (OpenAI-compatible), the "guarded" endpoint (moderation and
 * values alignment). Exactly one routing field: `model` (no auto_routing, so
 * results stay reproducible). A refusal or non-JSON reply is a failure; the
 * app then uses its on-device matcher (its crisis regex always runs first).
 */
export function glooProvider(env: Env, f: typeof fetch = fetch): Complete {
  if (!env.GLOO_API_KEY) throw new Error('GLOO_API_KEY is not set');
  if (!env.GLOO_MODEL) throw new Error('GLOO_MODEL is not set (pick a Claude-family id from the live model catalog)');
  return async (system, user) => {
    const res = await f('https://platform.ai.gloo.com/ai/v2/guarded/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.GLOO_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: env.GLOO_MODEL,
        max_tokens: MAX_TOKENS,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });
    if (!res.ok) throw new Error(`gloo HTTP ${res.status}`);
    const j = (await res.json()) as { choices?: { message?: { content?: string; refusal?: string } }[] };
    const msg = j.choices?.[0]?.message;
    if (!msg || msg.refusal || typeof msg.content !== 'string') throw new Error('gloo refusal or empty reply');
    return msg.content;
  };
}
