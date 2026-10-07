/**
 * Pray, step 3. Her chosen say-line visibly joins the prayer card, quoted
 * above the prayer (critique: "It asks me how I feel, then ignores my
 * answer"). It is never inserted into the editable prayer: her edits stay hers.
 */
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Heading, Lead } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { SpeakerButton } from '@/components/SpeakerButton';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { P, ref, sceneOf } from '@/lib/content';
import { useSession } from '@/state/session-store';
import { goSession, useSessionScreen } from '@/state/nav';
import * as S from '@/state/session';
import { TourTarget } from '@/features/tour/TourTarget';
import { useTips } from '@/features/tour/TourProvider';
import { useMusic } from '@/services/music/MusicHost';
import { withSessionMood } from '@/features/mood/SessionMood';

function Pray() {
  const s = useSessionScreen('pray');
  const update = useSession((x) => x.update);
  const { t, lang } = useT();
  const { c, radius, type } = useTheme();
  useTips('pray', ['pray_line', 'pray_edit']);
  const hasTrack = useMusic('pray');
  if (!s || !s.path) return null;
  const path = s.path;
  const options = P(path, 'options', lang);
  const chosen = S.stayText(s, lang);

  return (
    <Screen
      header={<Header inSession step={3} onBack={() => router.back()} />}
      testID="screen-pray"
      actions={<Button label={t('amen')} onPress={() => goSession('after')} testID="amen" />}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Image
          source={sceneOf(path)}
          style={{ width: 44, height: 44, borderRadius: 22 }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
        <View style={{ flex: 1 }}>
          <Txt v="secondary" weight="bold">
            {P(path, 'name', lang)}
          </Txt>
          <Txt v="footnote" muted>
            {ref(path, lang)}
          </Txt>
        </View>
        <SpeakerButton visible={hasTrack} />
      </View>
      <Heading>{t('pray_title')}</Heading>
      <Lead>{`${P(path, 'q', lang)} ${t('say_hint')}`}</Lead>
      <TourTarget id="pray_line">
        <View style={{ gap: 8 }}>
          {options.map((o, i) => {
            const on = s.stay === i;
            return (
              <Pressable
                key={i}
                testID={`say-${i}`}
                onPress={() => update((x) => S.toggleStay(x, i))}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={{
                  padding: 14,
                  minHeight: 52,
                  borderRadius: radius.card,
                  borderWidth: on ? 2 : 1,
                  borderColor: on ? c.lamp : c.border,
                  backgroundColor: on ? c.warm : c.surface,
                  borderStartWidth: 4,
                  borderStartColor: on ? c.lamp : c.border,
                }}
              >
                <Txt v="body" style={{ fontStyle: 'italic' }}>
                  “{o}”
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </TourTarget>
      <Txt v="secondary" weight="bold" nativeID="prayer-label">
        {t('pray_label')}
      </Txt>
      <TourTarget id="pray_edit">
        <View
          style={{
            borderRadius: radius.card,
            borderWidth: 1.5,
            borderColor: c.border,
            backgroundColor: c.surface,
            overflow: 'hidden',
          }}
          testID="prayer-card"
        >
          {chosen ? (
            <View
              style={{
                padding: 14,
                paddingBottom: 4,
                borderStartWidth: 4,
                borderStartColor: c.lamp,
                backgroundColor: c.warm,
              }}
              testID="prayer-stay"
            >
              <Txt v="body" style={{ fontStyle: 'italic' }}>
                “{chosen}”
              </Txt>
            </View>
          ) : null}
          <TextInput
            testID="prayer-input"
            accessibilityLabelledBy="prayer-label"
            accessibilityLabel={t('pray_label')}
            value={S.currentPrayer(s, lang)}
            onChangeText={(v) => update((x) => S.setPrayer(x, v))}
            multiline
            style={{
              ...type('body', { role: 'reading' }),
              color: c.text,
              padding: 14,
              minHeight: 170,
              textAlignVertical: 'top',
            }}
          />
        </View>
      </TourTarget>
      <Txt v="secondary" muted>
        {t('pray_sub')}
      </Txt>
    </Screen>
  );
}

export default withSessionMood(Pray);
