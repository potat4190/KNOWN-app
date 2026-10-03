/**
 * The on-device matcher: an exact port of the Design Lab's AI.local().
 * Keyword rules per story (first match wins), then mood keywords → MATRIX.
 * The regexes are lifted verbatim into src/content/matcher-rules.ts.
 */
import { STORY_RULES, MOOD_RULES } from '@/content/matcher-rules';
import { MATRIX, selKey, type Pic, type PathKey, type SelKey } from '@/lib/content';
import type { MatchResult } from '@/state/session';

export function matchLocal(text: string): MatchResult {
  const s = text.toLowerCase();
  for (const [k, re] of STORY_RULES)
    if (re.test(s))
      return { key: k as PathKey, confidence: 0.6, reason: '', feelings: [], risk: false, source: 'local' };
  const hit = MOOD_RULES.filter((m) => m[2].test(s));
  if (hit.length) {
    const sel = selKey(hit.slice(0, 2).map((m) => m[0] as Pic)) as SelKey;
    return {
      key: MATRIX[sel].path,
      confidence: 0.5,
      reason: '',
      feelings: hit.slice(0, 2).map((m) => m[1]),
      risk: false,
      source: 'local',
    };
  }
  return { key: null, confidence: 0, reason: '', feelings: [], risk: false, source: 'local' };
}
