/**
 * First-run guide (8.4), Night design (Oct 6): four cards in a bottom sheet over the
 * lamp-lit room. The lamp lives in the room, outside the cards, so Next never restarts
 * it, and it shares one clock with Home's lamp, so the light carries on into Home.
 * Skip is visible until the last card; the cards never return after Skip or Start
 * (except from Settings → Show me around again). Copy is drafted (src/i18n/drafted.ts).
 */
import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, View, type ViewToken } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useT } from '@/i18n';
import { localizeDigits } from '@/i18n/langs';
import { usePrefs } from '@/state/prefs';
import { Button } from '@/components/Button';
import { Heading } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { Mark } from '@/components/Header';
import { LampRoom } from '@/components/LivingLamp';
import { useFrameWidth } from '@/components/AppFrame';

type Card = { key: string; title: string; body: string[]; steps?: string[] };

export default function Onboarding() {
  const { c, radius } = useTheme();
  const { t, lang } = useT();
  // Each card is one page wide: the screen on phones, the app column in a wide browser window.
  const width = useFrameWidth();
  const [i, setI] = useState(0);
  const list = useRef<FlatList<Card>>(null);
  const set = usePrefs((p) => p.set);

  const cards: Card[] = [
    { key: '1', title: t('tour1_title'), body: [t('tour1_body'), t('tour1_more')] },
    {
      key: '2',
      title: t('tour2_title'),
      body: [t('tour2_body')],
      steps: [t('tour_s1'), t('tour_s2'), t('tour_s3'), t('tour_s4')],
    },
    { key: '3', title: t('tour3_title'), body: [t('w_private')] },
    { key: '4', title: t('tour4_title'), body: [t('tour4_body'), t('tour4_more')] },
  ];
  const last = i === cards.length - 1;
  const finish = () => {
    set({ tourDone: true });
    router.replace('/');
  };
  const go = (to: number) => {
    list.current?.scrollToIndex({ index: to, animated: true });
    setI(to);
  };
  const next = () => (last ? finish() : go(i + 1));
  const onViewable = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setI(viewableItems[0].index);
  }, []);

  const steps = (items: string[]) => (
    <View style={{ borderRadius: radius.card, backgroundColor: c.surface, overflow: 'hidden' }}>
      {items.map((s, k) => (
        <View
          key={k}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            minHeight: 52,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderTopWidth: k ? 1 : 0,
            borderColor: c.border,
          }}
        >
          <View
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              borderWidth: 1.5,
              borderColor: c.lamp,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt v="footnote" weight="bold" color={c.lampInk} maxFontSizeMultiplier={1.2}>
              {localizeDigits(k + 1, lang)}
            </Txt>
          </View>
          <Txt v="body" weight="bold" style={{ flex: 1 }}>
            {s}
          </Txt>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} testID="screen-onboarding">
      <LampRoom lamp />
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: 52,
          paddingHorizontal: 12,
        }}
      >
        <Mark />
        {last ? null : <Button kind="quiet" label={t('tour_skip')} onPress={finish} testID="tour-skip" />}
      </View>
      <View style={{ flex: 1, minHeight: 120 }} />
      <View
        style={{
          backgroundColor: c.elevated,
          borderTopStartRadius: 28,
          borderTopEndRadius: 28,
          paddingTop: 10,
          paddingBottom: 12,
          gap: 14,
          maxHeight: '74%',
        }}
      >
        <View
          style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c.border, alignSelf: 'center' }}
          accessibilityElementsHidden
        />
        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 24 }}>
          {cards.map((card, k) => (
            <Pressable
              key={card.key}
              onPress={() => go(k)}
              accessibilityRole="button"
              accessibilityLabel={`${localizeDigits(k + 1, lang)} / ${localizeDigits(cards.length, lang)}`}
              accessibilityState={{ selected: k === i }}
              hitSlop={4}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: k === i ? c.lamp : c.border,
                backgroundColor: k === i ? c.lamp : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              testID={`tour-page-${k + 1}`}
            >
              <Txt v="footnote" weight="bold" color={k === i ? c.onLamp : c.textMuted} maxFontSizeMultiplier={1.2}>
                {localizeDigits(k + 1, lang)}
              </Txt>
            </Pressable>
          ))}
        </View>
        <FlatList
          ref={list}
          data={cards}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(x) => x.key}
          onViewableItemsChanged={onViewable}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          style={{ flexGrow: 0 }}
          renderItem={({ item, index }) => (
            <View style={{ width, paddingHorizontal: 24, gap: 14 }}>
              {index === i ? <Heading>{item.title}</Heading> : <Txt v="h1">{item.title}</Txt>}
              {item.steps ? steps(item.steps) : null}
              {item.body.map((b, k) => (
                <Txt key={k} v="body" muted>
                  {b}
                </Txt>
              ))}
            </View>
          )}
        />
        <View style={{ paddingHorizontal: 24 }}>
          <Button label={t(last ? 'tour_start' : 'tour_next')} onPress={next} testID="tour-next" />
        </View>
      </View>
    </SafeAreaView>
  );
}
