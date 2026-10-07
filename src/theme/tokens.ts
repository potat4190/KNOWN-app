/**
 * KNOWN's theme. The palette follows the team's design reference, the Judge's Critique page
 * (reference/KNOWN-Judges-Critique.html): warm paper and ink by day, a deep blue-grey night,
 * hairline borders, 12-pt cards and one accent, lamplight amber. From the Scripture screen on,
 * a session takes one of ten mood palettes instead (src/theme/moods.ts).
 */
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

/** Critique page tokens: --bg, --surface, --ink, --muted, --line, --accent, --tint, --must(-bg). */
const LIGHT: Colors = {
  background: '#F6F4EF',
  surface: '#FFFFFF',
  elevated: '#FFFFFF',
  text: '#1F2433',
  textMuted: '#5C6375',
  fillMuted: '#ECE8DF',
  warm: '#F4EADA',
  border: '#E2DED5',
  primary: '#1F2433',
  onPrimary: '#FFFFFF',
  focus: '#B8741A',
  lamp: '#E3A24A',
  onLamp: '#1F2433',
  // The accent, darkened so small text on paper and on the warm tint stays above 4.5:1.
  lampInk: '#8F5A12',
  danger: '#9A3B26',
  dangerBg: '#F7E3DC',
  scrim: 'rgba(31,36,51,0.45)',
};

const DARK: Colors = {
  background: '#15171E',
  surface: '#1E212B',
  elevated: '#252936',
  text: '#ECEAE4',
  textMuted: '#A3A8B5',
  fillMuted: '#2A2E39',
  warm: '#2B2620',
  border: '#2F3340',
  primary: '#ECEAE4',
  onPrimary: '#15171E',
  focus: '#E3A24A',
  lamp: '#E3A24A',
  onLamp: '#15171E',
  lampInk: '#E8AE5E',
  danger: '#F2A894',
  dangerBg: '#3A231E',
  scrim: 'rgba(5,6,10,0.6)',
};

export function colorsFor(scheme: Scheme): Colors {
  return scheme === 'dark' ? DARK : LIGHT;
}

export const radius = { card: 12, sheet: 24, full: 9999 } as const;
export const space = (n: number) => n * 4; // 4/8 grid
export const minTarget = 44;
