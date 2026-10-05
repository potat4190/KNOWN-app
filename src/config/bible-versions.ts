/**
 * Default YouVersion Bible version per app language (brief section 8.3).
 *
 * NOT derived from the device locale (YouVersion SDK ADR 0007): this explicit
 * mapping, plus her own choice in Settings → Bible version, decides.
 *
 * Chosen by Rhidaya on 2026-10-04 from `npm run yv:versions` (versions enabled
 * for the app key). Every library passage was checked live in each version.
 *   en 3034 BSB    Berean Standard Bible (public domain), "the LORD" as in the bundled
 *                  WEBBE but different wording; Psalms include their titles in verse 1.
 *                  (206 WEBUS, WEBBE's own translation, says "Yahweh": not chosen.)
 *   ja 81 JA1955   口語訳 (1955), the same edition as the bundled text
 *   zh 43 CSBS     中文标准译本 (© Global Bible Initiative); YouVersion has no 和合本
 *                  for this key, so this is a different translation from the bundled one
 *   ar 195 SAT     التَّرْجَمَةُ العَرَبِيَّةُ المُبَسَّطَةُ (© 2016 Bible League International);
 *                  Van Dyck isn't offered for this key
 *   my none        no Burmese version for this key: the bundled Judson (1835) is shown
 *
 * The prototype's ids were guesses and partly wrong (ja 1819 is 新共同訳, my 386 is
 * the 2021 Judson revision), so they are not used.
 *
 * A null entry means the bundled edition is shown and "Open in YouVersion" is
 * hidden (the label must match what opens).
 */
import type { Lang } from '@/i18n/langs';

export type BibleVersionChoice = { id: number; abbr: string } | null;

export const BIBLE_VERSIONS: Record<Lang, BibleVersionChoice> = {
  en: { id: 3034, abbr: 'BSB' },
  my: null,
  zh: { id: 43, abbr: 'CSBS' },
  ja: { id: 81, abbr: 'JA1955' },
  ar: { id: 195, abbr: 'ت ع م' },
};
