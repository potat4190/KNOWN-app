/**
 * Sit a little longer: a breathing lamp over the dimmed scene, with the
 * breath-prayer pair ("Breathe in" + line 1, "Breathe out" + line 2)
 * cross-fading with the 10-second cycle. Under Reduce Motion both lines show
 * and nothing moves. No tips here.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Heading, Lead } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { Lamp, BREATH_IN_MS, BREATH_MS } from '@/components/Lamp';
import { SpeakerButton } from '@/components/SpeakerButton';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { BREATH, sceneOf } from '@/lib/content';
import { useSessionScreen } from '@/state/nav';
import { useMusic } from '@/services/music/MusicHost';

function useBreathPhase(active: boolean) {
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  useEffect(() => {
    if (!active) return;
    let t: ReturnType<typeof setTimeout>;
    const loop = (p: 'in' | 'out') => {
      setPhase(p);
      t = setTimeout(() => loop(p === 'in' ? 'out' : 'in'), p === 'in' ? BREATH_IN_MS : BREATH_MS - BREATH_IN_MS);
    };
    loop('in');
    return () => clearTimeout(t);
  }, [active]);
  return phase;
}

export default function Sit() {
  const s = useSessionScreen('sit');
  const { t, lang } = useT();
  const { c, reduceMotion } = useTheme();
  const [words, setWords] = useState(true);
  const hasTrack = useMusic('sit');
  const phase = useBreathPhase(!reduceMotion);
  if (!s || !s.path) return null;
  const b = BREATH[s.path];
  const pair = b && (b.t[lang] ?? b.t.en);
  const showWords = !!pair && words;
  const lineLang = b?.t[lang] ? lang : 'en';

  const cue = (which: 'in' | 'out') => (
    <View style={{ alignItems: 'center', gap: 4 }} key={which}>
      <Txt v="secondary" muted center>
        {t(which === 'in' ? 'br_in' : 'br_out')}
      </Txt>
      {showWords ? (
        <Txt v="h2" face="reading" center lang={lineLang}>
          {pair![which === 'in' ? 0 : 1]}
        </Txt>
      ) : null}
    </View>
  );

  return (
    <Screen
      header={<Header inSession step={4} onBack={() => router.back()} />}
      testID="screen-sit"
      actions={<Button label={t('amen')} onPress={() => router.back()} testID="sit-amen" />}
    >
      <SpeakerButton visible={hasTrack} />
      <Heading center>{t('sit_title')}</Heading>
      <Lead center>{showWords ? t('breath_note') : t('sit_breathe')}</Lead>
      <View
        style={{ height: 240, alignItems: 'center', justifyContent: 'center', borderRadius: 24, overflow: 'hidden' }}
      >
        <Image
          source={sceneOf(s.path)}
          style={{ position: 'absolute', inset: 0, opacity: 0.25 }}
          contentFit="cover"
          accessibilityElementsHidden
        />
        <View style={{ position: 'absolute', inset: 0, backgroundColor: c.background, opacity: 0.35 }} />
        <Lamp size={200} breathe />
      </View>
      <View style={{ minHeight: 110, justifyContent: 'center', gap: 16 }} accessibilityLiveRegion="none">
        {reduceMotion ? (
          <>
            {cue('in')}
            {cue('out')}
          </>
        ) : (
          <Animated.View key={phase} entering={FadeIn.duration(900)} exiting={FadeOut.duration(600)}>
            {cue(phase)}
          </Animated.View>
        )}
      </View>
      {pair ? (
        <Button
          kind="quiet"
          label={t(words ? 'just_breathe' : 'show_words')}
          onPress={() => setWords((w) => !w)}
          testID="toggle-words"
        />
      ) : null}
    </Screen>
  );
}
