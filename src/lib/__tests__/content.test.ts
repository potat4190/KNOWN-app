import {
  B,
  MATRIX,
  NW,
  P,
  PATH_KEYS,
  PASSAGES,
  ROTATION,
  bookName,
  bundledVersion,
  hasLang,
  isWholePassage,
  range,
  ref,
  shownRef,
  runs,
  selKey,
  storySource,
  usfmRefs,
  verseText,
} from '@/lib/content';
import { LANGS } from '@/i18n/langs';

describe('the card names the verses it shows', () => {
  it('the excerpt reference, and the passage reference when the excerpt is all of it', () => {
    expect(shownRef('ps142', [4, 5], 'en')).toBe('Psalm 142:4–5');
    expect(shownRef('ps142', [1, 2, 3, 4, 5, 6, 7], 'en')).toBe('Psalm 142:1–7');
    expect(shownRef('mary', [32, 35], 'en')).toBe('John 11:32, 35');
    expect(shownRef('ruth', [16], 'en')).toBe('Ruth 1:16');
    expect(shownRef('ps13', [1, 2, 5], 'en')).toBe('Psalm 13:1–2, 5');
    expect(shownRef('ps142', [4, 5], 'my')).toBe(`${bookName('psa', 'my')} ၁၄၂:၄–၅`);
  });

  it('Psalm 13 shows the whole passage, verse 2 included (its reference said 1–2, 5)', () => {
    expect(isWholePassage('ps13', PASSAGES.ps13.ex)).toBe(true);
    expect(PASSAGES.ps13.ex).toEqual([1, 2, 5]);
    expect(isWholePassage('ps142', PASSAGES.ps142.ex)).toBe(false);
  });

  it('every excerpt is a subset of its passage', () => {
    for (const k of PATH_KEYS) {
      const all = range(PASSAGES[k]);
      expect(PASSAGES[k].ex.every((v) => all.includes(v))).toBe(true);
    }
  });
});

describe('"Who was …?" on every story', () => {
  it.each(LANGS)('every path has a retelling in %s', (lang) => {
    for (const k of PATH_KEYS) expect(P(k, 'story', lang).length).toBeGreaterThan(0);
  });
});

describe('content pack', () => {
  it('has 16 paths and 10 selections', () => {
    expect(PATH_KEYS).toHaveLength(16);
    expect(Object.keys(MATRIX)).toHaveLength(10);
    expect(NW).toBe('ps77');
  });

  it('orders picture keys S, F, A, J', () => {
    expect(selKey(['J', 'S'])).toBe('SJ');
    expect(selKey(['A', 'F'])).toBe('FA');
    expect(selKey(['F'])).toBe('F');
  });

  it('formats references like the Design Lab ref()', () => {
    expect(ref('ruth', 'en')).toBe('Ruth 1:14–18');
    expect(ref('ps13', 'en')).toBe('Psalm 13:1–2, 5');
    expect(ref('ps62', 'en')).toBe('Psalm 62:8');
    expect(ref('hannah', 'my')).toBe('၁ ဓမ္မရာဇဝင် ၂:၁–၂');
  });

  it('keeps Arabic reference numbers in reading order (no "4–1:2")', () => {
    // U+2066 … U+2069 isolate the numbers as one left-to-right run inside right-to-left text.
    expect(ref('neh', 'ar')).toBe('نحميا ⁦1:2–4⁩');
    expect(storySource('hannah', 'ar')).toMatch(/⁦1–2⁩$/);
    // Left-to-right languages are unchanged.
    expect(ref('neh', 'en')).toBe('Nehemiah 1:2–4');
    expect(ref('neh', 'en')).not.toMatch(/[⁦⁩]/);
  });

  it('uses reviewed story chapters for the story source line', () => {
    expect(storySource('hannah', 'en')).toBe('1 Samuel 1–2');
    expect(storySource('joseph', 'en')).toBe('Genesis 37–50');
    expect(storySource('ruth', 'en')).toBe('Ruth 1');
  });

  it('falls back to English Scripture where a language has none', () => {
    expect(hasLang('neh', 'ar')).toBe(true);
    expect(hasLang('ruth', 'ar')).toBe(false);
    expect(bundledVersion('ruth', 'ar').abbr).toBe('WEBBE');
    expect(verseText('ruth', 16, 'ar')).toBe(verseText('ruth', 16, 'en'));
  });

  it('has every path field in every language', () => {
    for (const lang of LANGS) for (const k of PATH_KEYS) expect(P(k, 'name', lang)).toBeTruthy();
  });

  it('has a bridge for every selection and no-words', () => {
    for (const lang of LANGS)
      for (const k of [...Object.keys(MATRIX), 'NW'] as const) expect(B(k as never, lang).h).toBeTruthy();
  });

  it('builds USFM references per consecutive run', () => {
    expect(runs([1, 2, 5])).toEqual([
      [1, 2],
      [5, 5],
    ]);
    expect(usfmRefs('ps13', [1, 2, 5])).toEqual(['PSA.13.1-2', 'PSA.13.5']);
    expect(usfmRefs('ruth', [16])).toEqual(['RUT.1.16']);
  });

  it('rotation pools start with the primary and never include ps77', () => {
    for (const [sel, pool] of Object.entries(ROTATION)) {
      expect(pool[0]).toBe(MATRIX[sel as keyof typeof MATRIX].path);
      expect(pool).not.toContain('ps77');
    }
    expect(ROTATION.J).toEqual(['samaritan', 'hannah']);
  });
});
