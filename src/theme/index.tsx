/**
 * useTheme(): colours for the current appearance (Match device / Light / Dark),
 * fonts for the current language, and whether Reduce Motion is on.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { usePrefs } from '@/state/prefs';
import { useT } from '@/i18n';
import { colorsFor, radius, space, type Colors, type Scheme } from './tokens';
import {
  TYPE,
  clampTextScale,
  familyFor,
  lineHeightScale,
  needsFontWeight,
  type FontRole,
  type TypeVariant,
  type Weight,
} from './fonts';
import type { TextStyle } from 'react-native';
import type { Lang } from '@/i18n/langs';

export type Theme = {
  scheme: Scheme;
  c: Colors;
  radius: typeof radius;
  space: typeof space;
  reduceMotion: boolean;
  /** Settings → Text size (1 = default). Already applied by type(); exposed for non-Text views such as BibleTextView. */
  textScale: number;
  /** A text style for a type variant in the current language. */
  type: (v: TypeVariant, o?: { role?: FontRole; weight?: Weight; lang?: Lang }) => TextStyle;
};

const ThemeCtx = createContext<Theme | null>(null);

export function useReduceMotion() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => alive && setOn(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setOn);
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return on;
}

export function makeType(lang: Lang, textScale = 1) {
  const k = clampTextScale(textScale);
  return (v: TypeVariant, o: { role?: FontRole; weight?: Weight; lang?: Lang } = {}): TextStyle => {
    const l = o.lang ?? lang;
    const role: FontRole = o.role ?? (v === 'h1' || v === 'h2' ? 'heading' : v === 'scripture' ? 'reading' : 'ui');
    const weight: Weight = o.weight ?? (v === 'h1' || v === 'h2' ? 'bold' : 'regular');
    const base = TYPE[v];
    const family = familyFor(l, role, weight);
    return {
      fontSize: Math.round(base.fontSize * k),
      lineHeight: Math.round(base.lineHeight * lineHeightScale(l) * k),
      ...(family ? { fontFamily: family } : {}),
      ...(needsFontWeight(l) || !family
        ? { fontWeight: weight === 'bold' ? '700' : weight === 'medium' ? '500' : '400' }
        : {}),
    };
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pref = usePrefs((p) => p.theme);
  const textScale = clampTextScale(usePrefs((p) => p.textScale));
  const device = useColorScheme();
  const { lang } = useT();
  const reduceMotion = useReduceMotion();
  const scheme: Scheme = pref === 'system' ? (device === 'dark' ? 'dark' : 'light') : pref;
  const value = useMemo<Theme>(
    () => ({
      scheme,
      c: colorsFor(scheme),
      radius,
      space,
      reduceMotion,
      textScale,
      type: makeType(lang, textScale),
    }),
    [scheme, reduceMotion, lang, textScale],
  );
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(ThemeCtx);
  if (!t) throw new Error('useTheme outside ThemeProvider');
  return t;
}
