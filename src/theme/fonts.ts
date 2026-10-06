/**
 * Typography (brief 5.2). The UI font family lives in ONE token so swapping
 * Inter for Atkinson Hyperlegible (open decision 18.2 #8) is a one-line change.
 */
import { Platform } from 'react-native';
import type { Lang } from '@/i18n/langs';

/** Family names registered by the YouVersion provider. Use names, not fontWeight, on Android. */
export const UI_FONT = { regular: 'Inter', medium: 'Inter_medium', bold: 'Inter_bold' } as const;
export const SERIF_FONT = {
  regular: 'Untitled Serif',
  medium: 'Untitled Serif_medium',
  bold: 'Untitled Serif_bold',
  italic: 'Untitled Serif_italic',
} as const;

/** Bundled per-language faces (loaded in app/_layout.tsx). */
export const LANG_FONTS = {
  my: { regular: 'NotoSansMyanmar_400Regular', bold: 'NotoSansMyanmar_700Bold' },
  arUi: { regular: 'NotoSansArabic_400Regular', bold: 'NotoSansArabic_700Bold' },
  arRead: { regular: 'NotoNaskhArabic_400Regular', bold: 'NotoNaskhArabic_700Bold' },
} as const;

export type Weight = 'regular' | 'medium' | 'bold';
export type FontRole = 'ui' | 'reading' | 'heading';

/**
 * The font family for a role in a language. Chinese and Japanese use the
 * system CJK font (never bundled: 10–20 MB each).
 */
export function familyFor(lang: Lang, role: FontRole, weight: Weight = 'regular'): string | undefined {
  const w = weight === 'medium' ? 'bold' : weight;
  if (lang === 'my') return LANG_FONTS.my[w];
  if (lang === 'ar') return role === 'ui' ? LANG_FONTS.arUi[w] : LANG_FONTS.arRead[w];
  if (lang === 'zh' || lang === 'ja') return Platform.select({ ios: undefined, default: undefined });
  return role === 'ui' ? UI_FONT[weight] : SERIF_FONT[weight];
}

/** CJK has no bundled face, so weight must come from fontWeight. */
export const needsFontWeight = (lang: Lang) => lang === 'zh' || lang === 'ja';

export const lineHeightScale = (lang: Lang) => (lang === 'my' ? 1.6 : lang === 'ar' ? 1.5 : 1);

/** Type scale: YV typography (sm 14/20, base 16/24, lg 18/28) + headings + Scripture. Body base is 18 (critique). */
export const TYPE = {
  footnote: { fontSize: 14, lineHeight: 20 },
  secondary: { fontSize: 16, lineHeight: 24 },
  body: { fontSize: 18, lineHeight: 28 },
  h2: { fontSize: 22, lineHeight: 28 },
  h1: { fontSize: 28, lineHeight: 34 },
  scripture: { fontSize: 20, lineHeight: 32 },
} as const;
export type TypeVariant = keyof typeof TYPE;

/**
 * Settings → Text size. Multiplies every type variant (on top of the phone's own text size,
 * which still applies). 1 = the sizes above.
 */
export const TEXT_SCALE = { min: 0.85, max: 1.5, step: 0.05, default: 1 } as const;
export const clampTextScale = (v: number) => {
  if (!Number.isFinite(v)) return TEXT_SCALE.default;
  const stepped = Math.round(v / TEXT_SCALE.step) * TEXT_SCALE.step;
  return Math.min(TEXT_SCALE.max, Math.max(TEXT_SCALE.min, Math.round(stepped * 100) / 100));
};
