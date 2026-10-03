import { AI_RELAY_URL } from '@/config/flags';
import { usePrefs } from '@/state/prefs';
import { useUi } from '@/state/ui';
import type { RelayDeps } from './matcher';

/** Relay dependencies for the app, or null when no relay URL is configured. */
export function relayDeps(): RelayDeps | null {
  const log = useUi.getState().logAi;
  if (!AI_RELAY_URL) return { url: '', installId: '', fetch: (...a) => fetch(...a), log };
  return { url: AI_RELAY_URL, installId: usePrefs.getState().installId, fetch: (...a) => fetch(...a), log };
}

export const relayAvailable = () => !!AI_RELAY_URL;
