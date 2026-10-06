/**
 * Oct 6 redesign: Welcome cards and Home (Night), the Pictures row "None of these feel
 * right", Text size, the living lamp's shared clock, and Stay here a moment with her own
 * prayer line by line (AI may choose only where the lines break).
 */
import { Slot } from 'expo-router';
import { renderRouter, screen, act, fireEvent, waitFor } from 'expo-router/testing-library';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { ThemeProvider, makeType } from '@/theme';
import { TEXT_SCALE, clampTextScale } from '@/theme/fonts';
import { TourProvider } from '@/features/tour/TourProvider';
import { SheetHost } from '@/features/sheets/SheetHost';
import { createMemoryStore } from '@/data/memory-store';
import { setStore } from '@/data/store';
import { usePrefs, defaultPrefs } from '@/state/prefs';
import { useSession } from '@/state/session-store';
import { useUi } from '@/state/ui';
import * as S from '@/state/session';
import { MATRIX, NW } from '@/lib/content';
import { createI18n, translate } from '@/i18n/core';
import type { Lang } from '@/i18n/langs';
import { lampPhase, swell, PULSE_MS } from '@/components/LivingLamp';
import { BREATH_MS } from '@/components/Lamp';
import { breakLines, lineMs, sameText, splitLocal } from '@/services/prayer/lines';
import type { RelayDeps } from '@/services/matcher/matcher';

import Home from '../../app/(tabs)/index';
import More from '../../app/(tabs)/more';
import Onboarding from '../../app/onboarding';
import Feel from '../../app/session/feel';
import ScriptureScreen from '../../app/session/scripture';
import After from '../../app/session/after';
import Sit from '../../app/session/sit';

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
  more: More,
  onboarding: Onboarding,
  'session/feel': Feel,
  'session/scripture': ScriptureScreen,
  'session/after': After,
  'session/sit': Sit,
};

function setup(lang: Lang = 'en', tourDone = true) {
  setStore(createMemoryStore({ persistent: true }));
  usePrefs.setState({ ...defaultPrefs(), lang, tourDone, tipsOn: false });
  useSession.setState({ s: null, stack: [] });
  useUi.setState({ sheet: null, status: '', aiLog: [] });
}
function startWith(lang: Lang, fn: (s: S.SessionState) => S.SessionState, stack: S.Screen[]) {
  useSession.setState({ s: { ...fn(S.freshSession(lang)), screen: stack[stack.length - 1] }, stack });
}
const openF = (s: S.SessionState) =>
  S.openStory({ ...s, pics: ['F'] }, { from: 'pics', sel: 'F', path: MATRIX.F.path });

beforeEach(() => setup());
afterEach(() => jest.useRealTimers());

describe('Welcome cards and Home', () => {
  it('shows the new cards, with the lamp outside the cards so Next never restarts it', async () => {
    setup('en', false);
    renderRouter(routes, { initialUrl: '/onboarding' });
    expect(await screen.findByText(tt('en', 'tour1_body'))).toBeTruthy();
    expect(screen.getByText(tt('en', 'tour1_more'))).toBeTruthy();
    expect(screen.getAllByTestId('living-lamp-pulse', { includeHiddenElements: true })).toHaveLength(1);
    fireEvent.press(screen.getByTestId('tour-next'));
    for (const k of ['tour_s1', 'tour_s2', 'tour_s3', 'tour_s4']) expect(screen.getByText(tt('en', k))).toBeTruthy();
    expect(screen.getAllByTestId('living-lamp-pulse', { includeHiddenElements: true })).toHaveLength(1);
    expect(screen.getByText(tt('en', 'tour4_title'))).toBeTruthy();
    expect(screen.getByText(tt('en', 'tour4_more'))).toBeTruthy();
    // "Help is always here" and "Pictures and Scripture work without the internet" are gone.
    expect(screen.queryByText(/Help is always here|without the internet/)).toBeNull();
  });

  it('Home: one line, the privacy line and Begin, under the same lamp', async () => {
    renderRouter(routes, { initialUrl: '/' });
    expect(await screen.findByText(tt('en', 'home_line'))).toBeTruthy();
    expect(screen.getByText(tt('en', 'w_private'))).toBeTruthy();
    expect(screen.getByTestId('begin')).toBeTruthy();
    expect(screen.getByTestId('living-lamp-pulse', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText(tt('en', 'w_title'))).toBeNull();
  });

  it('new installs start in Dark; the setting still offers all three', () => {
    expect(defaultPrefs().theme).toBe('dark');
    expect(defaultPrefs().textScale).toBe(1);
  });
});

describe('the living lamp keeps one clock', () => {
  it('every lamp reads the same phase at the same moment', () => {
    const now = Date.now();
    expect(lampPhase(PULSE_MS, now)).toBe(lampPhase(PULSE_MS, now));
    expect(lampPhase(PULSE_MS, now + PULSE_MS)).toBeCloseTo(lampPhase(PULSE_MS, now));
  });
  it('pulse swells and settles; breath swells for 40% (Breathe in), settles for 60%', () => {
    expect(swell(0, false)).toBeCloseTo(0);
    expect(swell(0.5, false)).toBeCloseTo(1);
    expect(swell(0, true)).toBeCloseTo(0);
    expect(swell(0.4, true)).toBeCloseTo(1);
    expect(swell(0.999, true)).toBeCloseTo(0, 2);
    expect(BREATH_MS).toBe(10_000);
  });
});

describe('Pictures', () => {
  it('"None of these feel right" opens Psalm 77; Continue shows how many are chosen', async () => {
    startWith('en', (s) => s, ['feel']);
    renderRouter(routes, { initialUrl: '/session/feel' });
    expect(await screen.findByText('Start with what feels familiar.')).toBeTruthy();
    expect(screen.getByText('Choose one or two. It doesn’t have to describe exactly how you feel.')).toBeTruthy();
    fireEvent.press(screen.getByTestId('pic-1'));
    fireEvent.press(screen.getByTestId('pic-2'));
    expect(screen.getByTestId('continue')).toHaveTextContent(/2/);
    fireEvent.press(screen.getByText('None of these feel right'));
    expect(await screen.findByTestId('screen-scripture')).toBeTruthy();
    expect(useSession.getState().s?.path).toBe(NW);
    expect(screen.getByText('Try another place to begin')).toBeTruthy();
    // Let the Scripture card finish choosing its edition before the test ends.
    await waitFor(() => expect(screen.getByTestId('edition-abbr')).toHaveTextContent(/\S/));
  });

  it('Scripture opens with "Here’s one place you might begin." and David’s line for Psalm 142', async () => {
    startWith('en', (s) => S.openStory({ ...s, pics: ['S'] }, { from: 'pics', sel: 'S', path: 'ps142' }), [
      'feel',
      'scripture',
    ]);
    renderRouter(routes, { initialUrl: '/session/scripture' });
    expect(await screen.findByText('Here’s one place you might begin.')).toBeTruthy();
    expect(
      screen.getByText(
        'This may not match everything you’re carrying. David brought something heavy before God too. His prayer can give you a place to start.',
      ),
    ).toBeTruthy();
    await waitFor(() => expect(screen.getByTestId('edition-abbr')).toHaveTextContent(/\S/));
  });
});

describe('Text size', () => {
  it('scales every type variant and stays in range', () => {
    const base = makeType('en', 1)('body');
    const big = makeType('en', 1.5)('body');
    expect(big.fontSize).toBe(Math.round((base.fontSize as number) * 1.5));
    expect(big.lineHeight).toBe(Math.round((base.lineHeight as number) * 1.5));
    expect(clampTextScale(9)).toBe(TEXT_SCALE.max);
    expect(clampTextScale(0.1)).toBe(TEXT_SCALE.min);
    expect(clampTextScale(1.12)).toBe(1.1);
    expect(clampTextScale(NaN)).toBe(1);
  });

  it('Settings: the slider steps, persists, and can be reset', async () => {
    renderRouter(routes, { initialUrl: '/more' });
    expect(await screen.findByTestId('text-size')).toBeTruthy();
    expect(screen.getByTestId('text-size-value')).toHaveTextContent('Default');
    fireEvent.press(screen.getByTestId('text-size-up'));
    fireEvent.press(screen.getByTestId('text-size-up'));
    expect(usePrefs.getState().textScale).toBe(1.1);
    expect(screen.getByTestId('text-size-value')).toHaveTextContent('110%');
    fireEvent(screen.getByTestId('text-size-track'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });
    expect(usePrefs.getState().textScale).toBe(1.15);
    fireEvent.press(screen.getByTestId('text-size-reset'));
    expect(usePrefs.getState().textScale).toBe(1);
    expect(screen.queryByTestId('text-size-reset')).toBeNull();
  });
});

describe('her prayer, line by line', () => {
  it('splits on sentence marks in every language without changing a character', () => {
    const en = 'God, sometimes I look around and no one seems to be there. Be my refuge today. Amen.';
    expect(splitLocal(en)).toEqual([
      'God, sometimes I look around and no one seems to be there.',
      'Be my refuge today.',
      'Amen.',
    ]);
    expect(splitLocal('神啊，求你作我的避难所。阿们。')).toEqual(['神啊，求你作我的避难所。', '阿们。']);
    expect(splitLocal('ဘုရားသခင်၊ ကျွန်ုပ်ကို ကူညီပါ။ အာမင်။')).toEqual(['ဘုရားသခင်၊ ကျွန်ုပ်ကို ကူညီပါ။', 'အာမင်။']);
    expect(splitLocal('يا رب، كن ملجأي اليوم. آمين.')).toEqual(['يا رب، كن ملجأي اليوم.', 'آمين.']);
    const long =
      'God, I miss my family and I cannot reach them tonight or any night this week, and I don’t know who to tell about it.';
    const parts = splitLocal(long);
    expect(parts.length).toBe(2);
    expect(sameText(parts, long)).toBe(true);
    expect(splitLocal('')).toEqual([]);
  });

  it('sameText accepts only her exact words', () => {
    expect(sameText(['God, help me', 'today.'], 'God, help me today.')).toBe(true);
    expect(sameText(['God, help me', 'today'], 'God, help me today.')).toBe(false);
    expect(sameText(['Lord, help me today.'], 'God, help me today.')).toBe(false);
    expect(sameText([], 'God')).toBe(false);
  });

  const deps = (reply: () => Promise<unknown>): RelayDeps => ({
    url: 'https://relay.test',
    installId: 'test',
    fetch: jest.fn(async () => ({ ok: true, json: reply }) as unknown as Response),
  });
  const prayer = 'God, I miss my family and I can’t reach them. Be my refuge today. Amen.';

  it('uses the AI’s line breaks only when the words are unchanged', async () => {
    const good = await breakLines(
      prayer,
      'en',
      deps(async () => ({
        lines: ['God, I miss my family', 'and I can’t reach them.', 'Be my refuge today.', 'Amen.'],
      })),
    );
    expect(good).toEqual({
      source: 'ai',
      lines: ['God, I miss my family', 'and I can’t reach them.', 'Be my refuge today.', 'Amen.'],
    });
    const fixedTypo = await breakLines(
      prayer,
      'en',
      deps(async () => ({ lines: ['God, I miss my family and I cannot reach them.', 'Be my refuge today. Amen.'] })),
    );
    expect(fixedTypo.source).toBe('local');
    expect(sameText(fixedTypo.lines, prayer)).toBe(true);
    const broken = await breakLines(prayer, 'en', {
      ...deps(async () => ({})),
      fetch: jest.fn(async () => {
        throw new Error('offline');
      }),
    });
    expect(broken.source).toBe('local');
    expect((await breakLines(prayer, 'en', null)).source).toBe('local');
  });

  it('gives each line long enough to read slowly', () => {
    expect(lineMs('Amen.')).toBe(3200);
    expect(lineMs('x'.repeat(200))).toBe(7500);
  });

  it('Stay here a moment shows her own prayer one line at a time; Amen lights at the end', async () => {
    jest.useFakeTimers();
    startWith('en', (s) => S.setPrayer(openF(s), 'God, please hold them. Be my refuge today.'), [
      'feel',
      'scripture',
      'pray',
      'after',
      'sit',
    ]);
    renderRouter(routes, { initialUrl: '/session/sit' });
    expect(await screen.findByTestId('screen-sit')).toBeTruthy();
    // Every line is laid out from the start (no jumps), hidden until its turn.
    expect(screen.getByText('God, please hold them.', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByText('Be my refuge today.', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId('breath-cue', { includeHiddenElements: true })).toHaveTextContent(/Breathe (in|out)/);
    const amen = () => screen.getByTestId('sit-amen');
    expect(amen()).toHaveProp('accessibilityState', expect.objectContaining({ selected: false }));
    // Amen works before the end, too: it is never disabled.
    expect(amen()).not.toBeDisabled();
    await act(async () => jest.advanceTimersByTime(1100));
    expect(screen.getByTestId('prayer-line-1', { includeHiddenElements: true })).toHaveProp(
      'accessibilityElementsHidden',
      true,
    );
    await act(async () => jest.advanceTimersByTime(lineMs('God, please hold them.')));
    expect(screen.getByTestId('prayer-line-1', { includeHiddenElements: true })).toHaveProp(
      'accessibilityElementsHidden',
      false,
    );
    expect(amen()).toHaveProp('accessibilityState', expect.objectContaining({ selected: true }));
    expect(screen.queryByTestId('lines-ai')).toBeNull(); // no relay in tests: on-device lines
  });

  it('a prayer with danger words also offers Help', async () => {
    startWith('en', (s) => S.setPrayer(openF(s), 'God, I want to die.'), ['feel', 'scripture', 'pray', 'after', 'sit']);
    renderRouter(routes, { initialUrl: '/session/sit' });
    expect(await screen.findByTestId('sit-help')).toBeTruthy();
  });
});
