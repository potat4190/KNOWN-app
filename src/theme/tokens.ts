/**
 * KNOWN's theme, built on YouVersion's own design tokens (brief 5.1) so KNOWN
 * sits comfortably next to the embedded YouVersion components. KNOWN keeps
 * its own identity: one accent (lamplight amber) and no YouVersion red.
 */
import { getTokens } from '@youversion/platform-react-native-expo-ui';

export type Scheme = 'light' | 'dark';

export type Colors = {
  background: string;
  surface: string;
  elevated: string;
  text: string;
  textMuted: string;
  fillMuted: string;
  warm: string;
  border: string;
  primary: string;
  onPrimary: string;
  focus: string;
  lamp: string;
  onLamp: string;
  lampInk: string;
  danger: string;
  dangerBg: string;
  scrim: string;
};

export function colorsFor(scheme: Scheme): Colors {
  const yv = getTokens(scheme);
  const dark = scheme === 'dark';
  return {
    background: yv.background,
    surface: yv.card,
    elevated: yv.popover,
    text: yv.foreground,
    textMuted: yv.mutedForeground,
    fillMuted: yv.muted,
    warm: yv.secondary,
    border: yv.border,
    // YV dark primary is red, which KNOWN avoids: invert the light primary instead.
    primary: dark ? '#ffffff' : yv.primary,
    onPrimary: dark ? '#121212' : yv.primaryForeground,
    focus: yv.ring,
    lamp: '#F2B35E',
    onLamp: '#22283A',
    lampInk: dark ? '#F6C47E' : '#8A5418',
    danger: dark ? '#F29A86' : '#A63A2A',
    dangerBg: dark ? '#3A2A33' : '#FBE9E5',
    scrim: 'rgba(0,0,0,0.45)',
  };
}

export const radius = { card: 16, sheet: 24, full: 9999 } as const;
export const space = (n: number) => n * 4; // 4/8 grid
export const minTarget = 44;
