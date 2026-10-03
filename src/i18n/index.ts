/**
 * i18n for screens: useT() gives t(), tc() (plurals) and the current language.
 * Arabic is right-to-left: switching to or from it calls I18nManager.forceRTL()
 * and needs an app reload, which the caller confirms with her first.
 */
import { useCallback, useMemo } from 'react';
import { DevSettings, I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import { usePrefs } from '@/state/prefs';
import { createI18n, translate, type Vars } from './core';
import { LANG_INFO, type Lang } from './langs';

export const i18n = createI18n('en');

export const currentLang = (): Lang => usePrefs.getState().lang ?? 'en';

/** Non-hook translate for services and actions. */
export const tr = (key: string, vars?: Vars, lang: Lang = currentLang()) => translate(i18n, lang, key, vars);

export const hasKey = (key: string, lang: Lang) => i18n.exists(key, { lng: lang, fallbackLng: false } as never);

export function useT() {
  const lang = usePrefs((p) => p.lang) ?? 'en';
  const t = useCallback((key: string, vars?: Vars) => translate(i18n, lang, key, vars), [lang]);
  /** Plural-aware: picks _one/_two/_few/_many/_other for `n` (CLDR rules). */
  const tc = useCallback(
    (key: string, n: number, vars?: Vars) => translate(i18n, lang, key, { ...vars, count: n }),
    [lang],
  );
  return useMemo(() => ({ t, tc, lang, rtl: LANG_INFO[lang].rtl, tag: LANG_INFO[lang].tag }), [t, tc, lang]);
}

/** True when switching to `lang` changes the layout direction (and so needs a reload). */
export const needsDirectionReload = (lang: Lang) => LANG_INFO[lang].rtl !== I18nManager.isRTL;

/** Sets the language. Returns true if the app is reloading to change direction. */
export async function applyLanguage(lang: Lang): Promise<boolean> {
  usePrefs.getState().set({ lang });
  if (!needsDirectionReload(lang)) return false;
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(LANG_INFO[lang].rtl);
  try {
    if (__DEV__) DevSettings.reload();
    else await Updates.reloadAsync();
  } catch {
    // If reload isn't possible, the new direction applies on next launch.
  }
  return true;
}

/** On launch: make sure the native direction matches the saved language. */
export function syncDirection() {
  const lang = usePrefs.getState().lang;
  I18nManager.allowRTL(true);
  if (lang && LANG_INFO[lang].rtl !== I18nManager.isRTL) {
    I18nManager.forceRTL(LANG_INFO[lang].rtl);
    return true;
  }
  return false;
}
