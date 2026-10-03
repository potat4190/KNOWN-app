/**
 * KNOWN relay core: prompts, input/output validation and the two handlers.
 * Pure (no Workers or SDK imports) so it is unit-tested with a mocked provider.
 *
 * Prompts are ported from the Design Lab's AI.match / AI.translate. The rules:
 * choose exactly one key from the reviewed library; never quote or paraphrase
 * Scripture; one warm reason of at most 25 words in her language; `risk` for
 * suicide, self-harm or immediate danger; reply with JSON only.
 */
import pathsEn from '../../src/content/paths.en.json';
import passages from '../../src/content/passages.json';
import books from '../../src/content/books.json';

export type Complete = (system: string, user: string) => Promise<string>;

export const LANGS: Record<string, string> = {
  en: 'English',
  my: 'Burmese',
  zh: 'Simplified Chinese',
  ja: 'Japanese',
  ar: 'Arabic',
};
export const MAX_MATCH = 1200;
export const MAX_TRANSLATE = 1500;

type PathEn = { name: string; title: string; frame: string; options: string[] };
type Passage = { book: string; ch: number; from: number; to: number; vvText?: string };
const PATHS = pathsEn as unknown as Record<string, PathEn>;
const PASSAGES = passages as unknown as Record<string, Passage>;
const BOOKS = books as unknown as Record<string, { en: string }>;
export const KEYS = Object.keys(PATHS);

const ref = (k: string) => {
  const p = PASSAGES[k];
  const r = p.vvText ? `${p.ch}:${p.vvText}` : p.from === p.to ? `${p.ch}:${p.from}` : `${p.ch}:${p.from}–${p.to}`;
  return `${BOOKS[p.book].en} ${r}`;
};

/** The library list, built from the content pack (Design Lab AI.library()). */
export const library = () =>
  KEYS.map((k) => {
    const x = PATHS[k];
    return `- ${k}: ${x.name} (${ref(k)}), "${x.title}". ${x.frame} Speaks to: ${x.options.join(' / ')}`;
  }).join('\n');

export function matchPrompt(lang: string): string {
  return `You help KNOWN, a Christian app for international students living far from home, choose ONE Bible story from a fixed, team-reviewed library to meet what a student wrote. The student may write in any language.

LIBRARY (key: person, reference, title, summary):
${library()}

RULES
- Choose exactly one key from the library. Never invent a passage, and never quote or paraphrase Scripture.
- "reason": one warm sentence (at most 25 words) written in ${LANGS[lang] ?? 'English'}, addressed to the student as "you", saying why this person's story may feel familiar. No Bible quotations.
- "feelings": which of "sadness","fear","anger","enjoyment" the words carry (one or two).
- If the student only names a feeling (for example "I'm sad" or "I'm stressed"), still choose the story that best fits that feeling, with confidence of at least 0.5.
- Choose ps77 (Asaph) only when the student says they cannot pray, cannot find words, cannot sleep, or are too troubled to speak.
- "confidence": 0 to 1. Use below 0.45 only if the words carry no feeling or situation at all.
- "risk": true only if the words suggest suicide, self-harm, or immediate danger.

Reply with only JSON: {"key":"neh","confidence":0.8,"reason":"...","feelings":["fear"],"risk":false}`;
}

export const matchUser = (text: string) => `STUDENT WROTE:\n<<<${text.slice(0, MAX_MATCH)}>>>`;

export function translatePrompt(from: string, to: string): string {
  return `Translate this short personal message from ${LANGS[from]} into ${LANGS[to]}. Keep it warm, plain and natural, as one friend writing to another. Keep any Bible reference. Then translate your translation back into ${LANGS[from]}, so the writer can check the meaning.
Reply with only JSON: {"translation":"...","back":"..."}`;
}

export const translateUser = (msg: string) => `MESSAGE:\n<<<${msg.slice(0, MAX_TRANSLATE)}>>>`;

/** Pulls the first JSON object out of a model reply (tolerates code fences). */
export function parseJson(s: string): Record<string, unknown> | null {
  const t = s.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  try {
    const o = JSON.parse(t.slice(a, b + 1));
    return o && typeof o === 'object' && !Array.isArray(o) ? o : null;
  } catch {
    return null;
  }
}

export type MatchOut = { key: string; confidence: number; reason: string; feelings: string[]; risk: boolean };
const FEELINGS = new Set(['sadness', 'fear', 'anger', 'enjoyment']);

/** Schema check for /match: the key must be in the content pack. Returns null when invalid. */
export function validateMatch(o: Record<string, unknown> | null): MatchOut | null {
  if (!o || typeof o.key !== 'string' || !KEYS.includes(o.key)) return null;
  const c = Number(o.confidence);
  if (!Number.isFinite(c)) return null;
  const reason = typeof o.reason === 'string' ? o.reason.trim() : '';
  // One sentence, ≤ 25 words, and never a quotation (Scripture stays out of AI text).
  const words = reason.split(/\s+/).filter(Boolean).length;
  const safeReason = reason && words <= 40 && !/[“”"「」«»]/.test(reason) ? reason.slice(0, 240) : '';
  return {
    key: o.key,
    confidence: Math.max(0, Math.min(1, c)),
    reason: safeReason,
    feelings: Array.isArray(o.feelings)
      ? o.feelings
          .map(String)
          .filter((f) => FEELINGS.has(f))
          .slice(0, 2)
      : [],
    risk: o.risk === true,
  };
}

export function validateTranslate(o: Record<string, unknown> | null): { translation: string; back: string } | null {
  if (!o || typeof o.translation !== 'string' || !o.translation.trim() || typeof o.back !== 'string') return null;
  return { translation: o.translation.trim(), back: o.back.trim() };
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Calls the provider, validates, and retries once on an invalid reply. */
async function ask<T>(
  complete: Complete,
  system: string,
  user: string,
  validate: (o: Record<string, unknown> | null) => T | null,
): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    let text: string;
    try {
      text = await complete(system, user);
    } catch (e) {
      if (attempt === 1) throw new HttpError(502, `provider error: ${(e as Error).message}`);
      continue;
    }
    const out = validate(parseJson(text));
    if (out) return out;
  }
  throw new HttpError(502, 'invalid model reply');
}

export async function handleMatch(body: unknown, complete: Complete): Promise<MatchOut> {
  const b = (body ?? {}) as { text?: unknown; lang?: unknown };
  if (typeof b.text !== 'string' || !b.text.trim()) throw new HttpError(400, 'text required');
  if (b.text.length > MAX_MATCH) throw new HttpError(413, 'text too long');
  const lang = typeof b.lang === 'string' && LANGS[b.lang] ? b.lang : 'en';
  return ask(complete, matchPrompt(lang), matchUser(b.text), validateMatch);
}

export async function handleTranslate(
  body: unknown,
  complete: Complete,
): Promise<{ translation: string; back: string }> {
  const b = (body ?? {}) as { text?: unknown; from?: unknown; to?: unknown };
  if (typeof b.text !== 'string' || !b.text.trim()) throw new HttpError(400, 'text required');
  if (b.text.length > MAX_TRANSLATE) throw new HttpError(413, 'text too long');
  if (typeof b.from !== 'string' || !LANGS[b.from] || typeof b.to !== 'string' || !LANGS[b.to] || b.from === b.to)
    throw new HttpError(400, 'bad languages');
  return ask(complete, translatePrompt(b.from, b.to), translateUser(b.text), validateTranslate);
}

/** Fixed-window rate limiter (per isolate; best effort). Keys: IP and install id. */
export class RateLimiter {
  private hits = new Map<string, { n: number; reset: number }>();
  constructor(
    private limit: number,
    private windowMs: number,
  ) {}
  allow(key: string, now = Date.now()): boolean {
    const h = this.hits.get(key);
    if (!h || now >= h.reset) {
      this.hits.set(key, { n: 1, reset: now + this.windowMs });
      if (this.hits.size > 10_000) this.hits.clear();
      return true;
    }
    h.n += 1;
    return h.n <= this.limit;
  }
}
