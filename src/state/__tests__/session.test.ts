import * as S from '../session';
import { B, MATRIX, NW, P, isPathKey, PATHS } from '@/lib/content';
import { createI18n } from '@/i18n/core';
import { LANGS } from '@/i18n/langs';

const fresh = () => S.freshSession('en');
const t = S.tFor(createI18n('en'), 'en');

describe('pictures', () => {
  it('chooses 1–2; a third tap replaces the oldest; tapping again clears', () => {
    let s = fresh();
    s = S.togglePic(s, 'S');
    s = S.togglePic(s, 'F');
    expect(s.pics).toEqual(['S', 'F']);
    s = S.togglePic(s, 'J');
    expect(s.pics).toEqual(['F', 'J']);
    s = S.togglePic(s, 'F');
    expect(s.pics).toEqual(['J']);
  });
});

describe('bridge rule (8.2)', () => {
  it.each(Object.keys(MATRIX))('primary story for %s shows the bridge h + p', (sel) => {
    const k = sel as keyof typeof MATRIX;
    const s = S.openStory(fresh(), { from: 'pics', sel: k, path: MATRIX[k].path });
    expect(S.bridgeFor(s, 'en')).toEqual(B(k, 'en'));
  });

  it.each(Object.keys(MATRIX))('a rotated story for %s keeps h but uses its own frame', (sel) => {
    const k = sel as keyof typeof MATRIX;
    const other = MATRIX[k].alt;
    const s = S.openStory(fresh(), { from: 'pics', sel: k, path: other });
    expect(S.bridgeFor(s, 'en')).toEqual({ h: B(k, 'en').h, p: P(other, 'frame', 'en') });
  });

  it('never names the wrong person: F with Ruth does not mention Nehemiah', () => {
    const s = S.openStory(fresh(), { from: 'pics', sel: 'F', path: 'ruth' });
    expect(S.bridgeFor(s, 'en')!.p).not.toMatch(/his people/);
  });

  it('no words opens Psalm 77 with the NW bridge', () => {
    const s = S.openNoWords(fresh());
    expect(s.path).toBe('ps77');
    expect(S.bridgeFor(s, 'en')).toEqual(B('NW', 'en'));
  });

  it('own words shows no bridge', () => {
    const s = S.openStory(fresh(), { from: 'words', sel: null, path: 'neh' });
    expect(S.bridgeFor(s, 'en')).toBeNull();
  });
});

describe("doesn't fit (swap)", () => {
  it('offers the ALT person once, and laments minus current and seen', () => {
    const s = S.openStory(fresh(), { from: 'pics', sel: 'F', path: 'neh' });
    const o = S.noFitOptions(s);
    expect(o.person).toBe('ruth');
    expect(o.psalms).toEqual([NW, 'ps61', 'ps13', 'ps62', 'ps56', 'ps139']);
    const after = S.swap(s, 'ruth');
    expect(S.noFitOptions(after).person).toBe('joseph');
    expect(after.seen).toEqual(['neh', 'ruth']);
  });

  it('swapping resets the prayer, the chosen line and the message', () => {
    let s = S.openStory(fresh(), { from: 'pics', sel: 'F', path: 'neh' });
    s = S.toggleStay(S.setPrayer(s, 'my words'), 1);
    s = S.setMsgText(s, 'hi');
    const after = S.swap(s, 'ruth');
    expect(after.prayer).toBeNull();
    expect(after.stay).toBeNull();
    expect(after.msg.text).toBeNull();
  });

  it('knows when she edited the prayer (so the swap asks first)', () => {
    const s = S.openStory(fresh(), { from: 'pics', sel: 'F', path: 'neh' });
    expect(S.prayerEdited(s, 'en')).toBe(false);
    expect(S.prayerEdited(S.setPrayer(s, P('neh', 'prayer', 'en')), 'en')).toBe(false);
    expect(S.prayerEdited(S.setPrayer(s, 'God, hear me.'), 'en')).toBe(true);
    expect(S.hasTyped(S.setPrayer(s, 'God, hear me.'), 'en')).toBe(true);
  });
});

describe('own words acceptance (8.8)', () => {
  const base = { reason: 'r', feelings: [] as string[], risk: false, source: 'ai' as const };
  it('accepts a known key with confidence ≥ 0.45', () => {
    const { result } = S.acceptMatch({ ...base, key: 'neh', confidence: 0.8 }, isPathKey);
    expect(result.key).toBe('neh');
    expect(result.unsure).toBeUndefined();
  });
  it('rejects keys not in the content pack', () => {
    const { result } = S.acceptMatch({ ...base, key: 'job' as never, confidence: 0.9, feelings: ['fear'] }, isPathKey);
    expect(result.key).toBe('neh');
    expect(result.unsure).toBe(true);
  });
  it('low confidence uses internal feelings → MATRIX with ai_start', () => {
    const { result } = S.acceptMatch(
      { ...base, key: 'hab', confidence: 0.2, feelings: ['sadness', 'fear'] },
      isPathKey,
    );
    expect(result.key).toBe(MATRIX.SF.path);
    expect(result.reason).toBe('');
    expect(result.unsure).toBe(true);
  });
  it('still nothing → Psalm 77', () => {
    expect(S.acceptMatch({ ...base, key: null, confidence: 0 }, isPathKey).result.key).toBe('ps77');
  });
  it('risk goes to Crisis; with no confident match the story is Psalm 77', () => {
    const r = S.acceptMatch({ ...base, key: null, confidence: 0, risk: true }, isPathKey);
    expect(r.crisis).toBe(true);
    expect(r.result.key).toBe('ps77');
  });
});

describe('the chosen say-line does something visible', () => {
  it('appears as the stay text and in the kept Moment', () => {
    let s = S.openStory(fresh(), { from: 'pics', sel: 'F', path: 'neh' });
    s = S.toggleStay(s, 2);
    const line = P('neh', 'options', 'en')[2];
    expect(S.stayText(s, 'en')).toBe(line);
    const m = S.buildMoment(s, {
      id: 'm1',
      now: 1,
      lang: 'en',
      msgText: '',
      scripture: { source: 'bundled', versionId: null, abbr: 'WEBBE' },
    });
    expect(m.stay).toBe(line);
    expect(m.stayIndex).toBe(2);
    // Never inserted into her editable prayer.
    expect(S.currentPrayer(s, 'en')).toBe(P('neh', 'prayer', 'en'));
  });
});

describe('Keep', () => {
  it('shows rows per the brief and never pre-checks a message she did not keep', () => {
    let s = S.openStory(fresh(), { from: 'pics', sel: 'F', path: 'neh' });
    expect(S.keepRows(s)).toEqual(['passage', 'prayer']);
    s = S.toggleStay(s, 0);
    s = S.keepMsg(s);
    expect(S.keepRows(s)).toEqual(['passage', 'stay', 'prayer', 'msg']);
    const w = S.openStory({ ...fresh(), words: 'I miss home' }, { from: 'words', sel: null, path: 'neh' });
    expect(S.keepRows(w)).toContain('words');
    expect(w.keep.words).toBe(false);
  });

  it('save is disabled when nothing is checked', () => {
    let s = S.openStory(fresh(), { from: 'pics', sel: 'F', path: 'neh' });
    s = S.toggleKeep(S.toggleKeep(s, 'passage'), 'prayer');
    expect(S.canSave(s)).toBe(false);
  });

  it('saves once: a saved moment cannot be saved again', () => {
    const s = { ...S.openStory(fresh(), { from: 'pics', sel: 'F', path: 'neh' }), savedMomentId: 'm1' };
    expect(S.canSave(s)).toBe(false);
  });

  it('only checked items are kept', () => {
    let s = S.openStory(fresh(), { from: 'pics', sel: 'F', path: 'neh' });
    s = S.toggleKeep(s, 'prayer');
    const m = S.buildMoment(s, {
      id: 'x',
      now: 5,
      lang: 'en',
      msgText: 'hello',
      scripture: { source: 'bundled', versionId: null, abbr: 'WEBBE' },
    });
    expect(m.passage).toBe(true);
    expect(m.prayer).toBeNull();
    expect(m.msg).toBeNull();
  });
});

describe('Reach out message', () => {
  it('composes m_hi + body + need, and recomposes on need change unless edited', () => {
    let s = S.openStory(fresh(), { from: 'pics', sel: 'F', path: 'neh' });
    const msg = S.compose(s, 'en', t, () => true);
    expect(msg).toContain('Nehemiah');
    expect(msg).toContain('Could you just listen');
    s = S.setNeed(s, 'pray');
    expect(S.compose(s, 'en', t, () => true)).toContain('Would you pray with me?');
    s = S.setNeed(S.setMsgText(s, 'my own'), 'time');
    expect(s.msg.text).toBe('my own');
  });
});

describe('step dots', () => {
  it('maps screens to steps', () => {
    expect(S.dotFor('feel')).toBe(1);
    expect(S.dotFor('crisis')).toBe(2);
    expect(S.dotFor('pray')).toBe(3);
    expect(S.dotFor('keep')).toBe(4);
  });
});

describe('every language has every say-line set', () => {
  it.each(LANGS)('%s', (lang) => {
    for (const k of Object.keys(PATHS.en))
      expect(P(k as never, 'options', lang).length).toBe(PATHS.en[k as 'neh'].options.length);
  });
});
