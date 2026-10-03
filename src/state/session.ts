/**
 * The session: one moment from Feel to Done. Pure and unit-testable, ported
 * from the Design Lab's state (fresh(), A.*, compose(), currentPrayer(),
 * saveMoment()). Side effects (DB, rotation, navigation) live in the store.
 */
import {
  ALT,
  B,
  LAMENTS,
  MATRIX,
  NW,
  P,
  STEP_DOT,
  STEP_NAME,
  ref,
  type BridgeKey,
  type PathKey,
  type Pic,
  type SelKey,
} from '@/lib/content';
import type { Lang } from '@/i18n/langs';
import type { Moment } from '@/data/types';
import { translate, type Vars } from '@/i18n/core';
import type { i18n as I18n } from 'i18next';

export type Screen = 'feel' | 'thinking' | 'crisis' | 'scripture' | 'pray' | 'after' | 'reach' | 'sit' | 'keep';
export const SESSION_SCREENS: Screen[] = [
  'feel',
  'thinking',
  'crisis',
  'scripture',
  'pray',
  'after',
  'reach',
  'sit',
  'keep',
];

export type MatchSource = 'ai' | 'local' | 'demo';
export type MatchResult = {
  key: PathKey | null;
  confidence: number;
  reason: string;
  /** Internal only: never displayed or stored (boundary 1). */
  feelings: string[];
  risk: boolean;
  source: MatchSource;
  unsure?: boolean;
};

export type Need = 'listen' | 'pray' | 'time';
export type MsgState = {
  to: 'guide' | 'friend';
  need: Need;
  /** The language the reader reads. */
  lang: Lang;
  /** Her edited text, or null while it is composed from the chips. */
  text: string | null;
  edited: boolean;
  tr: { translation: string; back: string } | null;
  trFor: string | null;
  keep: boolean;
};
export type KeepChoice = { passage: boolean; stay: boolean; prayer: boolean; words: boolean; msg: boolean };
export type ScriptureShown = { source: 'youversion' | 'bundled'; versionId: number | null; abbr: string };

export type SessionState = {
  screen: Screen;
  mode: 'pics' | 'words';
  pics: Pic[];
  words: string;
  from: 'pics' | 'nw' | 'words' | null;
  sel: SelKey | 'NW' | null;
  path: PathKey | null;
  ai: MatchResult | null;
  swapped: boolean;
  seen: PathKey[];
  stay: number | null;
  prayer: string | null;
  msg: MsgState;
  keep: KeepChoice;
  crisis: boolean;
  note: string | null;
  /** Set once a Moment is saved: Keep can't save the same moment twice. */
  savedMomentId: string | null;
  /** Opened from "With someone I trust" (tips on for this session). */
  guided: boolean;
  /** Which edition the Scripture card showed (stored with a Moment). */
  scripture: ScriptureShown | null;
};

export const freshSession = (lang: Lang, guided = false): SessionState => ({
  screen: 'feel',
  mode: 'pics',
  pics: [],
  words: '',
  from: null,
  sel: null,
  path: null,
  ai: null,
  swapped: false,
  seen: [],
  stay: null,
  prayer: null,
  msg: { to: 'guide', need: 'listen', lang, text: null, edited: false, tr: null, trFor: null, keep: false },
  keep: { passage: true, stay: true, prayer: true, words: false, msg: true },
  crisis: false,
  note: null,
  savedMomentId: null,
  guided,
  scripture: null,
});

/* ------------------------------ Feel ------------------------------ */

/** Choose 1–2 pictures; a third tap replaces the oldest; tapping a chosen one clears it. */
export function togglePic(s: SessionState, k: Pic): SessionState {
  const i = s.pics.indexOf(k);
  const pics = i >= 0 ? s.pics.filter((p) => p !== k) : [...(s.pics.length >= 2 ? s.pics.slice(1) : s.pics), k];
  return { ...s, pics, note: null };
}

/** Opens a story (pictures, no-words or own words). Resets everything chosen for a previous story. */
export function openStory(
  s: SessionState,
  o: { from: 'pics' | 'nw' | 'words'; sel: SelKey | 'NW' | null; path: PathKey; ai?: MatchResult | null },
): SessionState {
  return {
    ...s,
    from: o.from,
    sel: o.sel,
    path: o.path,
    ai: o.ai ?? null,
    seen: [o.path],
    swapped: false,
    stay: null,
    prayer: null,
    msg: { ...s.msg, text: null, edited: false, tr: null, trFor: null, keep: false },
    keep: { ...s.keep, msg: true },
    savedMomentId: null,
    scripture: null,
    note: null,
  };
}

export const openNoWords = (s: SessionState) => openStory(s, { from: 'nw', sel: 'NW', path: NW });

/**
 * Own-words result → story (Design Lab A.findStory acceptance rules).
 * Accept only keys in the content pack; below 0.45 use the internal feelings
 * → MATRIX with the "ai_start" copy; still nothing → ps77.
 */
export function acceptMatch(
  r: MatchResult,
  isKey: (k: unknown) => k is PathKey,
): { result: MatchResult; crisis: boolean } {
  const key = r.key && isKey(r.key) ? r.key : null;
  let result: MatchResult = { ...r, key };
  if (!key || r.confidence < 0.45) {
    const FE: Record<string, Pic> = { sadness: 'S', fear: 'F', anger: 'A', enjoyment: 'J' };
    const order: Pic[] = ['S', 'F', 'A', 'J'];
    const picks = (r.feelings || []).map((f) => FE[String(f).toLowerCase()]).filter(Boolean);
    const fk = order.filter((k) => picks.includes(k)).join('') as SelKey;
    const fromFeelings = fk && MATRIX[fk] ? MATRIX[fk].path : null;
    // In a crisis with no confident match, Psalm 77 follows the Crisis screen (Design Lab).
    result = r.risk
      ? { ...result, key: NW, reason: '' }
      : { ...result, key: fromFeelings || key || NW, reason: '', unsure: true };
  }
  return { result, crisis: !!r.risk };
}

/* ---------------------------- Scripture ---------------------------- */

/**
 * The bridge text (8.2). The primary story for a selection shows BR[sel].h +
 * BR[sel].p. Any other opened story (rotation or swap) shows BR[sel].h + that
 * story's own frame, because several bridge lines name a specific person.
 */
export function bridgeFor(s: SessionState, lang: Lang): { h: string; p: string } | null {
  if (!s.path || s.from === 'words') return null;
  const key: BridgeKey = s.path === NW && s.sel !== 'NW' && s.swapped ? 'NW' : ((s.sel as BridgeKey) ?? 'NW');
  const primary = key === 'NW' ? NW : MATRIX[key].path;
  const b = B(key, lang);
  return { h: b.h, p: s.path === primary ? b.p : P(s.path, 'frame', lang) };
}

/** Options on the Doesn't-fit sheet: a person story (once) and the lament psalms not yet seen. */
export function noFitOptions(s: SessionState): { person: PathKey | null; psalms: PathKey[] } {
  if (!s.path) return { person: null, psalms: [] };
  const alt = ALT[s.path] ?? null;
  const person = alt && !s.seen.includes(alt) && !LAMENTS.includes(alt) ? alt : null;
  const psalms = [NW, ...LAMENTS].filter((k) => k !== s.path && !s.seen.includes(k) && k !== person);
  return { person, psalms };
}

export function swap(s: SessionState, path: PathKey): SessionState {
  return {
    ...s,
    path,
    seen: [...s.seen, path],
    swapped: true,
    stay: null,
    prayer: null,
    msg: { ...s.msg, text: null, edited: false, tr: null, trFor: null },
    scripture: null,
  };
}

export const repick = (s: SessionState): SessionState => ({ ...s, pics: [], note: null, mode: 'pics', screen: 'feel' });

/* ------------------------------ Pray ------------------------------ */

export const toggleStay = (s: SessionState, i: number): SessionState => ({ ...s, stay: s.stay === i ? null : i });
export const setPrayer = (s: SessionState, text: string): SessionState => ({ ...s, prayer: text });

export const currentPrayer = (s: SessionState, lang: Lang) =>
  s.prayer != null ? s.prayer : s.path ? P(s.path, 'prayer', lang) : '';

/** She changed the prayer text (so swapping or ending must ask first). */
export const prayerEdited = (s: SessionState, lang: Lang) =>
  !!s.path && s.prayer != null && s.prayer !== P(s.path, 'prayer', lang);

export const stayText = (s: SessionState, lang: Lang) =>
  s.path && s.stay != null ? (P(s.path, 'options', lang)[s.stay] ?? null) : null;

/** Anything she typed or edited in this moment (confirm before throwing it away). */
export const hasTyped = (s: SessionState, lang: Lang) => prayerEdited(s, lang) || !!s.words.trim() || s.msg.edited;

/* ---------------------------- Reach out ---------------------------- */

type T = (key: string, vars?: Vars) => string;

/** m_hi + m_body (or m_body2) + m_<need>, in `lang` (Design Lab compose()). */
export function compose(s: SessionState, lang: Lang, t: T, hasKey: (k: string) => boolean): string {
  if (!s.path) return '';
  const name = P(s.path, 'name', lang);
  const r = ref(s.path, lang);
  const body = hasKey('m_body2') && r.startsWith(name) ? t('m_body2', { ref: r }) : t('m_body', { name, ref: r });
  return [t('m_hi'), body, t(`m_${s.msg.need}`)].join(' ');
}

export const setNeed = (s: SessionState, need: Need): SessionState => ({
  ...s,
  msg: { ...s.msg, need, text: s.msg.edited ? s.msg.text : null },
});
export const setMsgText = (s: SessionState, text: string): SessionState => ({
  ...s,
  msg: { ...s.msg, text, edited: true },
});
export const keepMsg = (s: SessionState): SessionState => ({
  ...s,
  msg: { ...s.msg, keep: true },
  keep: { ...s.keep, msg: true },
});

/* ------------------------------ Keep ------------------------------ */

export const toggleKeep = (s: SessionState, k: keyof KeepChoice): SessionState => ({
  ...s,
  keep: { ...s.keep, [k]: !s.keep[k] },
});

/** Which Keep rows are shown (brief table in section 7). */
export function keepRows(s: SessionState): (keyof KeepChoice)[] {
  const rows: (keyof KeepChoice)[] = ['passage'];
  if (s.stay != null) rows.push('stay');
  rows.push('prayer');
  if (s.from === 'words' && s.words.trim()) rows.push('words');
  if (s.msg.keep) rows.push('msg');
  return rows;
}

export const canSave = (s: SessionState) => !s.savedMomentId && keepRows(s).some((k) => s.keep[k]);

export function buildMoment(
  s: SessionState,
  o: { id: string; now: number; lang: Lang; msgText: string; scripture: ScriptureShown },
): Moment {
  if (!s.path || !s.from) throw new Error('No story to keep');
  const rows = new Set(keepRows(s));
  const want = (k: keyof KeepChoice) => rows.has(k) && s.keep[k];
  return {
    id: o.id,
    kind: 'moment',
    createdAt: o.now,
    lang: o.lang,
    path: s.path,
    sel: s.sel,
    from: s.from,
    passage: want('passage'),
    scriptureSource: o.scripture.source,
    versionId: o.scripture.versionId,
    abbr: o.scripture.abbr,
    stay: want('stay') ? stayText(s, o.lang) : null,
    stayIndex: want('stay') ? s.stay : null,
    prayer: want('prayer') ? currentPrayer(s, o.lang) : null,
    prayerEdited: want('prayer') && prayerEdited(s, o.lang),
    words: want('words') ? s.words.trim() : null,
    msg: want('msg') ? o.msgText : null,
  };
}

/* ------------------------------ Steps ------------------------------ */

export const dotFor = (screen: string): number | null => STEP_DOT[screen] ?? null;
export const stepNameFor = (screen: string) => STEP_NAME[screen] ?? 'st_feel';

export function tFor(inst: I18n, lang: Lang): T {
  return (key, vars) => translate(inst, lang, key, vars);
}
