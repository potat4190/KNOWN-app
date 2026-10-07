/**
 * The session's mood palette (src/theme/moods.ts) on the screens from Scripture to Done, on the
 * YouVersion reader opened from Scripture, and on the sheets drawn over those screens. Feel,
 * Thinking and Crisis keep the house palette: the theme changes after her choice, not before.
 */
import { useState, type ComponentType, type ReactNode } from 'react';
import { MoodScope } from '@/theme';
import { isMoodKey, type MoodKey } from '@/theme/moods';
import { useSession } from '@/state/session-store';
import { moodFor, type Screen } from '@/state/session';

const MOOD_SCREENS: readonly Screen[] = ['scripture', 'pray', 'after', 'reach', 'sit', 'keep'];

const asMood = (k: unknown): MoodKey | null => (isMoodKey(k) ? k : null);

/**
 * The live session's mood. When the session ends under a screen (Done, or ✕ → end), the screen
 * keeps the mood it had until it goes, so it never flashes the house colours on the way out.
 */
export function useSessionMood(): MoodKey | null {
  const s = useSession((x) => x.s);
  const live = s ? asMood(moodFor(s)) : undefined;
  const [kept, setKept] = useState<MoodKey | null>(live ?? null);
  if (live !== undefined && live !== kept) setKept(live);
  return live === undefined ? kept : live;
}

/** Wraps a screen so it, its header and its actions wear the session's mood. */
export function withSessionMood<P extends object>(Screen: ComponentType<P>) {
  function SessionMoodScreen(props: P) {
    const mood = useSessionMood();
    return (
      <MoodScope mood={mood}>
        <Screen {...props} />
      </MoodScope>
    );
  }
  SessionMoodScreen.displayName = `withSessionMood(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return SessionMoodScreen;
}

/**
 * The mood of the session screen showing right now (Scripture to Done), else null. Unlike
 * useSessionMood it doesn't linger: Home after Done is the house palette again.
 */
export function useShownMood(): MoodKey | null {
  const s = useSession((x) => x.s);
  return s && MOOD_SCREENS.includes(s.screen) ? asMood(moodFor(s)) : null;
}

/** Sheets (✕, "Try another place to begin") match the session screen they open over. */
export function SheetMood({ children }: { children: ReactNode }) {
  const mood = useSessionMood();
  const screen = useSession((x) => x.s?.screen ?? null);
  return <MoodScope mood={screen && MOOD_SCREENS.includes(screen) ? mood : null}>{children}</MoodScope>;
}
