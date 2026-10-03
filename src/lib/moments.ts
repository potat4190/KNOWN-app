import { LANG_INFO, type Lang } from '@/i18n/langs';
import { P, PASSAGES, VERSIONS, type PathKey } from '@/lib/content';
import type { Moment } from '@/data/types';

/** A date in the moment's language (Burmese digits for `my`). */
export const fmtDate = (ts: number, lang: Lang) => {
  try {
    return new Date(ts).toLocaleDateString(LANG_INFO[lang].tag, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...(lang === 'my' ? { numberingSystem: 'mymr' } : {}),
    } as Intl.DateTimeFormatOptions);
  } catch {
    return new Date(ts).toDateString();
  }
};

/**
 * Translate-on-open: re-renders a moment's bundled content in `lang` (the
 * say-line by index, an unedited prayer, the bundled edition label). Her own
 * words (an edited prayer, her words, her message) never change.
 */
export function translateMoment(m: Moment, lang: Lang): Partial<Moment> {
  const path = m.path as PathKey;
  const patch: Partial<Moment> = { lang };
  if (m.stayIndex != null) patch.stay = P(path, 'options', lang)[m.stayIndex] ?? m.stay;
  if (m.prayer != null && !m.prayerEdited) patch.prayer = P(path, 'prayer', lang);
  if (m.scriptureSource === 'bundled') patch.abbr = (PASSAGES[path].text[lang] ? VERSIONS[lang] : VERSIONS.en).abbr;
  return patch;
}
