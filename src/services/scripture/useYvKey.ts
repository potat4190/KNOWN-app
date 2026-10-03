/**
 * Does the YouVersion app key work right now? Controls that depend on it
 * (Settings → Bible version) are shown only when it does: a control that
 * looks like it works but doesn't is worse than a missing one.
 */
import { useEffect, useState } from 'react';
import { YOUVERSION_APP_KEY } from '@/config/flags';
import { YV_API } from './scripture';

let cached: boolean | null = null;

export async function checkYvKey(f: typeof fetch = fetch, timeoutMs = 3000): Promise<boolean> {
  if (!YOUVERSION_APP_KEY) return false;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await f(`${YV_API}/v1/bibles?language_ranges[]=eng&page_size=1`, {
      headers: { 'X-YVP-App-Key': YOUVERSION_APP_KEY, Accept: 'application/json' },
      signal: ctrl.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function useYvKeyOk(): boolean {
  const [ok, setOk] = useState<boolean>(cached ?? false);
  useEffect(() => {
    if (cached != null) return;
    let alive = true;
    void checkYvKey().then((v) => {
      // Only cache success: a failure may be the venue Wi-Fi.
      if (v) cached = true;
      if (alive) setOk(v);
    });
    return () => {
      alive = false;
    };
  }, []);
  return ok;
}
