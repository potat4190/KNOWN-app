/**
 * Her prayer, one line at a time (Stay here a moment, Oct 6 redesign).
 *
 * Team decision (Oct 6, option 2): AI may choose WHERE the lines break, never the words.
 * The relay's answer is accepted only when its lines contain exactly her text, character
 * for character apart from spacing (`sameText`). Anything else — no relay, a timeout, a
 * refusal, an extra word, a fixed typo — falls back to the on-device split below, which
 * never changes a character either.
 */
import type { Lang } from '@/i18n/langs';
import type { RelayDeps } from '@/services/matcher/matcher';

export type PrayerLines = { lines: string[]; source: 'ai' | 'local' };

export const LINES_TIMEOUT_MS = 4000;
/** How long Stay here a moment waits for the AI before starting with the on-device lines. */
export const LINES_WAIT_MS = 2500;
export const MAX_LINES_TEXT = 1500;
export const MAX_LINES = 40;

const END = '.!?。！？؟။';
const COMMAS = /[,;،、，၊]\s*/g;
const CJK = /[぀-ヿ㐀-鿿]/;

/** Removes all whitespace: the comparison key for "same words". */
const squash = (s: string) => s.replace(/\s+/g, '');

/** True when the lines are exactly her text (only spacing and line breaks may differ). */
export function sameText(lines: readonly string[], text: string): boolean {
  if (!lines.length || lines.length > MAX_LINES) return false;
  if (lines.some((l) => typeof l !== 'string' || !l.trim())) return false;
  return squash(lines.join('')) === squash(text);
}

/** Splits one long sentence at the comma nearest its middle (keeps the comma on the first half). */
function halve(s: string, limit: number): string[] {
  if (s.length <= limit) return [s];
  const mid = s.length / 2;
  let best = -1;
  for (const m of s.matchAll(COMMAS)) {
    const at = (m.index ?? 0) + m[0].trimEnd().length;
    if (best < 0 || Math.abs(at - mid) < Math.abs(best - mid)) best = at;
  }
  if (best < 8 || best > s.length - 8) return [s];
  return [...halve(s.slice(0, best).trim(), limit), ...halve(s.slice(best).trim(), limit)];
}

/**
 * On-device split: one line per sentence (any of the five languages' sentence marks),
 * long sentences halved at a comma. Never changes a character, so sameText() always holds.
 */
export function splitLocal(text: string): string[] {
  const out: string[] = [];
  for (const para of text.split(/\n+/)) {
    const p = para.trim();
    if (!p) continue;
    const sentences = p.match(new RegExp(`[^${END}]+[${END}]*[”"’»」)]*\\s*|[${END}]+\\s*`, 'g')) ?? [p];
    for (const raw of sentences) {
      const s = raw.trim();
      if (!s) continue;
      out.push(...halve(s, CJK.test(s) ? 34 : 90));
    }
  }
  return out;
}

/** How long a line stays the newest one: enough to read it slowly. */
export const lineMs = (line: string) => {
  const weight = CJK.test(line) ? line.length * 2.2 : line.length;
  return Math.min(7500, Math.max(3200, 2400 + weight * 60));
};

/** AI line breaks via the relay, verified; the on-device split otherwise. Never throws. */
export async function breakLines(text: string, lang: Lang, deps: RelayDeps | null): Promise<PrayerLines> {
  const local = { lines: splitLocal(text), source: 'local' as const };
  const body = text.trim();
  if (!deps?.url || !body || body.length > MAX_LINES_TEXT) return local;
  const clock = deps.now ?? Date.now;
  const t0 = clock();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LINES_TIMEOUT_MS);
  try {
    const res = await deps.fetch(`${deps.url}/lines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Install-Id': deps.installId },
      body: JSON.stringify({ text: body, lang }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = (await res.json()) as { lines?: unknown };
    const lines = Array.isArray(j?.lines) ? j.lines.map((l) => String(l).trim()).filter(Boolean) : [];
    if (!sameText(lines, body)) throw new Error('changed her words');
    deps.log?.({ kind: 'lines', source: 'Relay /lines', ms: clock() - t0, input: body, output: lines });
    return { lines, source: 'ai' };
  } catch (e) {
    deps.log?.({
      kind: 'lines',
      source: 'Relay /lines',
      ms: clock() - t0,
      input: body,
      error: String((e as Error)?.name === 'AbortError' ? 'timeout' : e),
    });
    return local;
  } finally {
    clearTimeout(timer);
  }
}
