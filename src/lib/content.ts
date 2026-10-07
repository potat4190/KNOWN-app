/**
 * Typed access to the generated content pack (src/content/), ported from the
 * Design Lab's helpers: P(), B(), range(), ref(), chapterOf(), versionOf(),
 * hasLang(), verseText(), selKey(), sceneOf().
 */
import passagesJson from '@/content/passages.json';
import booksJson from '@/content/books.json';
import versionsJson from '@/content/versions.json';
import breathJson from '@/content/breath.json';
import matrixJson from '@/content/matrix.json';
import altJson from '@/content/alt.json';
import lamentsJson from '@/content/laments.json';
import rotationJson from '@/content/rotation.json';
import storyChaptersJson from '@/content/story-chapters.json';
import stepsJson from '@/content/steps.json';
import pathsEn from '@/content/paths.en.json';
import pathsMy from '@/content/paths.my.json';
import pathsZh from '@/content/paths.zh.json';
import pathsJa from '@/content/paths.ja.json';
import pathsAr from '@/content/paths.ar.json';
import bridgesEn from '@/content/bridges.en.json';
import bridgesMy from '@/content/bridges.my.json';
import bridgesZh from '@/content/bridges.zh.json';
import bridgesJa from '@/content/bridges.ja.json';
import bridgesAr from '@/content/bridges.ar.json';
import { SCENES, PICTURES, type SceneKey } from '@/content/images';
import { LANG_INFO, localizeDigits, type Lang } from '@/i18n/langs';

export type PathKey = keyof typeof pathsEn;
export type Pic = 'S' | 'F' | 'A' | 'J';
export type SelKey = keyof typeof matrixJson.matrix;
export type BridgeKey = SelKey | 'NW';

export type Passage = {
  book: string;
  ch: number;
  from: number;
  to: number;
  list?: number[];
  vvText?: string;
  ex: number[];
  text: Partial<Record<Lang, Record<string, string>>>;
};
export type PathContent = {
  name: string;
  title: string;
  frame: string;
  intro: string;
  story: string[];
  invite: string;
  q: string;
  options: string[];
  prayer: string;
  reflect: string;
};
type Book = { usfm: string; osis: string; wp: string } & Partial<Record<Lang, string>> & { en: string };

export const PASSAGES = passagesJson as unknown as Record<PathKey, Passage>;
export const BOOKS = booksJson as unknown as Record<string, Book>;
export const VERSIONS = versionsJson as Record<Lang, { abbr: string; name: string }>;
export const PATHS = { en: pathsEn, my: pathsMy, zh: pathsZh, ja: pathsJa, ar: pathsAr } as unknown as Record<
  Lang,
  Record<PathKey, PathContent>
>;
export const BRIDGES = { en: bridgesEn, my: bridgesMy, zh: bridgesZh, ja: bridgesJa, ar: bridgesAr } as Record<
  Lang,
  Record<BridgeKey, { h: string; p: string }>
>;
export const BREATH = breathJson as unknown as Record<
  PathKey,
  { v: string; t: Partial<Record<Lang, [string, string]>> }
>;
export const ORDER = matrixJson.order as Pic[];
export const MATRIX = matrixJson.matrix as Record<SelKey, { path: PathKey; alt: PathKey }>;
export const NW = matrixJson.nw as PathKey;
export const ALT = altJson as Partial<Record<PathKey, PathKey>>;
export const LAMENTS = lamentsJson as PathKey[];
export const ROTATION = rotationJson as Record<SelKey, PathKey[]>;
export const STORY_CHAPTERS = storyChaptersJson as Partial<Record<PathKey, { book: string; from: number; to: number }>>;
export const STEP_DOT = stepsJson.dot as Record<string, number>;
export const STEP_NAME = stepsJson.stepName as Record<string, string>;
export const PATH_KEYS = Object.keys(pathsEn) as PathKey[];
export const SEL_KEYS = Object.keys(matrixJson.matrix) as SelKey[];

export const isPathKey = (k: unknown): k is PathKey => typeof k === 'string' && k in pathsEn;

/** A path field in `lang`, falling back to English. */
export function P<F extends keyof PathContent>(path: PathKey, f: F, lang: Lang): PathContent[F] {
  return PATHS[lang]?.[path]?.[f] ?? PATHS.en[path][f];
}

/** The bridge sentence for a selection, falling back to English. */
export const B = (sel: BridgeKey, lang: Lang) => BRIDGES[lang]?.[sel] ?? BRIDGES.en[sel];

/** Every verse number in the passage (list, or from–to). */
export const range = (p: Passage): number[] => {
  if (p.list) return p.list.slice();
  const a: number[] = [];
  for (let v = p.from; v <= p.to; v++) a.push(v);
  return a;
};

export const bookName = (book: string, lang: Lang) => BOOKS[book][lang] || BOOKS[book].en;

/**
 * In right-to-left text the bidi algorithm reorders "1:2–4" into "4–1:2". The numbers stay
 * one left-to-right unit inside U+2066 LEFT-TO-RIGHT ISOLATE … U+2069 POP DIRECTIONAL ISOLATE.
 */
const refNumbers = (s: string, lang: Lang) => (LANG_INFO[lang].rtl ? `⁦${s}⁩` : s);

/** "Ruth 1:14–18", "Psalm 13:1–2, 5", with localised book name and digits. */
export function ref(path: PathKey, lang: Lang): string {
  const p = PASSAGES[path];
  const r = p.vvText ? `${p.ch}:${p.vvText}` : p.from === p.to ? `${p.ch}:${p.from}` : `${p.ch}:${p.from}–${p.to}`;
  return `${bookName(p.book, lang)} ${refNumbers(localizeDigits(r, lang), lang)}`;
}

/** True when `vv` is every verse of the passage (the card's excerpt is the whole of it). */
export const isWholePassage = (path: PathKey, vv: readonly number[]) => {
  const all = range(PASSAGES[path]);
  return vv.length === all.length && vv.every((v, i) => v === all[i]);
};

/**
 * The reference for the verses a card actually shows: "Psalm 142:4–5" under the excerpt,
 * the passage's own reference ("Psalm 142:1–7", "Psalm 13:1–2, 5") when it shows all of it.
 */
export function shownRef(path: PathKey, vv: readonly number[], lang: Lang): string {
  if (isWholePassage(path, vv)) return ref(path, lang);
  const p = PASSAGES[path];
  const r = `${p.ch}:${runs([...vv])
    .map(([a, z]) => (a === z ? `${a}` : `${a}–${z}`))
    .join(', ')}`;
  return `${bookName(p.book, lang)} ${refNumbers(localizeDigits(r, lang), lang)}`;
}

/** The {ref} in "In our words, from {ref}": a reviewed storyChapters override, else the passage chapter. */
export function storySource(path: PathKey, lang: Lang): string {
  const o = STORY_CHAPTERS[path];
  if (o) {
    const chs = o.from === o.to ? `${o.from}` : `${o.from}–${o.to}`;
    return `${bookName(o.book, lang)} ${refNumbers(localizeDigits(chs, lang), lang)}`;
  }
  const p = PASSAGES[path];
  return `${bookName(p.book, lang)} ${refNumbers(localizeDigits(p.ch, lang), lang)}`;
}

export const hasLang = (path: PathKey, lang: Lang) => {
  const t = PASSAGES[path].text[lang];
  return !!t && Object.keys(t).length > 0;
};

/** Bundled edition shown for this passage in `lang` (English when the passage isn't in that language). */
export const bundledVersion = (path: PathKey, lang: Lang) => (hasLang(path, lang) ? VERSIONS[lang] : VERSIONS.en);

export const verseText = (path: PathKey, v: number, lang: Lang) => {
  const tx = PASSAGES[path].text;
  return tx[lang]?.[String(v)] || tx.en?.[String(v)] || '';
};

/** Chosen pictures in ORDER (S, F, A, J): one of 10 keys. */
export const selKey = (pics: readonly Pic[]) => ORDER.filter((k) => pics.includes(k)).join('') as SelKey;

export const sceneOf = (path: string) => SCENES[path as SceneKey] ?? SCENES.close;
export { SCENES, PICTURES };

/** Groups verse numbers into consecutive runs: [1,2,5] → [[1,2],[5]]. */
export function runs(vv: number[]): [number, number][] {
  const out: [number, number][] = [];
  for (const v of vv) {
    const last = out[out.length - 1];
    if (last && v === last[1] + 1) last[1] = v;
    else out.push([v, v]);
  }
  return out;
}

/** USFM references for YouVersion, one per consecutive run: "PSA.13.1-2", "PSA.13.5". */
export function usfmRefs(path: PathKey, vv: number[]): string[] {
  const p = PASSAGES[path];
  const b = BOOKS[p.book].usfm;
  return runs(vv).map(([a, z]) => (a === z ? `${b}.${p.ch}.${a}` : `${b}.${p.ch}.${a}-${z}`));
}

export const chapterUsfm = (path: PathKey) => `${BOOKS[PASSAGES[path].book].usfm}.${PASSAGES[path].ch}`;
