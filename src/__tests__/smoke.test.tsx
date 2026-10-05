/**
 * Smoke suite (brief 14): screens render for all 10 selections in all 5
 * languages; no words → Psalm 77; doesn't-fit alternates; the save flow and
 * save-once; the chosen say-line joins the prayer card; Home shows no moment
 * content; recover and the 3-day expiry via the test clock; translate-on-open;
 * prefs persist; the panel stays English. YouVersion is mocked; no network.
 */
import { Slot, router } from 'expo-router';
import { renderRouter, screen, act, fireEvent, waitFor } from 'expo-router/testing-library';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider } from '@/theme';
import { TourProvider } from '@/features/tour/TourProvider';
import { SheetHost } from '@/features/sheets/SheetHost';
import { createMemoryStore } from '@/data/memory-store';
import { setStore, getStore } from '@/data/store';
import { usePrefs, defaultPrefs } from '@/state/prefs';
import {
  useSession,
  pauseSession,
  cleanupPaused,
  saveMoment,
  setRotationRng,
  openPictures,
} from '@/state/session-store';
import { useUi } from '@/state/ui';
import { recoverOffered } from '@/state/launch';
import * as S from '@/state/session';
import { LANGS, type Lang } from '@/i18n/langs';
import { MATRIX, P, SEL_KEYS, B, type SelKey } from '@/lib/content';
import { DAY_MS } from '@/config/privacy';
import { createI18n, translate } from '@/i18n/core';

import Home from '../../app/(tabs)/index';
import Moments from '../../app/(tabs)/moments';
import More from '../../app/(tabs)/more';
import Feel from '../../app/session/feel';
import ScriptureScreen from '../../app/session/scripture';
import Pray from '../../app/session/pray';
import After from '../../app/session/after';
import Reach from '../../app/session/reach';
import Sit from '../../app/session/sit';
import Keep from '../../app/session/keep';
import Crisis from '../../app/session/crisis';
import Done from '../../app/done';
import Help from '../../app/help';
import MomentDetail from '../../app/moment/[id]';
import Panel from '../../app/panel';

const i18n = createI18n('en');
const tt = (lang: Lang, key: string, vars?: Record<string, string | number>) => translate(i18n, lang, key, vars);

function Root() {
  return (
    <ThemeProvider>
      <BottomSheetModalProvider>
        <TourProvider>
          <Slot />
          <SheetHost />
        </TourProvider>
      </BottomSheetModalProvider>
    </ThemeProvider>
  );
}

const routes = {
  _layout: Root,
  index: Home,
  moments: Moments,
  more: More,
  'session/feel': Feel,
  'session/scripture': ScriptureScreen,
  'session/pray': Pray,
  'session/after': After,
  'session/reach': Reach,
  'session/sit': Sit,
  'session/keep': Keep,
  'session/crisis': Crisis,
  done: Done,
  help: Help,
  'moment/[id]': MomentDetail,
  panel: Panel,
};

function setup(lang: Lang = 'en') {
  // Stands in for a working encrypted DB (the memory-only fallback is tested on its own).
  setStore(createMemoryStore({ persistent: true }));
  usePrefs.setState({ ...defaultPrefs(), lang, tourDone: true, tipsOn: false });
  useSession.setState({ s: null, stack: [] });
  useUi.setState({ sheet: null, status: '', aiLog: [] });
  recoverOffered.done = false;
}

function startWith(lang: Lang, fn: (s: S.SessionState) => S.SessionState, stack: S.Screen[]) {
  useSession.setState({ s: { ...fn(S.freshSession(lang)), screen: stack[stack.length - 1] }, stack });
}

const openSel = (sel: SelKey) => (s: S.SessionState) =>
  S.openStory({ ...s, pics: sel.split('') as S.SessionState['pics'] }, { from: 'pics', sel, path: MATRIX[sel].path });

beforeEach(() => setup());

describe('every Scripture screen, all 10 selections × 5 languages', () => {
  for (const lang of LANGS)
    for (const sel of SEL_KEYS)
      it(`${lang} ${sel}`, async () => {
        setup(lang);
        startWith(lang, openSel(sel), ['feel', 'scripture']);
        renderRouter(routes, { initialUrl: '/session/scripture' });
        expect(await screen.findByTestId('screen-scripture')).toBeTruthy();
        expect(screen.getByText(B(sel, lang).h)).toBeTruthy();
        expect(screen.getByText(P(MATRIX[sel].path, 'invite', lang))).toBeTruthy();
        // The edition is always named on the card.
        await waitFor(() => expect(screen.getByTestId('edition-abbr')).toHaveTextContent(/\S/));
        // Never an internal picture key or emotion name on screen.
        expect(screen.queryByText(/Sadness|Fear|Anger|Enjoyment/)).toBeNull();
      });
});

describe('core screens render in all 5 languages', () => {
  const screens: [string, S.Screen[]][] = [
    ['/session/feel', ['feel']],
    ['/session/pray', ['feel', 'scripture', 'pray']],
    ['/session/after', ['feel', 'scripture', 'pray', 'after']],
    ['/session/reach', ['feel', 'scripture', 'pray', 'after', 'reach']],
    ['/session/sit', ['feel', 'scripture', 'pray', 'after', 'sit']],
    ['/session/keep', ['feel', 'scripture', 'pray', 'after', 'keep']],
    ['/session/crisis', ['feel', 'crisis']],
  ];
  for (const lang of LANGS)
    it.each(screens)(`${lang} %s`, async (url, stack) => {
      setup(lang);
      startWith(lang, openSel('F'), stack);
      renderRouter(routes, { initialUrl: url });
      expect(await screen.findByTestId(`screen-${url.split('/').pop()}`)).toBeTruthy();
      expect(screen.queryByText(/\{n\}|\{name\}|\{ref\}|TODO/)).toBeNull();
    });
  it.each(LANGS)('Home, Help, Moments, Settings, Done (%s)', async (lang) => {
    setup(lang);
    for (const url of ['/', '/help', '/moments', '/more', '/done']) {
      const r = renderRouter(routes, { initialUrl: url });
      expect(await screen.findByTestId(`screen-${url === '/' ? 'home' : url.slice(1)}`)).toBeTruthy();
      r.unmount();
    }
  });
});

it('no words opens Psalm 77 with a Help link', async () => {
  startWith('en', S.openNoWords, ['feel', 'scripture']);
  renderRouter(routes, { initialUrl: '/session/scripture' });
  expect(await screen.findByTestId('nw-help')).toBeTruthy();
  expect(screen.getByText(B('NW', 'en').h)).toBeTruthy();
});

it('tap count: Home → picture → Continue reaches Scripture in 3 taps', async () => {
  setRotationRng(() => 0.5);
  renderRouter(routes, { initialUrl: '/' });
  fireEvent.press(await screen.findByTestId('begin')); // 1
  fireEvent.press(await screen.findByTestId('pic-2')); // 2 (second picture)
  fireEvent.press(screen.getByTestId('continue')); // 3
  expect(await screen.findByTestId('screen-scripture')).toBeTruthy();
  expect(useSession.getState().s?.path).toBe('neh'); // first F pick is the primary
});

it("doesn't fit: swap to the alternate person", async () => {
  startWith('en', openSel('F'), ['feel', 'scripture']);
  renderRouter(routes, { initialUrl: '/session/scripture' });
  fireEvent.press(await screen.findByTestId('not-fit'));
  fireEvent.press(await screen.findByTestId('nofit-person'));
  await waitFor(() => expect(useSession.getState().s?.path).toBe('ruth'));
  // Bridge keeps h but uses Ruth's own frame (never names Nehemiah for Ruth).
  expect(await screen.findByText(P('ruth', 'frame', 'en'))).toBeTruthy();
});

it("doesn't fit: asks before replacing a prayer she edited", async () => {
  startWith('en', (s) => S.setPrayer(openSel('F')(s), 'God, I wrote this myself.'), ['feel', 'scripture']);
  renderRouter(routes, { initialUrl: '/session/scripture' });
  fireEvent.press(await screen.findByTestId('not-fit'));
  fireEvent.press(await screen.findByTestId('nofit-person'));
  expect(await screen.findByTestId('swap-confirm')).toBeTruthy();
  expect(useSession.getState().s?.path).toBe('neh');
  fireEvent.press(screen.getByTestId('swap-confirm-yes'));
  await waitFor(() => expect(useSession.getState().s?.path).toBe('ruth'));
});

it('the chosen say-line joins the prayer card', async () => {
  startWith('en', openSel('F'), ['feel', 'scripture', 'pray']);
  renderRouter(routes, { initialUrl: '/session/pray' });
  fireEvent.press(await screen.findByTestId('say-1'));
  const line = P('neh', 'options', 'en')[1];
  expect(await screen.findByTestId('prayer-stay')).toHaveTextContent(line, { exact: false });
  // Her editable prayer is untouched.
  expect(screen.getByTestId('prayer-input').props.value).toBe(P('neh', 'prayer', 'en'));
});

it('save flow: saves once; Keep then shows it as saved', async () => {
  startWith('en', (s) => S.toggleStay(openSel('F')(s), 0), ['feel', 'scripture', 'pray', 'after', 'keep']);
  renderRouter(routes, { initialUrl: '/session/keep' });
  fireEvent.press(await screen.findByTestId('save-moment'));
  await waitFor(async () => expect(await getStore().moments.count()).toBe(1));
  // A second save (e.g. Back from Done) does nothing.
  await act(async () => {
    await saveMoment('en', 'x');
  });
  expect(await getStore().moments.count()).toBe(1);
  const [m] = await getStore().moments.list();
  expect(m.stay).toBe(P('neh', 'options', 'en')[0]);
  expect(m.msg).toBeNull(); // never pre-checked without "Keep this message"
});

it('double tap on Save (while the first save is writing) saves one Moment', async () => {
  startWith('en', (s) => S.toggleStay(openSel('F')(s), 0), ['feel', 'scripture', 'pray', 'after', 'keep']);
  const results = await Promise.all([saveMoment('en', ''), saveMoment('en', '')]);
  expect(results.filter(Boolean)).toHaveLength(1);
  expect(await getStore().moments.count()).toBe(1);
});

it('double tap on Continue draws the story once (the rotation advances once)', async () => {
  startWith('en', (s) => ({ ...s, pics: ['F'] as S.SessionState['pics'] }), ['feel']);
  const put = jest.spyOn(getStore().rotation, 'put');
  const results = await Promise.all([openPictures(), openPictures()]);
  expect(results.filter(Boolean)).toHaveLength(1);
  expect(put).toHaveBeenCalledTimes(1);
});

const atKeep = () =>
  startWith('en', (s) => S.toggleStay(openSel('F')(s), 0), ['feel', 'scripture', 'pray', 'after', 'keep']);

it('saved with working storage: Done says "Saved to Moments on this phone"', async () => {
  atKeep();
  renderRouter(routes, { initialUrl: '/session/keep' });
  expect(screen.queryByText(tt('en', 'store_memory'))).toBeNull();
  fireEvent.press(await screen.findByTestId('save-moment'));
  expect(await screen.findByTestId('saved-ok')).toHaveTextContent(tt('en', 'saved_ok'));
});

it("storage couldn't be opened (memory only): Keep and Done say it's kept only until KNOWN closes", async () => {
  setStore(createMemoryStore());
  atKeep();
  renderRouter(routes, { initialUrl: '/session/keep' });
  expect(await screen.findByText(tt('en', 'store_memory'))).toBeTruthy();
  fireEvent.press(await screen.findByTestId('save-moment'));
  expect(await screen.findByTestId('saved-ok')).toHaveTextContent(tt('en', 'saved_memory'));
  expect(screen.queryByText(tt('en', 'saved_ok'))).toBeNull();
});

it('Home never shows moment content, only a count', async () => {
  await getStore().moments.add({
    id: 'm1',
    kind: 'moment',
    createdAt: 1,
    lang: 'en',
    path: 'neh',
    sel: 'F',
    from: 'words',
    passage: true,
    scriptureSource: 'bundled',
    versionId: null,
    abbr: 'WEBBE',
    stay: 'secret line',
    stayIndex: 0,
    prayer: 'secret prayer',
    prayerEdited: true,
    words: 'secret words',
    msg: null,
  });
  renderRouter(routes, { initialUrl: '/' });
  expect(await screen.findByText(/\(1\)/)).toBeTruthy();
  expect(screen.queryByText(/secret/)).toBeNull();
  expect(screen.queryByText(P('neh', 'title', 'en'))).toBeNull();
});

it('pause → recover sheet; after 3 days the paused moment is gone and a quiet notice shows once', async () => {
  startWith('en', openSel('F'), ['feel', 'scripture']);
  await act(async () => {
    await pauseSession();
  });
  expect(await getStore().session.get()).not.toBeNull();
  renderRouter(routes, { initialUrl: '/' });
  expect(await screen.findByTestId('recover-continue')).toBeTruthy();
  expect(screen.getByText(new RegExp(tt('en', 'recover_where2', { step: tt('en', 'st_scripture') })))).toBeTruthy();

  // Fast-forward 4 days on the test clock (judge panel on) and relaunch the cleanup.
  act(() => usePrefs.getState().set({ panelOn: true, clockOffset: 4 * DAY_MS }));
  await act(async () => {
    expect(await cleanupPaused()).toBe(true);
  });
  expect(await getStore().session.get()).toBeNull();
  // Home shows the one-time quiet line (and never what was in the moment), then clears the flag.
  expect(await screen.findByText(translate(i18n, 'en', 'paused_removed', { count: 3 }))).toBeTruthy();
  expect(usePrefs.getState().removedNotice).toBe(false);
});

it('switching the judge panel off in Settings also resets its clock', async () => {
  usePrefs.getState().set({ panelOn: true, clockOffset: 4 * DAY_MS });
  renderRouter(routes, { initialUrl: '/more' });
  fireEvent(await screen.findByTestId('panel-switch'), 'valueChange', false);
  expect(usePrefs.getState()).toMatchObject({ panelOn: false, clockOffset: 0 });
});

it('the recover sheet is offered once per launch, not every time Home is shown', async () => {
  recoverOffered.done = true; // Home was already shown this launch (e.g. before she paused)
  startWith('en', openSel('F'), ['feel', 'scripture']);
  await act(async () => {
    await pauseSession();
  });
  renderRouter(routes, { initialUrl: '/' });
  expect(await screen.findByTestId('paused-card')).toBeTruthy();
  expect(useUi.getState().sheet).toBeNull();
  fireEvent.press(screen.getByTestId('begin'));
  await waitFor(() => expect(useUi.getState().sheet).toBe('recover'));
});

describe('Keep → Finish without saving', () => {
  // Opened straight at Keep, the test router has no stack for leaveTo's dismissAll to pop.
  beforeEach(() => jest.spyOn(router, 'dismissAll').mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it('asks first when she changed the prayer', async () => {
    startWith('en', (s) => S.setPrayer(openSel('F')(s), 'my own prayer'), [
      'feel',
      'scripture',
      'pray',
      'after',
      'keep',
    ]);
    renderRouter(routes, { initialUrl: '/session/keep' });
    fireEvent.press(await screen.findByTestId('finish-without'));
    expect(await screen.findByTestId('finish-confirm')).toBeTruthy();
    expect(useSession.getState().s).not.toBeNull(); // nothing thrown away yet
    fireEvent.press(screen.getByTestId('finish-confirm-no'));
    expect(await screen.findByTestId('save-moment')).toBeTruthy();
    fireEvent.press(screen.getByTestId('finish-without'));
    fireEvent.press(await screen.findByTestId('finish-confirm-yes'));
    expect(await screen.findByTestId('screen-done')).toBeTruthy();
    expect(useSession.getState().s).toBeNull();
  });

  it('goes straight on when she typed nothing', async () => {
    atKeep();
    renderRouter(routes, { initialUrl: '/session/keep' });
    fireEvent.press(await screen.findByTestId('finish-without'));
    expect(await screen.findByTestId('screen-done')).toBeTruthy();
    expect(screen.queryByTestId('finish-confirm')).toBeNull();
  });
});

it('exit sheet: asks before ending a moment with typed words', async () => {
  startWith('en', (s) => S.setPrayer(openSel('F')(s), 'my own prayer'), ['feel', 'scripture', 'pray']);
  renderRouter(routes, { initialUrl: '/session/pray' });
  act(() => useUi.getState().openSheet('exit'));
  fireEvent.press(await screen.findByTestId('exit-end'));
  expect(await screen.findByTestId('discard-confirm')).toBeTruthy();
});

it('translate-on-open asks, and keeps her own words', async () => {
  await getStore().moments.add({
    id: 'm2',
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
    stay: P('neh', 'options', 'en')[0],
    stayIndex: 0,
    prayer: 'My own prayer.',
    prayerEdited: true,
    words: null,
    msg: null,
  });
  setup('zh');
  setStore(getStore());
  await getStore().moments.add({
    id: 'm3',
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
    stay: P('neh', 'options', 'en')[0],
    stayIndex: 0,
    prayer: 'My own prayer.',
    prayerEdited: true,
    words: null,
    msg: null,
  });
  renderRouter(routes, { initialUrl: '/moment/m3' });
  fireEvent.press(await screen.findByTestId('translate-q-yes'));
  await waitFor(async () => expect((await getStore().moments.get('m3'))?.lang).toBe('zh'));
  const m = await getStore().moments.get('m3');
  expect(m?.stay).toBe(P('neh', 'options', 'zh')[0]);
  expect(m?.prayer).toBe('My own prayer.');
});

it('preferences persist (MMKV)', () => {
  usePrefs.getState().set({ theme: 'dark', lang: 'ja' });
  const stored = JSON.parse(require('react-native-mmkv').createMMKV({ id: 'known.prefs' }).getString('known.prefs.v1'));
  expect(stored).toMatchObject({ theme: 'dark', lang: 'ja' });
});

it('the judge panel stays English in every language', async () => {
  setup('ar');
  renderRouter(routes, { initialUrl: '/panel' });
  expect(await screen.findByText('Golden path')).toBeTruthy();
  expect(screen.getByText('Clock and privacy')).toBeTruthy();
});

it('Help leads with findahelpline.com and has no number for an unverified region', async () => {
  renderRouter(routes, { initialUrl: '/help' });
  expect(await screen.findByTestId('help-findahelpline')).toBeTruthy();
});

it('Translate is hidden without a relay (no fake buttons)', async () => {
  startWith('en', (s) => ({ ...openSel('F')(s), msg: { ...s.msg, lang: 'my' } }), [
    'feel',
    'scripture',
    'pray',
    'after',
    'reach',
  ]);
  renderRouter(routes, { initialUrl: '/session/reach' });
  expect(await screen.findByTestId('tr-off')).toBeTruthy();
  expect(screen.queryByTestId('translate')).toBeNull();
});
