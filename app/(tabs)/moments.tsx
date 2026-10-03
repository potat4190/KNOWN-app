/**
 * Moments: newest first. Each row: face thumbnail, date in the moment's
 * language, the "In your own words" tag, title, reference · name, Open.
 * Opening the tab also runs the paused-moment cleanup (8.7).
 */
import { useCallback, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Header } from '@/components/Header';
import { Heading, Lead } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { Icon } from '@/components/Icon';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { isLang } from '@/i18n/langs';
import { fmtDate } from '@/lib/moments';
import { P, isPathKey, ref, sceneOf } from '@/lib/content';
import { getStore } from '@/data/store';
import { cleanupPaused } from '@/state/session-store';
import type { Moment } from '@/data/types';
import { TourTarget } from '@/features/tour/TourTarget';
import { useTips } from '@/features/tour/TourProvider';

export default function Moments() {
  const { t, lang } = useT();
  const { c, radius } = useTheme();
  const [list, setList] = useState<Moment[] | null>(null);
  useTips('moments', list && list.length ? ['moments_row'] : []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void cleanupPaused()
        .then(() => getStore().moments.list())
        .then((l) => alive && setList(l));
      return () => {
        alive = false;
      };
    }, []),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={['top']} testID="screen-moments">
      <Header />
      <FlatList
        data={list ?? []}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}
        ListHeaderComponent={
          <View style={{ gap: 8, marginBottom: 8 }}>
            <Txt v="footnote" weight="bold" color={c.lampInk}>
              {t('moments_eyebrow')}
            </Txt>
            <Heading>{t('moments_title')}</Heading>
            <Lead>{t('moments_sub')}</Lead>
          </View>
        }
        ListEmptyComponent={
          list ? (
            <Txt v="secondary" muted testID="moments-empty">
              {t('moments_empty')}
            </Txt>
          ) : null
        }
        renderItem={({ item: m, index }) => {
          if (!isPathKey(m.path)) return null;
          const mLang = isLang(m.lang) ? m.lang : lang;
          const row = (
            <Pressable
              onPress={() => router.push(`/moment/${m.id}`)}
              accessibilityRole="button"
              testID={`moment-${index}`}
              style={{
                flexDirection: 'row',
                gap: 12,
                padding: 14,
                borderRadius: radius.card,
                borderWidth: 1,
                borderColor: c.border,
                backgroundColor: c.surface,
              }}
            >
              <Image
                source={sceneOf(m.path)}
                style={{ width: 52, height: 52, borderRadius: 26 }}
                contentFit="cover"
                accessibilityIgnoresInvertColors
              />
              <View style={{ flex: 1, gap: 2 }}>
                <Txt v="footnote" muted>
                  {fmtDate(m.createdAt, mLang)}
                  {m.from === 'words' ? ` · ${t('from_words')}` : ''}
                </Txt>
                <Txt v="body" weight="bold">
                  {P(m.path, 'title', mLang)}
                </Txt>
                <Txt v="secondary" muted>
                  {ref(m.path, mLang)} · {P(m.path, 'name', mLang)}
                </Txt>
                <Txt v="secondary" weight="bold">
                  {t('open')}
                </Txt>
              </View>
              <Icon name="chevron" color={c.textMuted} size={20} />
            </Pressable>
          );
          return index === 0 ? <TourTarget id="moments_row">{row}</TourTarget> : row;
        }}
      />
    </SafeAreaView>
  );
}
