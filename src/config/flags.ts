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

/**
 * DEMO ONLY (team request 2026-10-07): picture choices that always open this story, every
 * time, instead of the rotation (src/services/rotation). The rotation isn't advanced for them,
 * so removing an entry brings back the normal order. Never in a production (store) build;
 * dev, preview and the website have it. Delete it when the demo is over.
 */
export const DEMO_FIRST_STORY: Partial<Record<'S' | 'F' | 'A' | 'J' | 'SF' | 'SA' | 'SJ' | 'FA' | 'FJ' | 'AJ', string>> =
  VARIANT === 'production'
    ? {}
    : {
        S: 'ps13', // the rain picture alone → Psalm 13, "When the waiting is long"
      };

export const FLAGS = {
  /** "My own words" tab. Whether it ships in v1 is a team decision (18.1 #3). */
  ownWords: true,
};
