/**
 * Stay here a moment (Oct 6 redesign). Her own prayer, exactly as she left it on Pray,
 * appears one line at a time over the lamp-lit room. The lamp breathes: it swells for
 * "Breathe in" (4 s) and settles for "Breathe out" (6 s), with a small cue under it.
 * Amen works at any moment and lights up once the last line has appeared.
 *
 * Line breaks: the relay's /lines when a relay is configured (AI chooses only where the
 * lines break; the app accepts it only if the lines are exactly her words), otherwise
 * the on-device split. Nothing is saved here. No tips here.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, {
  FadeIn,
  FadeOut,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Heading, Lead } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { Icon } from '@/components/Icon';
import { LampRoom, LivingLamp, lampPhase } from '@/components/LivingLamp';
import { BREATH_IN_MS, BREATH_MS } from '@/components/Lamp';
import { SpeakerButton } from '@/components/SpeakerButton';
import { useT } from '@/i18n';
import type { Lang } from '@/i18n/langs';
import { useTheme } from '@/theme';
import { useSessionScreen } from '@/state/nav';
import { useUi } from '@/state/ui';
import * as S from '@/state/session';
import { useMusic } from '@/services/music/MusicHost';
import { relayAvailable, relayDeps } from '@/services/matcher/deps';
import { isCrisis } from '@/services/matcher/matcher';
import { LINES_WAIT_MS, breakLines, lineMs, splitLocal, type PrayerLines } from '@/services/prayer/lines';
import { withSessionMood } from '@/features/mood/SessionMood';

const IN = BREATH_IN_MS / BREATH_MS;

/** "in" or "out", on the lamp's shared clock, so the cue always matches the glow. */
function useBreathCue(): 'in' | 'out' {
  const [phase, setPhase] = useState<'in' | 'out'>(() => (lampPhase(BREATH_MS) < IN ? 'in' : 'out'));
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const p = lampPhase(BREATH_MS);
      const inNow = p < IN;
      setPhase(inNow ? 'in' : 'out');
      timer = setTimeout(tick, (inNow ? IN - p : 1 - p) * BREATH_MS + 30);
    };
    tick();
    return () => clearTimeout(timer);
  }, []);
  return phase;
}

/** Her prayer split into lines: AI line breaks (verified) if they come within LINES_WAIT_MS, else on-device. */
function usePrayerLines(text: string, lang: Lang): PrayerLines | null {
  const local = useMemo<PrayerLines>(() => ({ lines: splitLocal(text), source: 'local' }), [text]);
  const wantsAi = relayAvailable() && !!text.trim();
  const reqKey = `${lang}\n${text}`;
  const [got, setGot] = useState<{ key: string; res: PrayerLines } | null>(null);
  useEffect(() => {
    if (!wantsAi) return;
    let alive = true;
    // First answer wins: the AI's lines if they arrive in time, else the on-device lines.
    const settle = (res: PrayerLines) => {
      if (alive) setGot((g) => (g?.key === reqKey ? g : { key: reqKey, res }));
    };
    const fallback = setTimeout(() => settle(local), LINES_WAIT_MS);
    void breakLines(text, lang, relayDeps()).then(settle);
    return () => {
      alive = false;
      clearTimeout(fallback);
    };
  }, [wantsAi, reqKey, text, lang, local]);
  if (!wantsAi) return local;
  return got?.key === reqKey ? got.res : null;
}

function Line({ text, state, testID }: { text: string; state: 'hidden' | 'past' | 'current'; testID: string }) {
  const { reduceMotion } = useTheme();
  const opacity = useSharedValue(0);
  const y = useSharedValue(reduceMotion ? 0 : 10);
  useEffect(() => {
    // A fade is not motion: lines still fade in under Reduce Motion; only the rise is dropped.
    opacity.value = withTiming(state === 'hidden' ? 0 : state === 'past' ? 0.55 : 1, {
      duration: 1100,
      reduceMotion: ReduceMotion.Never,
    });
    y.value = withTiming(state === 'hidden' && !reduceMotion ? 10 : 0, { duration: 1100 });
  }, [state, reduceMotion, opacity, y]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: y.value }] }));
  const hidden = state === 'hidden';
  return (
    <Animated.View
      style={style}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      testID={testID}
    >
      <Txt v="scripture" face="reading" center>
        {text}
      </Txt>
    </Animated.View>
  );
}

function Sit() {
  const s = useSessionScreen('sit');
  const { t, lang } = useT();
  const { c, textScale } = useTheme();
  const hasTrack = useMusic('sit');
  const cue = useBreathCue();
  const prayer = s && s.path ? S.currentPrayer(s, lang) : '';
  const res = usePrayerLines(prayer, lang);
  const quiet = t('breath_note');
  const lines = useMemo(() => (res ? (res.lines.length ? res.lines : [quiet]) : null), [res, quiet]);
  // How many lines are showing, for this exact set of lines (a new set starts from the beginning).
  const key = lines ? lines.join('\n') : '';
  const [progress, setProgress] = useState({ key: '', n: 0 });
  const shown = progress.key === key ? progress.n : 0;
  const [focused, setFocused] = useState(true);
  const done = !!lines && shown >= lines.length;

  // Pause while Help (or anything else) is on top; carry on where she was when she returns.
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    if (!lines || !focused || shown >= lines.length) return;
    const id = setTimeout(
      () => setProgress((p) => ({ key, n: (p.key === key ? p.n : 0) + 1 })),
      shown === 0 ? 1100 : lineMs(lines[shown - 1]),
    );
    return () => clearTimeout(id);
  }, [lines, key, shown, focused]);

  useEffect(() => {
    if (lines && shown > 0) useUi.getState().say(lines[shown - 1]);
  }, [lines, shown]);

  if (!s || !s.path) return null;

  return (
    <Screen
      header={<Header inSession step={4} onBack={() => router.back()} />}
      testID="screen-sit"
      backdrop={<LampRoom />}
      bareActions
      actions={
        <>
          <Button
            kind={done ? 'lamp' : 'soft'}
            label={t('amen')}
            onPress={() => router.back()}
            accessibilityState={{ selected: done }}
            testID="sit-amen"
          />
          <View
            style={{ opacity: done ? 1 : 0 }}
            pointerEvents={done ? 'auto' : 'none'}
            accessibilityElementsHidden={!done}
            importantForAccessibility={done ? 'auto' : 'no-hide-descendants'}
          >
            <Button
              kind="quiet"
              label={t('sit_read_again')}
              onPress={() => setProgress({ key, n: 0 })}
              testID="sit-again"
            />
          </View>
        </>
      }
    >
      <SpeakerButton visible={hasTrack} />
      <View style={{ gap: 8 }}>
        <Heading>{t('sit_title')}</Heading>
        <Lead>{t('sit_breathe')}</Lead>
      </View>
      {isCrisis(prayer) ? (
        <Button kind="plain" label={t('help_title')} onPress={() => router.push('/help')} testID="sit-help" />
      ) : null}
      <View style={{ height: 150, alignItems: 'center', justifyContent: 'center' }}>
        <LivingLamp mode="breath" size={300} style={{ position: 'absolute' }} />
        <View
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 22, alignItems: 'center' }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          testID="breath-cue"
        >
          <Animated.View key={cue} entering={FadeIn.duration(700)} exiting={FadeOut.duration(400)}>
            <Txt
              v="footnote"
              weight="bold"
              color={c.lampInk}
              center
              style={
                lang === 'en'
                  ? { letterSpacing: 2, textTransform: 'uppercase', fontSize: Math.round(12 * textScale) }
                  : undefined
              }
            >
              {t(cue === 'in' ? 'br_in' : 'br_out')}
            </Txt>
          </Animated.View>
        </View>
      </View>
      <View style={{ gap: 14 }} testID="prayer-lines">
        {(lines ?? []).map((line, i) => (
          <Line
            key={`${i}:${line}`}
            text={line}
            testID={`prayer-line-${i}`}
            state={i >= shown ? 'hidden' : done || i === shown - 1 ? 'current' : 'past'}
          />
        ))}
      </View>
      {res?.source === 'ai' ? (
        <View
          style={{ flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center' }}
          testID="lines-ai"
        >
          <Icon name="spark" size={14} color={c.lampInk} />
          <Txt v="footnote" muted>
            {t('lines_ai')}
          </Txt>
        </View>
      ) : null}
    </Screen>
  );
}

export default withSessionMood(Sit);
