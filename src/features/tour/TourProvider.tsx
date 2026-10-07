/**
 * Contextual tips (coach marks, brief 8.4): the first time a screen appears,
 * at most 2 tips. Each tip: a lamp ring around the target, a soft scrim with a
 * cut-out, and a bubble with "Got it" / "Skip tips". The scrim never takes
 * touches and never covers the header (Help pill) or the bottom actions
 * (primary button). Focus moves to the bubble and it is announced; dismissal
 * is by button only. Mirrored in RTL by logical layout. No animation under
 * Reduce Motion.
 *
 * Never shown on Language, Crisis, Help, Thinking, Sit, the Recover sheet, or
 * while any sheet is open (those screens simply don't call useTips).
 */
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, useWindowDimensions, View } from 'react-native';
import { focusForAccessibility } from '@/lib/a11y-focus';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTheme } from '@/theme';
import { useT } from '@/i18n';
import { usePrefs, prefs } from '@/state/prefs';
import { useUi } from '@/state/ui';
import { useSession } from '@/state/session-store';
import { Txt } from '@/components/Txt';
import { Button } from '@/components/Button';
import { useFrameWidth } from '@/components/AppFrame';
import { isFixedTarget, measureTarget, type Rect } from './targets';
import { SheetMood } from '@/features/mood/SessionMood';

/** Tip id → its drafted text key. */
export const TIPS: Record<string, string> = {
  feel_tabs: 'tip_feel_tabs',
  feel_nowords: 'tip_feel_nowords',
  scripture_full: 'tip_scripture_full',
  scripture_nofit: 'tip_scripture_nofit',
  pray_line: 'tip_pray_line',
  pray_edit: 'tip_pray_edit',
  after_tiles: 'tip_after',
  header_x: 'tip_header_x',
  moments_row: 'tip_moments',
};

const HEADER_H = 56;
const ACTIONS_RESERVE = 150;
/** The sticky actions bar registers under this id (src/components/Screen.tsx). */
export const ACTIONS_TARGET = '__actions';

type Ctx = { show: (ids: string[]) => void; clear: () => void };
const TourCtx = createContext<Ctx>({ show: () => {}, clear: () => {} });

/** Settings → Show me around again: cards and tips come back. */
export function resetTour() {
  prefs().set({ tourDone: false, tipsSeen: {}, tipsOn: true });
}

/**
 * A tip for a content target is drawn only when the target is wholly inside the visible
 * content area, below the header and above the actions bar; otherwise (e.g. below the fold)
 * its ring would land on whatever is there, such as the primary button. Targets in the header
 * or the actions bar are `fixed` (always on screen). `y` values are relative to the overlay.
 */
export function targetOnScreen(rect: Rect, originY: number, top: number, bottom: number): boolean {
  const y = rect.y - originY;
  return y >= top && y + rect.height <= bottom;
}

/** Leaving a screen: the tips she was shown count as seen, whether or not she tapped "Got it". */
export function withShownSeen(seen: Record<string, true>, shown: Iterable<string>): Record<string, true> {
  const next = { ...seen };
  for (const id of shown) next[id] = true;
  return next;
}

/** Should tips show right now? */
export function tipsEnabled(): boolean {
  const p = prefs();
  const guided = !!useSession.getState().s?.guided;
  return p.tourDone && (p.tipsOn || guided) && !useUi.getState().sheet;
}

const sameRect = (a: Rect, b: Rect) =>
  Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1;

export function TourProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<string[]>([]);
  const [measured, setMeasured] = useState<{ id: string; rect: Rect } | null>(null);
  const current = queue[0] ?? null;
  const sheet = useUi((u) => u.sheet);
  const rect = measured && measured.id === current ? measured.rect : null;
  // Tips drawn on the current screen. They never come back once she leaves it, so a tip
  // never has to be tapped away to stop it returning (6 "Got it" taps before After).
  const shown = useRef(new Set<string>());

  const show = useCallback((ids: string[]) => {
    const seen = prefs().tipsSeen;
    setQueue(ids.filter((id) => !seen[id]).slice(0, 2));
  }, []);
  const clear = useCallback(() => {
    if (shown.current.size) {
      prefs().set({ tipsSeen: withShownSeen(prefs().tipsSeen, shown.current) });
      shown.current.clear();
    }
    setQueue([]);
  }, []);
  const onShown = useCallback((id: string) => {
    shown.current.add(id);
  }, []);
  // Target not visible right now: skip it without marking it seen (it can show next visit).
  const skipOne = useCallback(() => setQueue((q) => q.slice(1)), []);

  useEffect(() => {
    let alive = true;
    if (!current) return;
    const measure = () =>
      void measureTarget(current).then((r) => {
        if (!alive) return;
        if (!r)
          setQueue((q) => q.slice(1)); // target not on screen: skip it
        else setMeasured((m) => (m && m.id === current && sameRect(m.rect, r) ? m : { id: current, rect: r }));
      });
    measure();
    // Keep the ring on its target while the tip shows: content above it can still grow after the
    // first measure (the YouVersion text loads after the Scripture screen appears).
    const timer = setInterval(measure, 400);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [current]);

  const gotIt = () => {
    if (!current) return;
    prefs().set({ tipsSeen: { ...prefs().tipsSeen, [current]: true } });
    setQueue((q) => q.slice(1));
  };
  const skipAll = () => {
    const seen = { ...prefs().tipsSeen };
    for (const id of Object.keys(TIPS)) seen[id] = true;
    prefs().set({ tipsSeen: seen, tipsOn: false });
    setQueue([]);
  };

  return (
    <TourCtx.Provider value={{ show, clear }}>
      {children}
      {current && rect && !sheet ? (
        // A tip over a Scripture-to-Keep screen wears that screen's mood.
        <SheetMood>
          <Coach
            key={current}
            id={current}
            rect={rect}
            onGotIt={gotIt}
            onSkip={skipAll}
            onShown={onShown}
            onOffscreen={skipOne}
          />
        </SheetMood>
      ) : null}
    </TourCtx.Provider>
  );
}

function Coach({
  id,
  rect,
  onGotIt,
  onSkip,
  onShown,
  onOffscreen,
}: {
  id: string;
  rect: Rect;
  onGotIt: () => void;
  onSkip: () => void;
  onShown: (id: string) => void;
  onOffscreen: () => void;
}) {
  const { c, radius, reduceMotion } = useTheme();
  const { t } = useT();
  const { height } = useWindowDimensions();
  // The bubble spans the app's width: the screen on phones, the column in a wide browser window.
  const width = useFrameWidth();
  const insets = useSafeAreaInsets();
  const bubble = useRef<View>(null);
  const root = useRef<View>(null);
  // The overlay's own window origin: targets and overlay are measured in the same frame,
  // so the ring lands on the target even with Android edge-to-edge status-bar offsets.
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  // The real top of the screen's sticky actions bar (primary button), when the screen has one.
  // undefined = not measured yet; null = the screen has no actions bar.
  const [actionsTop, setActionsTop] = useState<number | null | undefined>(undefined);
  const [bubbleH, setBubbleH] = useState(170);
  useEffect(() => {
    void measureTarget(ACTIONS_TARGET).then((a) => setActionsTop(a ? a.y : null));
  }, [id]);
  const ox = origin?.x ?? 0;
  const oy = origin?.y ?? 0;
  const top = insets.top + HEADER_H;
  // Never cover the primary button: everything stays above the actions bar.
  const bottom = actionsTop != null ? actionsTop - oy : height - insets.bottom - ACTIONS_RESERVE;
  const pad = 6;
  const r = { x: rect.x - ox - pad, y: rect.y - oy - pad, w: rect.width + pad * 2, h: rect.height + pad * 2 };
  const below = r.y + r.h + 10 + bubbleH <= bottom - 8;
  const bubbleTop = below ? r.y + r.h + 10 : Math.max(top + 8, Math.min(r.y, bottom) - 10 - bubbleH);
  const ready = origin != null && actionsTop !== undefined;
  // Header and actions-bar targets are always on screen; content targets only while in view.
  const onScreen = ready && (isFixedTarget(id) || targetOnScreen(rect, oy, top, bottom));

  useEffect(() => {
    if (!ready) return;
    if (onScreen) onShown(id);
    else onOffscreen();
  }, [ready, onScreen, id, onShown, onOffscreen]);

  useEffect(() => {
    if (!onScreen) return;
    const msg = t(TIPS[id]);
    AccessibilityInfo.announceForAccessibility(msg);
    const timer = setTimeout(() => {
      focusForAccessibility(bubble);
    }, 250);
    return () => clearTimeout(timer);
  }, [id, t, onScreen]);

  const scrim = { position: 'absolute' as const, backgroundColor: c.scrim };
  const cy = Math.max(top, Math.min(r.y, bottom));
  const cb = Math.max(top, Math.min(r.y + r.h, bottom));
  if (!origin)
    return (
      <View
        ref={root}
        style={{ position: 'absolute', inset: 0 }}
        pointerEvents="none"
        onLayout={() => root.current?.measureInWindow((x, y) => setOrigin({ x, y }))}
      />
    );
  if (!onScreen) return null;
  return (
    <View style={{ position: 'absolute', inset: 0 }} pointerEvents="box-none">
      {/* Scrim with a cut-out, limited to the content area. */}
      <View pointerEvents="none" style={[scrim, { top, height: Math.max(0, cy - top), left: 0, right: 0 }]} />
      <View pointerEvents="none" style={[scrim, { top: cb, height: Math.max(0, bottom - cb), left: 0, right: 0 }]} />
      <View pointerEvents="none" style={[scrim, { top: cy, height: cb - cy, left: 0, width: Math.max(0, r.x) }]} />
      <View pointerEvents="none" style={[scrim, { top: cy, height: cb - cy, left: r.x + r.w, right: 0 }]} />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: r.x,
          top: r.y,
          width: r.w,
          height: r.h,
          borderRadius: radius.card,
          borderWidth: 3,
          borderColor: c.lamp,
        }}
      />
      <Animated.View
        entering={reduceMotion ? undefined : FadeIn.duration(250)}
        style={{ position: 'absolute', top: bubbleTop, left: 16, width: width - 32 }}
      >
        <View
          ref={bubble}
          onLayout={(e) => setBubbleH(Math.ceil(e.nativeEvent.layout.height))}
          accessible={false}
          accessibilityViewIsModal={false}
          style={{
            backgroundColor: c.elevated,
            borderRadius: radius.card,
            padding: 16,
            gap: 10,
            borderWidth: 1,
            borderColor: c.lamp,
          }}
          testID={`tip-${id}`}
        >
          <Txt v="body" accessibilityRole="text">
            {t(TIPS[id])}
          </Txt>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Button kind="quiet" label={t('tip_skip_all')} onPress={onSkip} testID="tip-skip" />
            <Button
              kind="primary"
              small
              label={t('tip_got_it')}
              onPress={onGotIt}
              style={{ alignSelf: 'auto', minWidth: 110 }}
              testID="tip-got-it"
            />
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

/** Screens call this with their tip ids (max 2). Shown once, after the screen settles. */
export function useTips(screen: string, ids: string[]) {
  const { show, clear } = useContext(TourCtx);
  const tipsOn = usePrefs((p) => p.tipsOn);
  const key = ids.join(',');
  useFocusEffect(
    useCallback(() => {
      if (!key) return;
      const timer = setTimeout(() => {
        if (tipsEnabled()) show(key.split(','));
      }, 700);
      return () => {
        clearTimeout(timer);
        clear();
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen, key, tipsOn]),
  );
}
