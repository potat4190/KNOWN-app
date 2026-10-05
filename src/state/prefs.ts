/**
 * Preferences (MMKV-persisted Zustand store). Language, theme, music, tips,
 * judge-panel toggle, test-clock offset, her chosen Bible version.
 */
import { create } from 'zustand';
import { MUSIC } from '@/config/music';
import type { Lang } from '@/i18n/langs';
import { kv } from './kv';

export type ThemePref = 'system' | 'light' | 'dark';

export type Prefs = {
  lang: Lang | null;
  theme: ThemePref;
  /** Background music on/off. The speaker button and Settings share this flag. */
  musicOn: boolean;
  /** First-run cards finished (Skip or Start). */
  tourDone: boolean;
  tipsOn: boolean;
  /** Coach marks already shown, by tip id. */
  tipsSeen: Record<string, true>;
  /** Judge panel visible (only offered when EXPO_PUBLIC_SHOW_PANEL_TOGGLE=true). */
  panelOn: boolean;
  /** Test-clock offset in ms (judge panel only). */
  clockOffset: number;
  /**
   * Her chosen YouVersion version for each app language, overriding that language's default
   * (src/config/bible-versions.ts). A version picked while using Chinese stays with Chinese.
   */
  yvVersions: Partial<Record<Lang, { id: number; abbr: string }>>;
  /** One-time quiet line on Home after cleanup removed a paused moment. */
  removedNotice: boolean;
  /** Random id for relay rate-limiting. Not tied to identity. */
  installId: string;
};

const KEY = 'known.prefs.v1';

const randomId = () =>
  'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

export const defaultPrefs = (): Prefs => ({
  lang: null,
  theme: 'system',
  musicOn: MUSIC.enabledByDefault,
  tourDone: false,
  tipsOn: true,
  tipsSeen: {},
  panelOn: false,
  clockOffset: 0,
  yvVersions: {},
  removedNotice: false,
  installId: randomId(),
});

type PrefsStore = Prefs & {
  set: (patch: Partial<Prefs>) => void;
  /** Delete everything: reset all preferences except the language. */
  resetKeepLanguage: () => void;
};

/** Saved prefs from older builds: a single Bible version choice becomes her choice for the language she used. */
export function migratePrefs(saved: Partial<Prefs> & { yvVersion?: { id: number; abbr: string } | null }) {
  const { yvVersion, ...rest } = saved;
  if (yvVersion && !rest.yvVersions) rest.yvVersions = rest.lang ? { [rest.lang]: yvVersion } : {};
  return rest;
}

export const usePrefs = create<PrefsStore>((setState, get) => ({
  ...defaultPrefs(),
  ...migratePrefs(kv.getJSON<Partial<Prefs>>(KEY) ?? {}),
  set: (patch) => {
    setState(patch);
    const { set: _s, resetKeepLanguage: _r, ...data } = get();
    kv.setJSON(KEY, data);
  },
  resetKeepLanguage: () => {
    // The language survives so the app stays readable; the first-run cards don't come back
    // uninvited (Settings → Show me around again does that). Tips, music, clock and the rest reset.
    const { lang, tourDone } = get();
    get().set({ ...defaultPrefs(), lang, tourDone });
  },
}));

export const prefs = () => usePrefs.getState();
