import { createI18n, translate } from '../core';
import { LANGS } from '../langs';
import { CONTENT_STRINGS } from '../resources';
import { DRAFTED } from '../drafted';

const i18n = createI18n('en');
const tc = (lang: (typeof LANGS)[number], key: string, n: number) => translate(i18n, lang, key, { count: n });

describe('lookup order', () => {
  it('uses the language, then English, then the key', () => {
    expect(translate(i18n, 'zh', 'begin')).toBe(CONTENT_STRINGS.zh.begin);
    expect(translate(i18n, 'zh', 'm_body2', { ref: 'X' })).toBe(CONTENT_STRINGS.en.m_body2.replace('{ref}', 'X'));
    expect(translate(i18n, 'en', 'no_such_key')).toBe('no_such_key');
  });
  it('reviewed content wins over drafted', () => {
    for (const lang of LANGS)
      for (const k of Object.keys(DRAFTED[lang]))
        if (CONTENT_STRINGS[lang][k]) expect(translate(i18n, lang, k)).toBe(CONTENT_STRINGS[lang][k]);
  });
  it('fills {n} with Burmese digits in my', () => {
    expect(translate(i18n, 'my', 'pics_count', { n: 2 })).toContain('၂');
    expect(translate(i18n, 'en', 'pics_count', { n: 2 })).toBe('2 of 2 chosen');
  });
});

describe('plurals for 1, 2 and 3 days in all 5 languages (critique: "Removed in 1 days")', () => {
  it('English', () => {
    expect(tc('en', 'removes_in', 1)).toBe('Removed in 1 day');
    expect(tc('en', 'removes_in', 2)).toBe('Removed in 2 days');
    expect(tc('en', 'removes_n', 1)).toBe('The paused moment is removed in 1 day.');
    expect(tc('en', 'removes_n', 3)).toBe('The paused moment is removed in 3 days.');
  });
  it('Arabic has one, two and few forms', () => {
    expect(tc('ar', 'removes_n', 1)).toContain('يوم واحد');
    expect(tc('ar', 'removes_n', 2)).toContain('يومين');
    expect(tc('ar', 'removes_n', 3)).toContain('3 أيام');
    expect(tc('ar', 'removes_in', 2)).toContain('يومين');
  });
  it.each(['zh', 'ja', 'my'] as const)('%s needs no plural forms and never leaves {n}', (lang) => {
    for (const n of [1, 2, 3]) {
      const s = tc(lang, 'removes_n', n);
      expect(s).not.toContain('{n}');
      expect(s).not.toBe('removes_n');
    }
  });
  it.each(LANGS)('no unfilled {n} for 1–3 days (%s)', (lang) => {
    for (const key of ['removes_n', 'removes_in', 'paused_removed'])
      for (const n of [1, 2, 3]) {
        const s = tc(lang, key, n);
        expect(s).not.toMatch(/\{n\}|_one|_other/);
      }
  });
});
