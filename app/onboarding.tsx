/**
 * First-run guide (8.4): four swipeable cards hosted by the lamp. Skip is
 * visible from the first card; the cards never return after Skip or Start
 * (except from Settings → Show me around again). Copy is drafted.
 */
import { useCallback, useRef, useState } from 'react';
import { FlatList, View, useWindowDimensions, type ViewToken } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useT } from '@/i18n';
import { usePrefs } from '@/state/prefs';
import { Button } from '@/components/Button';
import { Heading } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { Lamp } from '@/components/Lamp';
import { StepDots } from '@/components/Header';
import { Icon } from '@/components/Icon';

type Card = { key: string; title: string; body: string[]; visual: 'lamp' | 'steps' | 'lock' | 'help' };

export default function Onboarding() {
  const { c, radius } = useTheme();
  const { t } = useT();
  const { width } = useWindowDimensions();
  const [i, setI] = useState(0);
  const list = useRef<FlatList<Card>>(null);
  const set = usePrefs((p) => p.set);

  const cards: Card[] = [
    { key: '1', title: t('tour1_title'), body: [t('w_sub')], visual: 'lamp' },
    { key: '2', title: t('tour2_title'), body: [t('tour2_body')], visual: 'steps' },
    { key: '3', title: t('tour3_title'), body: [t('w_private'), t('tour3_more')], visual: 'lock' },
    { key: '4', title: t('tour4_title'), body: [t('tour4_body')], visual: 'help' },
  ];
  const last = i === cards.length - 1;
  const finish = () => {
    set({ tourDone: true });
    router.replace('/');
  };
  const next = () => {
    if (last) return finish();
    list.current?.scrollToIndex({ index: i + 1, animated: true });
    setI(i + 1);
  };
  const onViewable = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setI(viewableItems[0].index);
  }, []);

  const visual = (v: Card['visual']) => {
    if (v === 'lamp') return <Lamp size={150} breathe />;
    if (v === 'steps')
      return (
        <View style={{ gap: 14, alignItems: 'center' }}>
          {[1, 2, 3, 4].map((n) => (
            <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <StepDots step={n} />
              <Txt v="body" weight="bold" style={{ minWidth: 120 }}>
                {t(`tour_s${n}`)}
              </Txt>
            </View>
          ))}
        </View>
      );
    return (
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: c.warm,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: 'center',
        }}
      >
        <Icon name={v === 'lock' ? 'lock' : 'help'} size={44} color={c.lampInk} />
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} testID="screen-onboarding">
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 12 }}>
        <Button kind="quiet" label={t('tour_skip')} onPress={finish} testID="tour-skip" />
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
        renderItem={({ item, index }) => (
          <View style={{ width, paddingHorizontal: 28, justifyContent: 'center', gap: 20 }}>
            <View style={{ minHeight: 180, justifyContent: 'center' }}>{visual(item.visual)}</View>
            {index === i ? (
              <Heading center>{item.title}</Heading>
            ) : (
              <Txt v="h1" center>
                {item.title}
              </Txt>
            )}
            {item.body.map((b, k) => (
              <Txt key={k} v="body" muted center>
                {b}
              </Txt>
            ))}
          </View>
        )}
      />
      <View style={{ paddingHorizontal: 20, paddingBottom: 12, gap: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }} accessibilityElementsHidden>
          {cards.map((_, k) => (
            <View
              key={k}
              style={{
                width: k === i ? 20 : 8,
                height: 8,
                borderRadius: radius.full,
                backgroundColor: k <= i ? c.lamp : c.border,
              }}
            />
          ))}
        </View>
        <Button label={t(last ? 'tour_start' : 'tour_next')} onPress={next} testID="tour-next" />
      </View>
    </SafeAreaView>
  );
}
