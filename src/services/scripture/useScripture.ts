import { useEffect, useState } from 'react';
import * as Network from 'expo-network';
import { BIBLE_VERSIONS } from '@/config/bible-versions';
import { YOUVERSION_APP_KEY } from '@/config/flags';
import { usePrefs } from '@/state/prefs';
import { useUi } from '@/state/ui';
import type { PathKey } from '@/lib/content';
import type { Lang } from '@/i18n/langs';
import {
  resolve,
  bundled,
  parseVersionMeta,
  YV_API,
  type Resolved,
  type ScriptureDeps,
  type YvVersionMeta,
} from './scripture';

export function scriptureDeps(lang: Lang): ScriptureDeps {
  const choice = usePrefs.getState().yvVersion;
  return {
    appKey: YOUVERSION_APP_KEY,
    version: choice ?? BIBLE_VERSIONS[lang],
    isOnline: async () => {
      const s = await Network.getNetworkStateAsync();
      return !!s.isConnected && s.isInternetReachable !== false;
    },
    fetch: (...a) => fetch(...a),
  };
}

/**
 * Resolves the Scripture source for a passage. Returns null while resolving
 * (show a skeleton, never a blank card; the preflight gives up after 3 s).
 */
export function useScripture(path: PathKey | null, lang: Lang): Resolved | null {
  const yvVersion = usePrefs((p) => p.yvVersion);
  const key = `${path}|${lang}|${yvVersion?.id ?? ''}`;
  const [state, setState] = useState<{ key: string; r: Resolved } | null>(null);
  useEffect(() => {
    if (!path) return;
    let alive = true;
    const deps = scriptureDeps(lang);
    resolve(path, lang, deps)
      .catch(() => bundled(path, lang, deps, 'preflight-failed'))
      .then((x) => {
        if (!alive) return;
        setState({ key, r: x });
        useUi.setState({
          lastScripture: {
            source: x.source === 'youversion' ? `YouVersion ${x.abbr} (${x.versionId})` : `bundled ${x.abbr}`,
            versionId: x.source === 'youversion' ? x.versionId : null,
            error: x.source === 'bundled' ? x.reason : null,
          },
        });
      });
    return () => {
      alive = false;
    };
  }, [path, lang, yvVersion, key]);
  return state?.key === key ? state.r : null;
}

/** Version metadata (abbreviation, title, copyright) for a version she picked. */
export async function fetchVersionMeta(id: number): Promise<YvVersionMeta> {
  const res = await fetch(`${YV_API}/v1/bibles/${id}`, {
    headers: { 'X-YVP-App-Key': YOUVERSION_APP_KEY, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseVersionMeta(await res.json());
}
