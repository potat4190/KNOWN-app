/**
 * i18next resources: one namespace per language, built from the content pack.
 *
 * Lookup order (kept from the Design Lab):
 *   T[lang][k] → D.PW_UI[lang][k] → T.en[k] → D.PW_UI.en[k] → the key itself.
 * strings.<lang>.json is already {...PW_UI[lang], ...T[lang]}; i18next's
 * fallbackLng 'en' supplies the next two steps and returns the key last.
 * Drafted strings (./drafted.ts) only fill keys the content pack lacks.
 */
import en from '@/content/strings.en.json';
import my from '@/content/strings.my.json';
import zh from '@/content/strings.zh.json';
import ja from '@/content/strings.ja.json';
import ar from '@/content/strings.ar.json';
import { DRAFTED } from './drafted';
import type { Lang } from './langs';

export const CONTENT_STRINGS: Record<Lang, Record<string, string>> = { en, my, zh, ja, ar };

/**
 * Plural keys derived from reviewed strings (8.7). i18next picks the suffix
 * from Intl.PluralRules; a missing form falls back to the drafted one.
 */
function derivedPlurals(lang: Lang, s: Record<string, string>): Record<string, string> {
  switch (lang) {
    case 'en':
      return { removes_n_one: s.removes_1, removes_n_other: s.removes_n, removes_in_other: s.removes_in };
    case 'ar':
      return { removes_n_one: s.removes_1, removes_n_few: s.removes_n, removes_in_few: s.removes_in };
    default:
      return { removes_n_other: s.removes_n, removes_in_other: s.removes_in };
  }
}

export function buildResources() {
  const out = {} as Record<Lang, { translation: Record<string, string> }>;
  for (const lang of Object.keys(CONTENT_STRINGS) as Lang[]) {
    const s = CONTENT_STRINGS[lang];
    out[lang] = { translation: { ...DRAFTED[lang], ...derivedPlurals(lang, s), ...s } };
  }
  return out;
}
