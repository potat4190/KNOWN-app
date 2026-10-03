/**
 * ScriptureService (brief 8.3): Scripture in her first language from
 * YouVersion, with the bundled public-domain text as the offline and
 * fallback source. Scripture is never machine-translated.
 *
 * resolve() returns YouVersion only when ALL hold: the app key is set, the
 * network is reachable, the version metadata preflight succeeds within 3 s,
 * and the passage itself is available. Otherwise the bundled edition.
 *
 * The label must match what opens: the "Open in YouVersion" link always names
 * (and opens) the same versionId the card shows, or the version it will open.
 */
import { bundledVersion, chapterUsfm, hasLang, usfmRefs, PASSAGES, range, type PathKey } from '@/lib/content';
import type { Lang } from '@/i18n/langs';

export const YV_API = 'https://api.youversion.com';
export const PREFLIGHT_MS = 3000;

export type YvVersionMeta = {
  id: number;
  abbr: string;
  title: string;
  copyright: string | null;
  deepLink: string | null;
};

export type Resolved =
  | {
      source: 'youversion';
      versionId: number;
      abbr: string;
      title: string;
      attribution: string | null;
      /** USFM refs for the card excerpt (one per consecutive run) and the full passage. */
      excerpt: string[];
      full: string[];
      chapter: string;
    }
  | {
      source: 'bundled';
      /** Language of the text shown (English when the passage isn't in hers). */
      textLang: Lang;
      abbr: string;
      name: string;
      fallback: boolean;
      /** Where "Open in YouVersion" goes, named by the version it will open. Null = hidden. */
      link: { versionId: number; abbr: string; url: string } | null;
      reason: 'no-key' | 'no-version' | 'offline' | 'preflight-failed' | 'passage-error';
    };

export type ScriptureDeps = {
  appKey: string;
  /** Her choice in Settings, else the per-language default (src/config/bible-versions.ts). */
  version: { id: number; abbr: string } | null;
  isOnline: () => Promise<boolean>;
  fetch: typeof fetch;
  timeoutMs?: number;
};

export const bibleComUrl = (versionId: number, path: PathKey) =>
  `https://www.bible.com/bible/${versionId}/${chapterUsfm(path)}`;

async function getJson(deps: ScriptureDeps, url: string, signal: AbortSignal): Promise<unknown> {
  const res = await deps.fetch(url, { headers: { 'X-YVP-App-Key': deps.appKey, Accept: 'application/json' }, signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const metaCache = new Map<number, YvVersionMeta>();
export const clearScriptureCache = () => metaCache.clear();

export function parseVersionMeta(j: unknown): YvVersionMeta {
  const o = (j ?? {}) as Record<string, unknown>;
  if (typeof o.id !== 'number') throw new Error('bad version metadata');
  return {
    id: o.id,
    abbr: String(o.localized_abbreviation || o.abbreviation || ''),
    title: String(o.localized_title || o.title || ''),
    copyright: (o.copyright as string) || (o.info as string) || null,
    deepLink: (o.youversion_deep_link as string) || null,
  };
}

/** Preflight: version metadata and the passage, together within the timeout. */
export async function preflight(deps: ScriptureDeps, path: PathKey): Promise<YvVersionMeta> {
  if (!deps.version) throw new Error('no version');
  const id = deps.version.id;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), deps.timeoutMs ?? PREFLIGHT_MS);
  try {
    const meta = metaCache.get(id) ?? parseVersionMeta(await getJson(deps, `${YV_API}/v1/bibles/${id}`, ctrl.signal));
    metaCache.set(id, meta);
    const p = PASSAGES[path];
    const full = p.from === p.to ? `${chapterUsfm(path)}.${p.from}` : `${chapterUsfm(path)}.${p.from}-${p.to}`;
    const passage = (await getJson(deps, `${YV_API}/v1/bibles/${id}/passages/${full}`, ctrl.signal)) as {
      content?: string;
    };
    if (!passage || typeof passage.content !== 'string' || !passage.content.trim()) throw new Error('passage-error');
    return meta;
  } finally {
    clearTimeout(timer);
  }
}

export function bundled(
  path: PathKey,
  lang: Lang,
  deps: Pick<ScriptureDeps, 'version'>,
  reason: Extract<Resolved, { source: 'bundled' }>['reason'],
): Resolved {
  const textLang: Lang = hasLang(path, lang) ? lang : 'en';
  const v = bundledVersion(path, lang);
  return {
    source: 'bundled',
    textLang,
    abbr: v.abbr,
    name: v.name,
    fallback: textLang !== lang,
    link: deps.version
      ? { versionId: deps.version.id, abbr: deps.version.abbr, url: bibleComUrl(deps.version.id, path) }
      : null,
    reason,
  };
}

export async function resolve(path: PathKey, lang: Lang, deps: ScriptureDeps): Promise<Resolved> {
  if (!deps.appKey) return bundled(path, lang, deps, 'no-key');
  if (!deps.version) return bundled(path, lang, deps, 'no-version');
  let online = false;
  try {
    online = await deps.isOnline();
  } catch {
    online = false;
  }
  if (!online) return bundled(path, lang, deps, 'offline');
  let meta: YvVersionMeta;
  try {
    meta = await preflight(deps, path);
  } catch (e) {
    return bundled(path, lang, deps, String(e).includes('passage-error') ? 'passage-error' : 'preflight-failed');
  }
  const p = PASSAGES[path];
  return {
    source: 'youversion',
    versionId: meta.id,
    abbr: meta.abbr || deps.version.abbr,
    title: meta.title,
    attribution: meta.copyright,
    excerpt: usfmRefs(path, p.ex),
    full: usfmRefs(path, range(p)),
    chapter: chapterUsfm(path),
  };
}

/** What "Open in YouVersion" opens, and how it is labelled. Null = don't show the pill. */
export function youVersionLink(
  r: Resolved,
  path: PathKey,
): { versionId: number; abbr: string; url: string; inApp: boolean } | null {
  if (r.source === 'youversion')
    return { versionId: r.versionId, abbr: r.abbr, url: bibleComUrl(r.versionId, path), inApp: true };
  return r.link ? { ...r.link, inApp: false } : null;
}
