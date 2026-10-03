/**
 * Content validator (brief section 14). Runs in CI and before `npm test`.
 *
 *   npm run content:validate                    check everything
 *   npm run content:validate -- --update-snapshot   accept reviewed Scripture edits
 *
 * ✖ errors fail the run. ⚠ review items are known, allow-listed gaps that a
 * person on the team still needs to look at; they print every run so they
 * can't be forgotten, and they are listed in docs/CONTENT_REVIEW.md.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LANGS, type Lang } from '../src/i18n/langs';
import { DRAFTED } from '../src/i18n/drafted';
import { buildResources, CONTENT_STRINGS } from '../src/i18n/resources';
import { ALL_HELP_LINES, isVerified } from '../src/config/help-lines';

const ROOT = join(__dirname, '..');
const C = join(ROOT, 'src', 'content');
const SNAPSHOT = join(ROOT, 'scripts', 'scripture-snapshot.json');
const read = (f: string) => JSON.parse(readFileSync(join(C, f), 'utf8'));
const production = process.env.APP_VARIANT === 'production';

const errors: string[] = [];
const review: string[] = [];
const info: string[] = [];
const err = (s: string) => errors.push(s);

type PathContent = Record<string, string | string[]>;
const passages = read('passages.json') as Record<
  string,
  { ex: number[]; list?: number[]; from: number; to: number; text: Partial<Record<Lang, Record<string, string>>> }
>;
const paths = Object.fromEntries(LANGS.map((l) => [l, read(`paths.${l}.json`)])) as Record<
  Lang,
  Record<string, PathContent>
>;
const bridges = Object.fromEntries(LANGS.map((l) => [l, read(`bridges.${l}.json`)])) as Record<
  Lang,
  Record<string, { h: string; p: string }>
>;
const breath = read('breath.json') as Record<string, { v: string; t: Partial<Record<Lang, string[]>> }>;
const rotation = read('rotation.json') as Record<string, string[]>;
const { matrix, nw } = read('matrix.json') as { matrix: Record<string, { path: string; alt: string }>; nw: string };
const alt = read('alt.json') as Record<string, string>;
const laments = read('laments.json') as string[];
const applied = read('overrides.applied.json') as {
  target: string;
  status: string;
  reviewer: string;
  reason: string;
}[];
const pathKeys = Object.keys(paths.en);

/* ------------------------------------------------------------------ */
/* Known gaps (brief 2.2). Each is reported as a review item, not hidden. */
/* ------------------------------------------------------------------ */
const GAP_STRINGS: Record<string, Lang[]> = {
  // compose() uses m_body2 only where the language has it (Design Lab behaviour).
  m_body2: ['my', 'zh', 'ja'],
};
const GAP_PASSAGE = (path: string, lang: Lang) =>
  (lang === 'ar' && !['neh', 'hab'].includes(path)) || (laments.includes(path) && (lang === 'my' || lang === 'ar'));
/** Final verses that legitimately end mid-sentence (the sentence continues past the range), or editions without final punctuation. */
const OPEN_ENDINGS = (path: string, lang: Lang) => path === 'neh' || lang === 'ar';
/**
 * Reviewed copy where the app names her emotion (boundary 1). Not changed here:
 * Dorcas decides. Listed as review items so the team sees them every run.
 */
const EMOTION_REVIEW = new Set(['bridges.en.SF.h', 'bridges.en.FJ.h', 'bridges.ar.SF.h']);

/* ------------------------------------------------------------------ */
/* 1. Every path, string, bridge and breath key exists in all 5 languages */
/* ------------------------------------------------------------------ */
const enStrings = CONTENT_STRINGS.en;
for (const lang of LANGS) {
  for (const k of Object.keys(enStrings)) {
    if (CONTENT_STRINGS[lang][k] != null) continue;
    if (GAP_STRINGS[k]?.includes(lang))
      review.push(`strings.${lang}.${k}: missing (known gap; English fallback is not used — see GAP_STRINGS)`);
    else err(`strings.${lang}.${k}: missing`);
  }
  for (const pk of pathKeys) {
    const p = paths[lang][pk];
    if (!p) {
      err(`paths.${lang}.${pk}: missing`);
      continue;
    }
    for (const f of Object.keys(paths.en[pk])) {
      if (p[f] == null) err(`paths.${lang}.${pk}.${f}: missing`);
      else if (Array.isArray(paths.en[pk][f]) && (p[f] as string[]).length !== (paths.en[pk][f] as string[]).length)
        err(
          `paths.${lang}.${pk}.${f}: ${(p[f] as string[]).length} items, English has ${(paths.en[pk][f] as string[]).length}`,
        );
    }
  }
  for (const b of Object.keys(bridges.en)) {
    if (!bridges[lang][b]?.h || !bridges[lang][b]?.p) err(`bridges.${lang}.${b}: missing h or p`);
  }
  for (const pk of pathKeys) {
    const pair = breath[pk]?.t[lang];
    if (!pair || pair.length !== 2) err(`breath.${pk}.${lang}: missing breath pair`);
  }
  for (const pk of pathKeys) {
    const t = passages[pk].text[lang];
    if (t && Object.keys(t).length) continue;
    if (GAP_PASSAGE(pk, lang)) continue; // summarised below
    err(`passages.${pk}.${lang}: no Scripture text`);
  }
}
const arGaps = pathKeys.filter((k) => GAP_PASSAGE(k, 'ar'));
const myGaps = pathKeys.filter((k) => GAP_PASSAGE(k, 'my'));
review.push(
  `Arabic Scripture exists only for neh and hab; ${arGaps.length} passages show English with lang_fallback (known gap 2.2)`,
);
review.push(
  `Lament psalms have no Burmese text (${myGaps.join(', ')}); English is shown with lang_fallback (known gap 2.2)`,
);

// Drafted strings: same keys in every language, and every plural form each language needs.
const resources = buildResources();
const pluralBases = new Set<string>();
for (const k of Object.keys(DRAFTED.en)) {
  const m = /^(.*)_(zero|one|two|few|many|other)$/.exec(k);
  if (m) pluralBases.add(m[1]);
  else for (const lang of LANGS) if (!(k in DRAFTED[lang])) err(`drafted.${lang}.${k}: missing`);
}
pluralBases.add('removes_n');
pluralBases.add('removes_in');
for (const lang of LANGS) {
  const cats = new Intl.PluralRules(lang).resolvedOptions().pluralCategories.filter((c) => c !== 'zero');
  for (const base of pluralBases)
    for (const c of cats)
      if (!resources[lang].translation[`${base}_${c}`])
        err(`plural ${lang}.${base}_${c}: missing (Intl.PluralRules needs ${cats.join('/')})`);
}

/* ------------------------------------------------------------------ */
/* 2. Emotion words never appear in user-facing strings (boundary 1)      */
/* ------------------------------------------------------------------ */
const EMOTION: Record<Lang, RegExp> = {
  en: /\b(sad|sadness|sadly|joy|joyful|enjoy|enjoyment|lonely|loneliness|fear|fears|fearful|afraid|anger|angry|happy|happiness)\b/i,
  zh: /悲伤|难过|喜乐|快乐|孤独|孤单|寂寞|愤怒|生气/,
  ja: /悲し|喜び|寂し|孤独|怒り/,
  my: /ဝမ်းနည်း|ပျော်ရွှင်|အထီးကျန်|ဒေါသ/,
  ar: /حزن|حزين|فرح|سعادة|سعيد|وحدة|وحيد|خوف|خائف|غضب|غاضب/,
};
const scanUi = (label: string, lang: Lang, text: string) => {
  const m = EMOTION[lang].exec(text);
  if (!m) return;
  if (EMOTION_REVIEW.has(label))
    review.push(`${label}: names her emotion ("${m[0]}") in reviewed copy — for Dorcas: "${text}"`);
  else err(`${label}: emotion word "${m[0]}" in user-facing text: "${text}"`);
};
for (const lang of LANGS) {
  for (const [k, v] of Object.entries(CONTENT_STRINGS[lang])) scanUi(`strings.${lang}.${k}`, lang, v);
  for (const [k, v] of Object.entries(DRAFTED[lang])) scanUi(`drafted.${lang}.${k}`, lang, v);
  for (const [k, v] of Object.entries(bridges[lang])) {
    scanUi(`bridges.${lang}.${k}.h`, lang, v.h);
    scanUi(`bridges.${lang}.${k}.p`, lang, v.p);
  }
  for (const [k, v] of Object.entries(breath))
    for (const line of v.t[lang] ?? []) scanUi(`breath.${k}.${lang}`, lang, line);
  // Story copy describes people in Scripture, not her; options and prayers are her own
  // editable voice. Reported for native readers, not failed (see docs/DECISIONS.md).
  const hits: string[] = [];
  for (const [pk, p] of Object.entries(paths[lang]))
    for (const [f, v] of Object.entries(p))
      for (const s of ([] as string[]).concat(v)) if (EMOTION[lang].test(s)) hits.push(`${pk}.${f}`);
  if (hits.length)
    info.push(
      `paths.${lang}: emotion words in story/voice copy (allowed; about a person in Scripture or her own words): ${hits.join(', ')}`,
    );
}

/* ------------------------------------------------------------------ */
/* 3. Story text is never styled as a Scripture quotation (boundary 4)     */
/* ------------------------------------------------------------------ */
for (const lang of LANGS)
  for (const [pk, p] of Object.entries(paths[lang]))
    for (const para of (p.story as string[]) ?? [])
      if (/^\s*[“"「『«]/.test(para) && /[”"」』»]\s*$/.test(para))
        err(`paths.${lang}.${pk}.story: a paragraph is wrapped in quotation marks`);

/* ------------------------------------------------------------------ */
/* 4. Time-neutral copy (she may open KNOWN at 2 p.m.)                    */
/* ------------------------------------------------------------------ */
const userFacing = (lang: Lang): [string, string][] => [
  ...Object.entries(CONTENT_STRINGS[lang]).map(([k, v]) => [`strings.${lang}.${k}`, v] as [string, string]),
  ...Object.entries(DRAFTED[lang]).map(([k, v]) => [`drafted.${lang}.${k}`, v] as [string, string]),
  ...Object.entries(bridges[lang]).flatMap(
    ([k, v]) =>
      [
        [`bridges.${lang}.${k}.h`, v.h],
        [`bridges.${lang}.${k}.p`, v.p],
      ] as [string, string][],
  ),
  ...Object.entries(paths[lang]).flatMap(([pk, p]) =>
    Object.entries(p).flatMap(([f, v]) =>
      ([] as string[]).concat(v).map((s) => [`paths.${lang}.${pk}.${f}`, s] as [string, string]),
    ),
  ),
  ...Object.entries(breath).flatMap(([k, v]) =>
    (v.t[lang] ?? []).map((s) => [`breath.${k}.${lang}`, s] as [string, string]),
  ),
];
for (const [label, s] of userFacing('en')) {
  const m = /\b(tonight|this evening|same evening)\b/i.exec(s);
  if (m) err(`${label}: time-bound "${m[0]}" (use "today" or "right now"): "${s}"`);
}
const NIGHT: Partial<Record<Lang, RegExp>> = {
  zh: /今晚|今夜|晚上/,
  ja: /今夜|今晩/,
  my: /ဒီည|ညနေ/,
  ar: /الليلة|هذا المساء|المساء/,
};
for (const lang of ['zh', 'ja', 'my', 'ar'] as Lang[]) {
  const hits = userFacing(lang)
    .filter(([, s]) => NIGHT[lang]!.test(s))
    .map(([l]) => l);
  if (hits.length) review.push(`time-neutral candidates for the ${lang} native reader: ${hits.join(', ')}`);
}

/* ------------------------------------------------------------------ */
/* 5. No visible placeholders                                           */
/* ------------------------------------------------------------------ */
for (const lang of LANGS)
  for (const [label, s] of userFacing(lang)) {
    const m = /TODO|\[[^\]]*\]|NIV\?|\bDraft\b|\{\{|lorem/i.exec(s);
    if (m) err(`${label}: placeholder "${m[0]}": "${s}"`);
  }

/* ------------------------------------------------------------------ */
/* 6. Every Help number is verified (reports now; fails in production)   */
/* ------------------------------------------------------------------ */
const unverified = ALL_HELP_LINES.filter((l) => !isVerified(l)).map((l) => l.id);
if (unverified.length) {
  const msg = `help-lines.ts: ${unverified.length} entries without verifiedBy/verifiedOn (${unverified.join(', ')}) — Kezia to verify`;
  if (production) err(msg);
  else review.push(msg);
}

/* ------------------------------------------------------------------ */
/* 7. Scripture snapshot: any edit to a verse fails until reviewed        */
/* ------------------------------------------------------------------ */
const hashes: Record<string, string> = {};
for (const [pk, p] of Object.entries(passages))
  for (const [lang, verses] of Object.entries(p.text))
    for (const [v, text] of Object.entries(verses ?? {}))
      hashes[`${pk}.${lang}.${v}`] = createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 16);

if (process.argv.includes('--update-snapshot') || !existsSync(SNAPSHOT)) {
  writeFileSync(SNAPSHOT, JSON.stringify(hashes, null, 2) + '\n');
  info.push(`Scripture snapshot written (${Object.keys(hashes).length} verses). Commit it with the reviewed change.`);
} else {
  const snap = JSON.parse(readFileSync(SNAPSHOT, 'utf8')) as Record<string, string>;
  for (const k of new Set([...Object.keys(snap), ...Object.keys(hashes)])) {
    if (snap[k] !== hashes[k])
      err(
        `Scripture changed: ${k} ${!snap[k] ? '(new verse)' : !hashes[k] ? '(verse removed)' : '(text edited)'} — review, then run with --update-snapshot`,
      );
  }
}
for (const [pk, p] of Object.entries(passages)) {
  const want = p.list ?? Array.from({ length: p.to - p.from + 1 }, (_, i) => p.from + i);
  for (const [lang, verses] of Object.entries(p.text) as [Lang, Record<string, string>][]) {
    for (const v of want) if (!verses[String(v)]?.trim()) err(`passages.${pk}.${lang}: verse ${v} is empty or missing`);
    for (const v of p.ex) if (!want.includes(v)) err(`passages.${pk}: card verse ${v} is outside the passage`);
    const last = verses[String(want[want.length - 1])] ?? '';
    if (!/[.!?。！？”’」』）)။]$/u.test(last.trim()) && !OPEN_ENDINGS(pk, lang))
      err(`passages.${pk}.${lang}: final verse looks truncated: "…${last.slice(-30)}"`);
  }
}
review.push(
  'Final verses ending mid-sentence by design: Neh 1:4 (all languages; the prayer begins in 1:5); Van Dyck Arabic has no final punctuation',
);

/* ------------------------------------------------------------------ */
/* 8. Rotation pools reference only existing keys                       */
/* ------------------------------------------------------------------ */
for (const [sel, pool] of Object.entries(rotation)) {
  if (!matrix[sel]) err(`rotation.${sel}: not a picture selection`);
  for (const k of pool) if (!pathKeys.includes(k)) err(`rotation.${sel}: unknown story "${k}"`);
  if (pool.includes(nw)) err(`rotation.${sel}: ${nw} is reserved for "I don't have the words"`);
  if (matrix[sel] && !pool.includes(matrix[sel].path))
    err(`rotation.${sel}: pool must include the primary ${matrix[sel].path}`);
}
for (const [k, v] of Object.entries(alt))
  if (!pathKeys.includes(k) || !pathKeys.includes(v)) err(`alt.${k}: unknown key`);

/* ------------------------------------------------------------------ */
/* Drafted overrides and strings waiting for review                     */
/* ------------------------------------------------------------------ */
for (const o of applied.filter((o) => o.status === 'drafted'))
  review.push(`override ${o.target} is drafted (reviewer: ${o.reviewer})`);
review.push(`${Object.keys(DRAFTED.en).length} drafted UI strings per language (src/i18n/drafted.ts) await review`);

/* ------------------------------------------------------------------ */
const quiet = process.argv.includes('--quiet');
if (!quiet) {
  for (const s of info) console.log(`  ℹ ${s}`);
  for (const s of review) console.log(`  ⚠ ${s}`);
}
for (const s of errors) console.log(`  ✖ ${s}`);
console.log(
  errors.length
    ? `\nvalidate-content: ${errors.length} error(s), ${review.length} review item(s).`
    : `validate-content: OK (${review.length} review items${production ? ', production' : ''}).`,
);
process.exit(errors.length ? 1 : 0);
