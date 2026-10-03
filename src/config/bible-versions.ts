/**
 * Default YouVersion Bible version per app language (brief section 8.3).
 *
 * NOT derived from the device locale (YouVersion SDK ADR 0007): this explicit
 * mapping, plus her own choice in Settings → Bible version, decides.
 *
 * The prototype's ids were guesses and are partly wrong:
 *   en 206 WEBUS     US edition, not the bundled WEBBE
 *   zh 48 CUNPSS-神  same family as the bundled 和合本
 *   ja 1819          WRONG: 新共同訳 (copyrighted), not 口語訳
 *   my 386 JBMLE     2021 Judson revision (© Bible Society of Myanmar), not the 1835 text
 *   ar 13 AVD        Van Dyck; verify
 *
 * Run `npm run yv:versions` with the app key, then the team chooses the ids.
 * Until an id is confirmed it stays null, and the bundled text is shown.
 */
import type { Lang } from '@/i18n/langs';

export type BibleVersionChoice = { id: number; abbr: string } | null;

export const BIBLE_VERSIONS: Record<Lang, BibleVersionChoice> = {
  en: null,
  my: null,
  zh: null,
  ja: null,
  ar: null,
};
