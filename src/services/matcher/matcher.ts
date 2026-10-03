/**
 * Own words → a story (brief 8.8). Order:
 *  1. on-device crisis regex (always, before anything leaves the phone)
 *  2. relay /match with an 8 s timeout (only if a relay URL is configured)
 *  3. on failure, the on-device matcher (AI.local port)
 * The relay's `feelings` are used only for the internal mapping; never shown or stored.
 * The relay's reason is the only AI text in the app besides translations, and never Scripture.
 */
import { CRISIS } from '@/content/crisis';
import { isPathKey } from '@/lib/content';
import { LANG_INFO, type Lang } from '@/i18n/langs';
import type { MatchResult } from '@/state/session';
import { matchLocal } from './local';

export const MATCH_TIMEOUT_MS = 8000;
export const TRANSLATE_TIMEOUT_MS = 12000;

export type LogFn = (e: {
  kind: 'match' | 'translate';
  source: string;
  ms: number;
  input: string;
  output?: unknown;
  error?: string;
}) => void;

export type RelayDeps = {
  url: string;
  installId: string;
  fetch: typeof fetch;
  log?: LogFn;
  now?: () => number;
};

export const isCrisis = (text: string) => CRISIS.test(text);

async function post(deps: RelayDeps, path: string, body: unknown, timeoutMs: number): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await deps.fetch(`${deps.url}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Install-Id': deps.installId },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Validates the relay's reply: the key must exist in the content pack. */
export function parseMatch(j: unknown): MatchResult {
  const r = (j ?? {}) as Record<string, unknown>;
  const key = isPathKey(r.key) ? r.key : null;
  return {
    key,
    confidence: key ? Math.max(0, Math.min(1, Number(r.confidence) || 0)) : 0,
    reason: String(r.reason ?? '').slice(0, 240),
    feelings: Array.isArray(r.feelings) ? r.feelings.slice(0, 2).map(String) : [],
    risk: !!r.risk,
    source: 'ai',
  };
}

export async function match(text: string, lang: Lang, deps: RelayDeps | null): Promise<MatchResult> {
  const risky = isCrisis(text);
  const clock = deps?.now ?? Date.now;
  const t0 = clock();
  if (deps?.url) {
    try {
      const out = parseMatch(await post(deps, '/match', { text: text.slice(0, 1200), lang }, MATCH_TIMEOUT_MS));
      out.risk = out.risk || risky;
      deps.log?.({ kind: 'match', source: 'Relay /match', ms: clock() - t0, input: text, output: { ...out } });
      return out;
    } catch (e) {
      deps.log?.({
        kind: 'match',
        source: 'Relay /match',
        ms: clock() - t0,
        input: text,
        error: String((e as Error)?.name === 'AbortError' ? 'timeout' : e),
      });
    }
  }
  const out = matchLocal(text);
  out.risk = out.risk || risky;
  deps?.log?.({ kind: 'match', source: 'On-device matcher', ms: clock() - t0, input: text, output: { ...out } });
  return out;
}

/** Translate + back-translation via the relay. Throws when unavailable (the screen shows tr_off; copy still works). */
export async function translateMessage(
  msg: string,
  from: Lang,
  to: Lang,
  deps: RelayDeps | null,
): Promise<{ translation: string; back: string }> {
  if (!deps?.url) throw new Error('unavailable');
  const clock = deps.now ?? Date.now;
  const t0 = clock();
  const input = `${LANG_INFO[from].en} → ${LANG_INFO[to].en}: ${msg}`;
  try {
    const r = (await post(deps, '/translate', { text: msg.slice(0, 1500), from, to }, TRANSLATE_TIMEOUT_MS)) as Record<
      string,
      unknown
    >;
    const out = { translation: String(r?.translation ?? ''), back: String(r?.back ?? '') };
    if (!out.translation) throw new Error('empty');
    deps.log?.({ kind: 'translate', source: 'Relay /translate', ms: clock() - t0, input, output: out });
    return out;
  } catch (e) {
    deps.log?.({ kind: 'translate', source: 'Relay /translate', ms: clock() - t0, input, error: String(e) });
    throw e;
  }
}
