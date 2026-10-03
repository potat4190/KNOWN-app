/** Navigation helpers for the session flow. */
import { useCallback, useEffect } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { usePrefs } from './prefs';
import { useSession } from './session-store';
import type { Screen, SessionState } from './session';

export const sessionHref = (s: Screen) => `/session/${s}` as const;

export function goSession(screen: Screen) {
  router.push(sessionHref(screen));
}
export function replaceSession(screen: Screen) {
  router.replace(sessionHref(screen));
}

/** Begin a new moment: straight to Feel (tap 1 of 3 to Scripture). */
export function beginSession(guided = false) {
  const lang = usePrefs.getState().lang ?? 'en';
  useSession.getState().start(lang, guided);
  router.push(guided ? '/session/guided' : '/session/feel');
}

/** Leave the session for a non-session screen, clearing the session stack. */
export function leaveTo(href: '/' | '/done' | '/paused' | '/moments') {
  router.dismissAll?.();
  router.replace(href);
}

/** Rebuild the navigation stack for a restored session. */
export function restoreStack(stack: Screen[]) {
  const [first, ...rest] = stack;
  router.push(sessionHref(first ?? 'feel'));
  for (const s of rest) router.push(sessionHref(s));
}

/**
 * For every session screen: records the screen (step dots, pause), and sends
 * her home if there is no session (e.g. after Delete everything).
 */
export function useSessionScreen(screen: Screen): SessionState | null {
  const s = useSession((x) => x.s);
  const focus = useSession((x) => x.focus);
  useFocusEffect(
    useCallback(() => {
      focus(screen);
    }, [focus, screen]),
  );
  useEffect(() => {
    if (!s) {
      const id = setTimeout(() => {
        if (!useSession.getState().s) router.replace('/');
      }, 0);
      return () => clearTimeout(id);
    }
  }, [s]);
  return s;
}
