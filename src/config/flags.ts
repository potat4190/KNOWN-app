/**
 * Build-time switches. Values come from EXPO_PUBLIC_* env vars (inlined by
 * Metro at build time) and APP_VARIANT (read in app.config.ts → extra).
 */
import Constants from 'expo-constants';

export type Variant = 'development' | 'preview' | 'production';

const extra = (Constants.expoConfig?.extra ?? {}) as { variant?: Variant };

export const VARIANT: Variant = extra.variant ?? 'development';

/** Empty = no relay: own words use the on-device matcher, translate shows the copy-only fallback. */
export const AI_RELAY_URL = (process.env.EXPO_PUBLIC_AI_RELAY_URL ?? '').trim().replace(/\/+$/, '');

export const YOUVERSION_APP_KEY = (process.env.EXPO_PUBLIC_YOUVERSION_APP_KEY ?? '').trim();

/** Shows the "Judge panel" switch in Settings. Off for store builds. */
export const SHOW_PANEL_TOGGLE =
  (process.env.EXPO_PUBLIC_SHOW_PANEL_TOGGLE ?? (VARIANT === 'production' ? 'false' : 'true')) === 'true';

export const FLAGS = {
  /** "My own words" tab. Whether it ships in v1 is a team decision (18.1 #3). */
  ownWords: true,
};
