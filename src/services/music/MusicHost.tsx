/**
 * Plays music "when she pauses to pray or reflect": on Pray and Sit (and
 * Scripture only if configured). Stops when leaving those screens, when the
 * app goes to the background, on Help and Crisis (which never call useMusic),
 * and during the onboarding cards. Respects her on/off choice.
 */
import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { create } from 'zustand';
import { usePrefs } from '@/state/prefs';
import { useSession } from '@/state/session-store';
import type { MusicMoment } from '@/config/music';
import { music } from './MusicController';
import { resolveTrack } from './resolve';

const useMusicTarget = create<{ moment: MusicMoment | null; set: (m: MusicMoment | null) => void }>((set) => ({
  moment: null,
  set: (moment) => set({ moment }),
}));

export function MusicHost() {
  const moment = useMusicTarget((m) => m.moment);
  const on = usePrefs((p) => p.musicOn);
  const path = useSession((x) => x.s?.path ?? null);
  const sel = useSession((x) => x.s?.sel ?? null);

  useEffect(() => {
    const track = moment ? resolveTrack(moment, { path, sel }) : null;
    if (on && track != null && AppState.currentState === 'active') void music.play(track);
    else music.stop();
  }, [moment, on, path, sel]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') music.stop();
      else {
        const m = useMusicTarget.getState().moment;
        const x = useSession.getState().s;
        const track = m ? resolveTrack(m, { path: x?.path, sel: x?.sel }) : null;
        if (track != null && usePrefs.getState().musicOn) void music.play(track);
      }
    });
    return () => {
      sub.remove();
      music.release();
    };
  }, []);
  return null;
}

/** A screen that may have music. Returns whether a track is configured for it (to show the speaker button). */
export function useMusic(moment: MusicMoment): boolean {
  const set = useMusicTarget((m) => m.set);
  const path = useSession((x) => x.s?.path ?? null);
  const sel = useSession((x) => x.s?.sel ?? null);
  useFocusEffect(
    useCallback(() => {
      set(moment);
      return () => {
        if (useMusicTarget.getState().moment === moment) set(null);
      };
    }, [moment, set]),
  );
  return resolveTrack(moment, { path, sel }) != null;
}
