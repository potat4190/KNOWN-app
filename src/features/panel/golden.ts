/**
 * The judge panel's golden path (8 one-tap demo states) and screen jumps,
 * ported from the Design Lab's GOLDEN / JUMPS / demoBase().
 */
import { router } from 'expo-router';
import panelJson from '@/content/panel.json';
import { MATRIX, NW, type PathKey, type SelKey } from '@/lib/content';
import { useSession } from '@/state/session-store';
import { usePrefs } from '@/state/prefs';
import { useUi } from '@/state/ui';
import { restoreStack } from '@/state/nav';
import { setLastSaved } from '@/state/done';
import * as S from '@/state/session';

export const DEMO_WORDS: string = panelJson.demoWords;
export const DEMO_REASON: string = panelJson.demoReason;
export const EMO = panelJson.emo as Record<string, string>;

const lang = () => usePrefs.getState().lang ?? 'en';

function demoBase(): S.SessionState {
  const s = S.freshSession(lang());
  return {
    ...S.openStory(
      { ...s, words: DEMO_WORDS, mode: 'words' },
      {
        from: 'words',
        sel: null,
        path: 'neh',
        ai: {
          key: 'neh',
          confidence: 0.9,
          reason: lang() === 'en' ? DEMO_REASON : '',
          feelings: ['fear'],
          risk: false,
          source: 'demo',
        },
      },
    ),
  };
}

function go(state: S.SessionState | null, stack: S.Screen[], root?: '/' | '/done') {
  useUi.getState().closeSheet();
  router.dismissAll?.();
  router.replace('/');
  if (!state) {
    useSession.getState().end();
    if (root === '/done') router.push('/done');
    return;
  }
  useSession.setState({ s: { ...state, screen: stack[stack.length - 1] }, stack });
  setTimeout(() => restoreStack(stack), 50);
}

export const GOLDEN: [string, string, () => void][] = [
  ['1', 'Welcome', () => go(null, [])],
  ['2', 'Pictures', () => go(S.freshSession(lang()), ['feel'])],
  ['3', 'Types in own words', () => go({ ...S.freshSession(lang()), mode: 'words', words: DEMO_WORDS }, ['feel'])],
  ['4', 'Nehemiah 1', () => go(demoBase(), ['feel', 'scripture'])],
  ['5', 'Prayer', () => go({ ...demoBase(), stay: 0 }, ['feel', 'scripture', 'pray'])],
  ['6', 'Before you go', () => go({ ...demoBase(), stay: 0 }, ['feel', 'scripture', 'pray', 'after'])],
  ['7', 'Reach out', () => go({ ...demoBase(), stay: 0 }, ['feel', 'scripture', 'pray', 'after', 'reach'])],
  [
    '8',
    'Kept',
    () => {
      setLastSaved(true);
      go(null, [], '/done');
    },
  ],
];

/** Open the Scripture screen for a matrix selection (or no words). */
export function openSelection(sel: SelKey | 'NW') {
  const base = S.freshSession(lang());
  const s =
    sel === 'NW'
      ? S.openNoWords(base)
      : S.openStory(
          { ...base, pics: sel.split('') as S.SessionState['pics'] },
          { from: 'pics', sel, path: MATRIX[sel].path },
        );
  go(s, ['feel', 'scripture']);
}

export const JUMPS = [
  'language',
  'welcome',
  'feel',
  'thinking',
  'crisis',
  'scripture',
  'pray',
  'after',
  'reach',
  'sit',
  'keep',
  'done',
  'moments',
  'help',
  'paused',
] as const;

export function jump(sc: (typeof JUMPS)[number]) {
  if (sc === 'language') return void router.push('/language');
  if (sc === 'welcome') return go(null, []);
  if (sc === 'done' || sc === 'paused' || sc === 'moments' || sc === 'help') {
    useUi.getState().closeSheet();
    router.dismissAll?.();
    return void router.push(sc === 'moments' ? '/moments' : `/${sc}`);
  }
  const cur = useSession.getState().s;
  let s = cur ?? S.freshSession(lang());
  if (sc === 'thinking' && !s.words) s = { ...s, mode: 'words', words: DEMO_WORDS };
  if (['scripture', 'pray', 'after', 'reach', 'sit', 'keep', 'crisis'].includes(sc) && !s.path)
    s = S.openStory({ ...s, pics: ['F'] }, { from: 'pics', sel: 'F', path: 'neh' as PathKey });
  const stack: S.Screen[] = sc === 'feel' ? ['feel'] : ['feel', sc as S.Screen];
  go(s, stack);
}

export const NW_KEY = NW;
