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
import { AccessibilityInfo, findNodeHandle, useWindowDimensions, View } from 'react-native';
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
import { measureTarget, type Rect } from './targets';

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

type Ctx = { show: (ids: string[]) => void; clear: () => void };
const TourCtx = createContext<Ctx>({ show: () => {}, clear: () => {} });

/** Settings → Show me around again: cards and tips come back. */
export function resetTour() {
  prefs().set({ tourDone: false, tipsSeen: {}, tipsOn: true });
}

/** Should tips show right now? */
export function tipsEnabled(): boolean {
  const p = prefs();
  const guided = !!useSession.getState().s?.guided;
  return p.tourDone && (p.tipsOn || guided) && !useUi.getState().sheet;
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<string[]>([]);
  const [measured, setMeasured] = useState<{ id: string; rect: Rect } | null>(null);
  const current = queue[0] ?? null;
  const sheet = useUi((u) => u.sheet);
  const rect = measured && measured.id === current ? measured.rect : null;

  const show = useCallback((ids: string[]) => {
    const seen = prefs().tipsSeen;
    setQueue(ids.filter((id) => !seen[id]).slice(0, 2));
  }, []);
  const clear = useCallback(() => setQueue([]), []);

  useEffect(() => {
    let alive = true;
    if (!current) return;
    void measureTarget(current).then((r) => {
      if (!alive) return;
      if (!r)
        setQueue((q) => q.slice(1)); // target not on screen: skip it
      else setMeasured({ id: current, rect: r });
    });
    return () => {
      alive = false;
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
      {current && rect && !sheet ? <Coach id={current} rect={rect} onGotIt={gotIt} onSkip={skipAll} /> : null}
    </TourCtx.Provider>
  );
}

function Coach({ id, rect, onGotIt, onSkip }: { id: string; rect: Rect; onGotIt: () => void; onSkip: () => void }) {
  const { c, radius, reduceMotion } = useTheme();
  const { t } = useT();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bubble = useRef<View>(null);
  const top = insets.top + HEADER_H;
  const bottom = height - insets.bottom - ACTIONS_RESERVE;
  const pad = 6;
  const r = { x: rect.x - pad, y: rect.y - pad, w: rect.width + pad * 2, h: rect.height + pad * 2 };
  const below = r.y + r.h + 180 < bottom;
  const bubbleTop = below ? Math.min(r.y + r.h + 10, bottom - 170) : Math.max(top + 8, r.y - 180);

  useEffect(() => {
    const msg = t(TIPS[id]);
    AccessibilityInfo.announceForAccessibility(msg);
    const timer = setTimeout(() => {
      const node = bubble.current && findNodeHandle(bubble.current);
      if (node) AccessibilityInfo.setAccessibilityFocus(node);
    }, 250);
    return () => clearTimeout(timer);
  }, [id, t]);

  const scrim = { position: 'absolute' as const, backgroundColor: c.scrim };
  const cy = Math.max(top, Math.min(r.y, bottom));
  const cb = Math.max(top, Math.min(r.y + r.h, bottom));
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
