import type { Ref } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { useTheme } from '@/theme';
import type { TypeVariant, Weight, FontRole } from '@/theme/fonts';
import type { Lang } from '@/i18n/langs';

type Props = TextProps & {
  v?: TypeVariant;
  weight?: Weight;
  /** Font role: ui (default), reading (Scripture/prayer) or heading. */
  face?: FontRole;
  ref?: Ref<Text>;
  muted?: boolean;
  color?: string;
  center?: boolean;
  /** Content language when it differs from the app (e.g. an English fallback inside Arabic UI). */
  lang?: Lang;
  /** Force left-to-right for mixed-direction blocks. */
  ltr?: boolean;
};

/** All text in KNOWN. Scales with Dynamic Type (capped on dense rows by the caller). */
export function Txt({ v = 'body', weight, face, muted, color, center, lang, ltr, style, ...rest }: Props) {
  const { c, type } = useTheme();
  const s: TextStyle = {
    ...type(v, { weight, role: face, lang }),
    color: color ?? (muted ? c.textMuted : c.text),
    ...(center ? { textAlign: 'center' } : { textAlign: 'auto' }),
    ...(ltr ? { writingDirection: 'ltr', textAlign: 'left' } : {}),
  };
  return <Text maxFontSizeMultiplier={2} {...rest} style={[s, style]} />;
}
