import {
  B,
  MATRIX,
  NW,
  P,
  PATH_KEYS,
  ROTATION,
  bundledVersion,
  hasLang,
  ref,
  runs,
  selKey,
  storySource,
  usfmRefs,
  verseText,
} from '@/lib/content';
import { LANGS } from '@/i18n/langs';

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
