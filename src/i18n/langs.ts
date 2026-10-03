/** The five app languages, in the Design Lab's order. */
export const LANGS = ['en', 'my', 'zh', 'ja', 'ar'] as const;
export type Lang = (typeof LANGS)[number];

export const LANG_INFO: Record<Lang, { name: string; en: string; tag: string; rtl: boolean }> = {
  en: { name: 'English', en: 'English', tag: 'en', rtl: false },
  my: { name: 'မြန်မာ', en: 'Burmese', tag: 'my', rtl: false },
  zh: { name: '简体中文', en: 'Simplified Chinese', tag: 'zh-Hans', rtl: false },
  ja: { name: '日本語', en: 'Japanese', tag: 'ja', rtl: false },
  ar: { name: 'العربية', en: 'Arabic', tag: 'ar', rtl: true },
};

export const isLang = (x: unknown): x is Lang => typeof x === 'string' && (LANGS as readonly string[]).includes(x);

const MY_DIGITS = '၀၁၂၃၄၅၆၇၈၉';

/** Burmese uses Burmese digits in counts and references; other languages keep ASCII digits (as the Design Lab does). */
export const localizeDigits = (s: string | number, lang: Lang): string =>
  lang === 'my' ? String(s).replace(/[0-9]/g, (d) => MY_DIGITS[Number(d)]) : String(s);
