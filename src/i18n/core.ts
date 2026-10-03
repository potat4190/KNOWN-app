/**
 * i18next setup without React Native imports, so scripts and tests can use it.
 */
import { createInstance, type i18n as I18n } from 'i18next';
import { buildResources } from './resources';
import { LANGS, localizeDigits, type Lang } from './langs';

export function createI18n(lang: Lang = 'en'): I18n {
  const inst = createInstance();
  void inst.init({
    resources: buildResources(),
    lng: lang,
    fallbackLng: 'en',
    supportedLngs: [...LANGS],
    initAsync: false,
    returnNull: false,
    returnEmptyString: false,
    // The Design Lab writes placeholders as {n}, not {{n}}.
    interpolation: { prefix: '{', suffix: '}', escapeValue: false },
  });
  return inst;
}

export type Vars = Record<string, string | number>;

/**
 * Translate `key` in `lang`. A numeric `n` gets Burmese digits in `my`
 * (as the Design Lab's t() does). Pass `count` to choose a plural form.
 */
export function translate(inst: I18n, lang: Lang, key: string, vars?: Vars & { count?: number }): string {
  const v: Record<string, unknown> = { lng: lang, ...vars };
  if (vars && vars.n != null) v.n = localizeDigits(vars.n, lang);
  if (vars && vars.count != null && vars.n == null) v.n = localizeDigits(vars.count, lang);
  return inst.t(key, v) as string;
}
