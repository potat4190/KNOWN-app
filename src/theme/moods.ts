/**
 * Mood themes: from the Scripture screen to Done, a session wears one of ten palettes, one for
 * each picture choice (S, F, A, J and their six pairs). Pictures pick it directly; her own words
 * pick it from the feelings the matcher read, else from the story it chose (see moodFor in
 * src/state/session.ts). "None of these feel right" (Psalm 77) keeps the house palette.
 *
 * Each mood is a whole style, not only a colour: its own accent (the main button, the lamp, step
 * dots, verse numbers, chosen lines), surfaces tinted toward that accent, a card radius, and an
 * aura, the soft light at the top of each screen. The names are for the team and the judge panel only;
 * emotion words are never shown to the student (boundary 1).
 *
 * Every pair is checked by src/theme/__tests__/moods.test.ts: text, muted text and accent ink
 * stay above 4.5:1 on every surface they sit on, in light and in dark.
 */
import type { Colors, Scheme } from './tokens';

export type MoodKey = 'S' | 'F' | 'A' | 'J' | 'SF' | 'SA' | 'SJ' | 'FA' | 'FJ' | 'AJ';
export const MOOD_KEYS: MoodKey[] = ['S', 'F', 'A', 'J', 'SF', 'SA', 'SJ', 'FA', 'FJ', 'AJ'];

/** Danger and the scrim stay the house colours: Help and "Delete everything" must look the same everywhere. */
export type MoodColors = Omit<Colors, 'danger' | 'dangerBg' | 'scrim'>;

export type Mood = {
  key: MoodKey;
  /** Team-facing name (judge panel, docs). Never shown to the student. */
  name: string;
  light: MoodColors;
  dark: MoodColors;
  /** Card corner radius: softer for sorrow and joy, crisper for anger. */
  cardRadius: number;
  /** Where the aura's light comes from: 0 = start edge, 1 = end edge. */
  auraX: number;
  /** Aura strength in [light, dark]. */
  aura: [number, number];
};

type Tones = Omit<MoodColors, 'focus' | 'primary' | 'onPrimary'>;

/**
 * The way forward (Continue, Amen, Save) is lit in the mood's accent, with the accent's dark
 * ink on it; the focus ring follows the accent (dark) or a deep accent (light).
 */
const tones = (t: Tones, focus: string): MoodColors => ({ ...t, primary: t.lamp, onPrimary: t.onLamp, focus });

export const MOODS: Record<MoodKey, Mood> = {
  S: {
    key: 'S',
    name: 'Rain on the window',
    cardRadius: 20,
    auraX: 0.85,
    aura: [0.42, 0.34],
    dark: tones(
      {
        background: '#11161F',
        surface: '#19202C',
        elevated: '#1F2735',
        text: '#E7ECF4',
        textMuted: '#A2ACBE',
        fillMuted: '#232C3A',
        warm: '#1C2A3D',
        border: '#2A3446',
        lamp: '#8DB4EC',
        onLamp: '#0E1420',
        lampInk: '#A6C5F0',
      },
      '#8DB4EC',
    ),
    light: tones(
      {
        background: '#EEF2F8',
        surface: '#FFFFFF',
        elevated: '#FFFFFF',
        text: '#1B2434',
        textMuted: '#536077',
        fillMuted: '#E1E8F2',
        warm: '#E3ECF8',
        border: '#D5DEEA',
        lamp: '#8DB4EC',
        onLamp: '#0E1420',
        lampInk: '#2F5C9E',
      },
      '#3A6AB0',
    ),
  },
  F: {
    key: 'F',
    name: 'Candle in the storm',
    cardRadius: 14,
    auraX: 0.5,
    aura: [0.44, 0.38],
    dark: tones(
      {
        background: '#10111D',
        surface: '#181A2A',
        elevated: '#1E2134',
        text: '#ECEAF5',
        textMuted: '#A4A6C0',
        fillMuted: '#23253A',
        warm: '#2A2622',
        border: '#2A2D45',
        lamp: '#F0C46A',
        onLamp: '#14121C',
        lampInk: '#F2CC7C',
      },
      '#F0C46A',
    ),
    light: tones(
      {
        background: '#F2F1F8',
        surface: '#FFFFFF',
        elevated: '#FFFFFF',
        text: '#1D1E33',
        textMuted: '#575A76',
        fillMuted: '#E5E4F0',
        warm: '#F6EDD8',
        border: '#DEDCEB',
        lamp: '#F0C46A',
        onLamp: '#1D1E33',
        lampInk: '#7D5806',
      },
      '#8C6206',
    ),
  },
  A: {
    key: 'A',
    name: 'Embers cooling',
    cardRadius: 10,
    auraX: 0.15,
    aura: [0.4, 0.34],
    dark: tones(
      {
        background: '#191312',
        surface: '#231A18',
        elevated: '#2A201D',
        text: '#F2E8E4',
        textMuted: '#BBA9A3',
        fillMuted: '#2F2421',
        warm: '#33221C',
        border: '#3B2D29',
        lamp: '#E59472',
        onLamp: '#1A1110',
        lampInk: '#EBA588',
      },
      '#E59472',
    ),
    light: tones(
      {
        background: '#F8F1ED',
        surface: '#FFFFFF',
        elevated: '#FFFFFF',
        text: '#2B1E1A',
        textMuted: '#6C5952',
        fillMuted: '#EFE4DE',
        warm: '#F7E4DA',
        border: '#E9DAD2',
        lamp: '#E59472',
        onLamp: '#2B1E1A',
        lampInk: '#9A4323',
      },
      '#A64B29',
    ),
  },
  J: {
    key: 'J',
    name: 'Morning sun',
    cardRadius: 22,
    auraX: 0.5,
    aura: [0.5, 0.4],
    dark: tones(
      {
        background: '#19160F',
        surface: '#231F15',
        elevated: '#2A2519',
        text: '#F6F0E0',
        textMuted: '#BFB498',
        fillMuted: '#2E2919',
        warm: '#33291A',
        border: '#3A3322',
        lamp: '#F2C14E',
        onLamp: '#1A1508',
        lampInk: '#F4CB68',
      },
      '#F2C14E',
    ),
    light: tones(
      {
        background: '#FBF6E8',
        surface: '#FFFFFF',
        elevated: '#FFFFFF',
        text: '#2A2414',
        textMuted: '#685E43',
        fillMuted: '#F1EAD5',
        warm: '#FAEDC8',
        border: '#EDE3C6',
        lamp: '#F2C14E',
        onLamp: '#2A2414',
        lampInk: '#7A5905',
      },
      '#8A6507',
    ),
  },
  SF: {
    key: 'SF',
    name: 'Fog over the harbour',
    cardRadius: 18,
    auraX: 0.2,
    aura: [0.42, 0.34],
    dark: tones(
      {
        background: '#10191B',
        surface: '#172326',
        elevated: '#1C2A2D',
        text: '#E3EEEF',
        textMuted: '#9DB1B4',
        fillMuted: '#1F2E31',
        warm: '#1A3133',
        border: '#27383C',
        lamp: '#82C8C3',
        onLamp: '#0B1718',
        lampInk: '#97D3CF',
      },
      '#82C8C3',
    ),
    light: tones(
      {
        background: '#EDF4F4',
        surface: '#FFFFFF',
        elevated: '#FFFFFF',
        text: '#172A2C',
        textMuted: '#4C6366',
        fillMuted: '#DFEAEA',
        warm: '#DDEFEE',
        border: '#D2E1E1',
        lamp: '#82C8C3',
        onLamp: '#0B1718',
        lampInk: '#1F6763',
      },
      '#23706C',
    ),
  },
  SA: {
    key: 'SA',
    name: 'Dusk after the storm',
    cardRadius: 16,
    auraX: 0.8,
    aura: [0.42, 0.36],
    dark: tones(
      {
        background: '#18131B',
        surface: '#221B26',
        elevated: '#29212E',
        text: '#EFE6F2',
        textMuted: '#B4A6B9',
        fillMuted: '#2C2331',
        warm: '#2E2234',
        border: '#392E3F',
        lamp: '#CDA0DA',
        onLamp: '#160F19',
        lampInk: '#D6B1E1',
      },
      '#CDA0DA',
    ),
    light: tones(
      {
        background: '#F6F0F7',
        surface: '#FFFFFF',
        elevated: '#FFFFFF',
        text: '#2A1F2E',
        textMuted: '#64566A',
        fillMuted: '#ECE2EE',
        warm: '#F1E2F4',
        border: '#E4D7E7',
        lamp: '#CDA0DA',
        onLamp: '#2A1F2E',
        lampInk: '#713A81',
      },
      '#7B3F8C',
    ),
  },
  SJ: {
    key: 'SJ',
    name: 'Golden hour',
    cardRadius: 20,
    auraX: 0.75,
    aura: [0.46, 0.38],
    dark: tones(
      {
        background: '#1B1416',
        surface: '#261C1F',
        elevated: '#2D2226',
        text: '#F5E9E8',
        textMuted: '#BEA8AA',
        fillMuted: '#312528',
        warm: '#34241F',
        border: '#3E2F32',
        lamp: '#E9AE8C',
        onLamp: '#1B1210',
        lampInk: '#EEBEA2',
      },
      '#E9AE8C',
    ),
    light: tones(
      {
        background: '#FAF1EE',
        surface: '#FFFFFF',
        elevated: '#FFFFFF',
        text: '#2E1F21',
        textMuted: '#6C585B',
        fillMuted: '#F1E5E2',
        warm: '#F8E5DA',
        border: '#ECDCD8',
        lamp: '#E9AE8C',
        onLamp: '#2E1F21',
        lampInk: '#94473D',
      },
      '#A04F45',
    ),
  },
  FA: {
    key: 'FA',
    name: 'Wilderness spring',
    cardRadius: 12,
    auraX: 0.25,
    aura: [0.42, 0.34],
    dark: tones(
      {
        background: '#161711',
        surface: '#1F2119',
        elevated: '#25281E',
        text: '#EEEDE1',
        textMuted: '#AEAD97',
        fillMuted: '#2A2D21',
        warm: '#2C3020',
        border: '#34372A',
        lamp: '#BCC57C',
        onLamp: '#13150C',
        lampInk: '#C9D190',
      },
      '#BCC57C',
    ),
    light: tones(
      {
        background: '#F4F3E9',
        surface: '#FFFFFF',
        elevated: '#FFFFFF',
        text: '#23251A',
        textMuted: '#5D5F4E',
        fillMuted: '#E9E8D9',
        warm: '#EDEFD6',
        border: '#E0DECA',
        lamp: '#BCC57C',
        onLamp: '#23251A',
        lampInk: '#56631E',
      },
      '#5A6820',
    ),
  },
  FJ: {
    key: 'FJ',
    name: 'First light',
    cardRadius: 18,
    auraX: 0.5,
    aura: [0.48, 0.4],
    dark: tones(
      {
        background: '#15131E',
        surface: '#1E1B2A',
        elevated: '#242033',
        text: '#F1ECF8',
        textMuted: '#ACA5C0',
        fillMuted: '#282436',
        warm: '#2F2328',
        border: '#322D44',
        lamp: '#F6B88F',
        onLamp: '#1A1210',
        lampInk: '#F8C4A3',
      },
      '#F6B88F',
    ),
    light: tones(
      {
        background: '#F7F2F8',
        surface: '#FFFFFF',
        elevated: '#FFFFFF',
        text: '#241F30',
        textMuted: '#605970',
        fillMuted: '#EDE6F0',
        warm: '#FBE8DC',
        border: '#E5DDEB',
        lamp: '#F6B88F',
        onLamp: '#241F30',
        lampInk: '#974C24',
      },
      '#A3532A',
    ),
  },
  AJ: {
    key: 'AJ',
    name: 'Olive grove at evening',
    cardRadius: 14,
    auraX: 0.3,
    aura: [0.42, 0.36],
    dark: tones(
      {
        background: '#101713',
        surface: '#17211B',
        elevated: '#1C2821',
        text: '#E6F0E9',
        textMuted: '#9EB4A6',
        fillMuted: '#1F2C24',
        warm: '#2A2A1E',
        border: '#26362D',
        lamp: '#DCA56B',
        onLamp: '#151008',
        lampInk: '#E3B583',
      },
      '#DCA56B',
    ),
    light: tones(
      {
        background: '#EEF4EF',
        surface: '#FFFFFF',
        elevated: '#FFFFFF',
        text: '#17291E',
        textMuted: '#4D6354',
        fillMuted: '#E0EAE2',
        warm: '#F3EAD9',
        border: '#D3E1D7',
        lamp: '#DCA56B',
        onLamp: '#17291E',
        lampInk: '#7C4C17',
      },
      '#855018',
    ),
  },
};

export const isMoodKey = (k: unknown): k is MoodKey => typeof k === 'string' && k in MOODS;

/** The house colours with a mood laid over them (danger and scrim stay the house's). */
export function moodColors(base: Colors, mood: MoodKey, scheme: Scheme): Colors {
  return { ...base, ...MOODS[mood][scheme] };
}
