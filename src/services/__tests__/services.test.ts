import { match, parseMatch, translateMessage, isCrisis, type RelayDeps } from '@/services/matcher/matcher';
import { matchLocal } from '@/services/matcher/local';
import { resolve, youVersionLink, clearScriptureCache, type ScriptureDeps } from '@/services/scripture/scripture';
import { scriptureDeps } from '@/services/scripture/useScripture';
import { BIBLE_VERSIONS } from '@/config/bible-versions';
import { migratePrefs, usePrefs } from '@/state/prefs';
import { resolveTrack, anyMusicConfigured, fadeSteps } from '@/services/music/resolve';
import { MUSIC, type MusicConfig } from '@/config/music';
import { ALL_HELP_LINES, isVerified, localEmergencyFor } from '@/config/help-lines';
import { translateMoment } from '@/lib/moments';
import { P } from '@/lib/content';
import type { Moment } from '@/data/types';

const json = (body: unknown, ok = true, status = 200) =>
  Promise.resolve({ ok, status, json: () => Promise.resolve(body) } as Response);

describe('crisis regex', () => {
  it.each(['I want to die', 'thinking about suicide', '我不想活了', '死にたい', 'သေချင်တယ်', 'أريد أن أموت'])(
    'catches "%s"',
    (s) => {
      expect(isCrisis(s)).toBe(true);
    },
  );
  it('does not flag ordinary words', () => expect(isCrisis('I miss my family')).toBe(false));

  // Drafted for Kezia (src/config/crisis-extra.ts): these skipped the Crisis screen with no relay.
  it.each([
    "I don't want to be here anymore",
    'I dont want to be here any more.',
    'I don’t want to be here anymore',
    "I can't go on",
    'I cannot go on like this',
    "I can't go on anymore",
    'Nobody would miss me',
    "no one would even notice if I'm gone",
    'I want to disappear',
    'I just want to disappear.',
  ])('catches "%s"', (s) => expect(isCrisis(s)).toBe(true));

  it.each([
    "I don't want to be here in this cold city",
    "I can't go on the trip home this year",
    'I want to disappear from social media for a while',
    'I miss home and nobody here knows me',
  ])('does not flag everyday "%s"', (s) => expect(isCrisis(s)).toBe(false));
});

describe('on-device matcher (AI.local port)', () => {
  it('keyword rules win in order', () => {
    expect(matchLocal("I can't reach my family").key).toBe('neh');
    expect(matchLocal('I feel so alone').key).toBe('ps142');
    expect(matchLocal("I'm exhausted").key).toBe('elijah');
  });
  it('mood keywords map through the matrix', () => {
    const r = matchLocal("I'm sad and anxious");
    expect(r.key).toBe('elijah'); // SF
    expect(r.feelings).toEqual(['sadness', 'fear']);
  });
  it('nothing → no key', () => expect(matchLocal('qwerty').key).toBeNull());
});

describe('matcher order', () => {
  const deps = (f: jest.Mock): RelayDeps => ({ url: 'https://relay.test', installId: 'i', fetch: f, log: jest.fn() });
  it('uses the relay when it answers', async () => {
    const f = jest.fn(() =>
      json({ key: 'ruth', confidence: 0.8, reason: 'A new place.', feelings: ['fear'], risk: false }),
    );
    const r = await match('starting over', 'en', deps(f));
    expect(r).toMatchObject({ key: 'ruth', source: 'ai', reason: 'A new place.' });
  });
  it('falls back to the on-device matcher when the relay fails', async () => {
    const f = jest.fn(() => Promise.reject(new Error('down')));
    const r = await match("I can't reach my family", 'en', deps(f));
    expect(r).toMatchObject({ key: 'neh', source: 'local' });
  });
  it('a Gloo refusal (non-JSON / error status) falls back too', async () => {
    const f = jest.fn(() => json({ error: 'refused' }, false, 422));
    const r = await match('so tired', 'en', deps(f));
    expect(r.source).toBe('local');
  });
  it('no relay URL: never touches the network', async () => {
    const f = jest.fn();
    const r = await match('so tired', 'en', { url: '', installId: '', fetch: f });
    expect(f).not.toHaveBeenCalled();
    expect(r.key).toBe('elijah');
  });
  it('the crisis regex sets risk even when the relay says no', async () => {
    const f = jest.fn(() => json({ key: 'neh', confidence: 0.9, reason: '', feelings: [], risk: false }));
    expect((await match('i want to die', 'en', deps(f))).risk).toBe(true);
  });
  it('rejects keys outside the content pack', () => {
    expect(parseMatch({ key: 'job', confidence: 0.9 }).key).toBeNull();
    expect(parseMatch({ key: 'job', confidence: 0.9 }).confidence).toBe(0);
  });
  it('translate throws when no relay is configured (screen shows tr_off)', async () => {
    await expect(translateMessage('hi', 'my', 'en', { url: '', installId: '', fetch: jest.fn() })).rejects.toThrow();
  });
  it('translate returns translation and back-translation', async () => {
    const f = jest.fn(() => json({ translation: 'Hello', back: 'မင်္ဂလာပါ' }));
    await expect(translateMessage('မင်္ဂလာပါ', 'my', 'en', deps(f))).resolves.toEqual({
      translation: 'Hello',
      back: 'မင်္ဂလာပါ',
    });
  });
});

describe('ScriptureService fallback (YouVersion mocked)', () => {
  beforeEach(clearScriptureCache);
  const meta = {
    id: 206,
    abbreviation: 'WEBUS',
    localized_abbreviation: 'WEBUS',
    title: 'World English Bible',
    localized_title: 'World English Bible',
    copyright: 'Public domain',
    language_tag: 'en',
    youversion_deep_link: 'https://bible.com',
  };
  const okFetch = jest.fn((url: string) =>
    url.includes('/passages/') ? json({ id: 'x', content: '<p>text</p>', reference: 'Ruth 1' }) : json(meta),
  );
  const deps = (o: Partial<ScriptureDeps> = {}): ScriptureDeps => ({
    appKey: 'key',
    version: { id: 206, abbr: 'WEBUS' },
    isOnline: async () => true,
    fetch: okFetch as unknown as typeof fetch,
    ...o,
  });

  it('YouVersion when key, network, metadata and passage all work', async () => {
    const r = await resolve('ruth', 'en', deps());
    expect(r).toMatchObject({ source: 'youversion', versionId: 206, abbr: 'WEBUS', attribution: 'Public domain' });
    expect(r.source === 'youversion' && r.excerpt).toEqual(['RUT.1.16']);
  });
  it('no key → bundled', async () => {
    expect(await resolve('ruth', 'en', deps({ appKey: '' }))).toMatchObject({
      source: 'bundled',
      reason: 'no-key',
      abbr: 'WEBBE',
    });
  });
  it('no confirmed version → bundled, and no YouVersion link', async () => {
    const r = await resolve('ruth', 'en', deps({ version: null }));
    expect(r).toMatchObject({ source: 'bundled', reason: 'no-version', link: null });
    expect(youVersionLink(r, 'ruth')).toBeNull();
  });
  it('offline → bundled', async () => {
    expect(await resolve('ruth', 'en', deps({ isOnline: async () => false }))).toMatchObject({
      source: 'bundled',
      reason: 'offline',
    });
  });
  it('timeout → bundled', async () => {
    const slow = jest.fn(
      (_u: string, init?: RequestInit) =>
        new Promise<Response>((_, rej) => init?.signal?.addEventListener('abort', () => rej(new Error('AbortError')))),
    );
    const r = await resolve('ruth', 'en', deps({ fetch: slow as unknown as typeof fetch, timeoutMs: 20 }));
    expect(r).toMatchObject({ source: 'bundled', reason: 'preflight-failed' });
  });
  it('SDK / passage error → bundled', async () => {
    const f = jest.fn((url: string) => (url.includes('/passages/') ? json({ content: '' }) : json(meta)));
    expect(await resolve('ruth', 'en', deps({ fetch: f as unknown as typeof fetch }))).toMatchObject({
      source: 'bundled',
      reason: 'passage-error',
    });
  });
  it('401 → bundled', async () => {
    const f = jest.fn(() => json({}, false, 401));
    expect(await resolve('ruth', 'en', deps({ fetch: f as unknown as typeof fetch }))).toMatchObject({
      source: 'bundled',
    });
  });
  it('Arabic passage missing → English bundled with fallback note', async () => {
    expect(await resolve('ruth', 'ar', deps({ appKey: '' }))).toMatchObject({
      textLang: 'en',
      fallback: true,
      abbr: 'WEBBE',
    });
    expect(await resolve('neh', 'ar', deps({ appKey: '' }))).toMatchObject({ textLang: 'ar', fallback: false });
  });

  it('defaults chosen on 2026-10-04: every language but Burmese has a YouVersion version', () => {
    expect(BIBLE_VERSIONS).toEqual({
      en: { id: 3034, abbr: 'BSB' },
      my: null,
      zh: { id: 43, abbr: 'CSBS' },
      ja: { id: 81, abbr: 'JA1955' },
      ar: { id: 195, abbr: 'ت ع م' },
    });
  });

  it('uses the language default until she picks a version', () => {
    usePrefs.getState().set({ yvVersions: {} });
    expect(scriptureDeps('ja').version).toEqual({ id: 81, abbr: 'JA1955' });
    expect(scriptureDeps('my').version).toBeNull();
  });

  it('her pick stays with the language she picked it in', () => {
    usePrefs.getState().set({ yvVersions: { zh: { id: 312, abbr: 'CSBT' } } });
    expect(scriptureDeps('zh').version).toEqual({ id: 312, abbr: 'CSBT' });
    expect(scriptureDeps('en').version).toEqual({ id: 3034, abbr: 'BSB' });
    usePrefs.getState().set({ yvVersions: {} });
  });

  it('a single choice saved by an older build becomes the choice for the language she used', () => {
    expect(migratePrefs({ lang: 'zh', yvVersion: { id: 312, abbr: 'CSBT' } })).toEqual({
      lang: 'zh',
      yvVersions: { zh: { id: 312, abbr: 'CSBT' } },
    });
    expect(migratePrefs({ lang: 'en', yvVersion: null })).toEqual({ lang: 'en' });
  });

  it('Burmese: bundled Judson and no YouVersion pill', async () => {
    const r = await resolve('neh', 'my', deps({ version: BIBLE_VERSIONS.my }));
    expect(r).toMatchObject({ source: 'bundled', reason: 'no-version', abbr: 'Judson' });
    expect(youVersionLink(r, 'neh')).toBeNull();
  });

  it('the version label matches what "Open in YouVersion" opens', async () => {
    const yv = await resolve('ruth', 'en', deps());
    const l1 = youVersionLink(yv, 'ruth')!;
    expect(yv.source === 'youversion' && l1.versionId === yv.versionId && l1.abbr === yv.abbr).toBe(true);
    expect(l1.url).toBe('https://www.bible.com/bible/206/RUT.1');
    // Bundled shown (offline), YouVersion has a different version: the pill names the version it opens.
    const off = await resolve('ruth', 'en', deps({ isOnline: async () => false }));
    const l2 = youVersionLink(off, 'ruth')!;
    expect(off.abbr).toBe('WEBBE');
    expect(l2).toMatchObject({ versionId: 206, abbr: 'WEBUS', inApp: false });
  });
});

describe('music resolution order', () => {
  const cfg: MusicConfig = {
    ...MUSIC,
    moments: { pray: 1, sit: null, scripture: null },
    bySelection: { S: { pray: 2 } },
    byPath: { ruth: { pray: 3, sit: 'https://x/ruth.mp3' } },
  };
  it('byPath → bySelection → moments → silence', () => {
    expect(resolveTrack('pray', { path: 'ruth', sel: 'S' }, cfg)).toBe(3);
    expect(resolveTrack('pray', { path: 'neh', sel: 'S' }, cfg)).toBe(2);
    expect(resolveTrack('pray', { path: 'neh', sel: 'F' }, cfg)).toBe(1);
    expect(resolveTrack('sit', { path: 'neh', sel: 'F' }, cfg)).toBeNull();
    expect(resolveTrack('sit', { path: 'ruth' }, cfg)).toBe('https://x/ruth.mp3');
  });
  it('no track configured by default (no settings switch)', () => expect(anyMusicConfigured()).toBe(false));
  it('fades step volume to the target', () => {
    const s = fadeSteps(0, 0.35, 2500);
    expect(s).toHaveLength(25);
    expect(s[s.length - 1]).toBe(0.35);
    expect(fadeSteps(0.35, 0, 1500).at(-1)).toBe(0);
  });
});

describe('help lines', () => {
  it('every entry carries verifiedBy and verifiedOn fields', () => {
    for (const l of ALL_HELP_LINES) {
      expect(l).toHaveProperty('verifiedBy');
      expect(l).toHaveProperty('verifiedOn');
    }
  });
  it('never shows an unverified local number', () => {
    expect(localEmergencyFor('US')).toBeNull();
    expect(
      isVerified({ id: 'x', kind: 'tel', value: '1', region: 'US', verifiedBy: 'Kezia', verifiedOn: '2026-10-05' }),
    ).toBe(true);
  });
});

describe('translate-on-open', () => {
  const m: Moment = {
    id: 'm',
    kind: 'moment',
    createdAt: 1,
    lang: 'en',
    path: 'neh',
    sel: 'F',
    from: 'pics',
    passage: true,
    scriptureSource: 'bundled',
    versionId: null,
    abbr: 'WEBBE',
    stay: P('neh', 'options', 'en')[1],
    stayIndex: 1,
    prayer: P('neh', 'prayer', 'en'),
    prayerEdited: false,
    words: 'my words',
    msg: 'my message',
  };
  it('re-renders bundled content in the new language', () => {
    const patch = translateMoment(m, 'zh');
    expect(patch).toMatchObject({
      lang: 'zh',
      stay: P('neh', 'options', 'zh')[1],
      prayer: P('neh', 'prayer', 'zh'),
      abbr: '和合本',
    });
  });
  it('never translates her own words', () => {
    const patch = translateMoment({ ...m, prayer: 'I wrote this', prayerEdited: true }, 'ja');
    expect(patch.prayer).toBeUndefined();
    expect(patch).not.toHaveProperty('words');
    expect(patch).not.toHaveProperty('msg');
  });
});
