/**
 * The live session (Zustand) around the pure reducer in ./session.ts, plus
 * the side effects: rotation draw, saving a Moment once, pause / recover /
 * the 3-day cleanup. Nothing here autosaves: a session is written to the DB
 * only when she taps "Save this step for later".
 */
import { create } from 'zustand';
import { getStore } from '@/data/store';
import { PAUSE_TTL_MS } from '@/config/privacy';
import { MATRIX, ROTATION, selKey, type PathKey, type SelKey } from '@/lib/content';
import { draw, type Rng } from '@/services/rotation/rotation';
import { now } from './clock';
import { usePrefs } from './prefs';
import * as S from './session';
import type { Lang } from '@/i18n/langs';
import type { Moment, PausedSession } from '@/data/types';

type SessionStore = {
  s: S.SessionState | null;
  /** The session screens she has open, oldest first (restored on Continue). */
  stack: S.Screen[];
  /** Apply a pure update to the session. */
  update: (fn: (s: S.SessionState) => S.SessionState) => void;
  start: (lang: Lang, guided?: boolean) => void;
  end: () => void;
  focus: (screen: S.Screen) => void;
};

export const useSession = create<SessionStore>((set, get) => ({
  s: null,
  stack: [],
  update: (fn) => {
    const s = get().s;
    if (s) set({ s: fn(s) });
  },
  start: (lang, guided = false) => set({ s: S.freshSession(lang, guided), stack: ['feel'] }),
  end: () => set({ s: null, stack: [] }),
  focus: (screen) => {
    const { s, stack } = get();
    if (!s) return;
    const i = stack.indexOf(screen);
    set({ s: { ...s, screen }, stack: i >= 0 ? stack.slice(0, i + 1) : [...stack, screen] });
  },
}));

export const session = () => useSession.getState().s;

/* ------------------------------ Rotation ------------------------------ */

let rng: Rng = Math.random;
export const setRotationRng = (r: Rng) => (rng = r);

/**
 * Picks the story for a picture selection (8.2) and advances the rotation.
 * Called only when the story actually opens (Continue on Feel).
 */
export async function openPictures(): Promise<PathKey | null> {
  const s = session();
  if (!s || !s.pics.length) return null;
  const sel = selKey(s.pics) as SelKey;
  const store = getStore();
  const all = await store.rotation.getAll();
  const { path, entry } = draw(all[sel], MATRIX[sel].path, ROTATION[sel] ?? [MATRIX[sel].path], rng);
  await store.rotation.put(sel, entry);
  useSession.getState().update((x) => S.openStory(x, { from: 'pics', sel, path: path as PathKey }));
  return path as PathKey;
}

/* ------------------------------ Keep ------------------------------ */

const newId = () => 'm' + now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Saves the Moment once. A second call (Back from Done, re-entering Keep) does nothing. */
export async function saveMoment(lang: Lang, msgText: string): Promise<Moment | null> {
  const s = session();
  if (!s || !S.canSave(s)) return null;
  const scripture = s.scripture ?? { source: 'bundled' as const, versionId: null, abbr: '' };
  const m = S.buildMoment(s, { id: newId(), now: now(), lang, msgText, scripture });
  await getStore().moments.add(m);
  await getStore().session.clear();
  useSession.getState().update((x) => ({ ...x, savedMomentId: m.id }));
  return m;
}

/* -------------------------- Pause and recover -------------------------- */

/** "Save this step for later": the only way a session is ever written down. */
export async function pauseSession() {
  const { s, stack } = useSession.getState();
  if (!s) return;
  await getStore().session.set({ ts: now(), state: s, hist: stack });
  useSession.getState().end();
}

/** Deletes a paused session older than 3 days. Returns true if one was removed. */
export async function cleanupPaused(): Promise<boolean> {
  const store = getStore();
  const p = await store.session.get();
  if (p && now() - p.ts >= PAUSE_TTL_MS) {
    await store.session.clear();
    usePrefs.getState().set({ removedNotice: true });
    return true;
  }
  return false;
}

export async function loadPaused(): Promise<PausedSession<S.SessionState> | null> {
  await cleanupPaused();
  return (await getStore().session.get()) as PausedSession<S.SessionState> | null;
}

/** Days left before the paused moment is removed (≥ 1). */
export const daysLeft = (ts: number) => Math.max(1, Math.ceil((PAUSE_TTL_MS - (now() - ts)) / 86_400_000));

/** Continue: restore the full state and step, then delete the stored copy. Never restarts its clock. */
export async function resumePaused(): Promise<S.Screen[] | null> {
  const p = await loadPaused();
  if (!p) return null;
  await getStore().session.clear();
  const stack = (p.hist?.length ? p.hist : ['feel']) as S.Screen[];
  useSession.setState({ s: { ...p.state, screen: stack[stack.length - 1] }, stack });
  return stack;
}

/** Start a new one: deletes the paused moment. */
export async function discardPaused() {
  await getStore().session.clear();
}

/* ---------------------------- Delete everything ---------------------------- */

export async function deleteEverything() {
  await getStore().wipe();
  useSession.getState().end();
  usePrefs.getState().resetKeepLanguage();
}
