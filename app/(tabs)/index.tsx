/**
 * Home (Design Lab "welcome"). Begin goes straight to Feel. Never shows a
 * moment's title, Scripture or her words: only a count (the phone may be shared).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Hero } from '@/components/SceneBanner';
import { Button } from '@/components/Button';
import { Heading, Lead, Notice, Tile } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { Icon } from '@/components/Icon';
import { SCENES } from '@/lib/content';
import { useT } from '@/i18n';
import { localizeDigits } from '@/i18n/langs';
import { useTheme } from '@/theme';
import { usePrefs } from '@/state/prefs';
import { useUi } from '@/state/ui';
import { getStore } from '@/data/store';
import { beginSession } from '@/state/nav';
import { daysLeft, loadPaused } from '@/state/session-store';
import { PAUSE_TTL_MS, DAY_MS } from '@/config/privacy';
import { recoverOffered } from '@/state/launch';

export default function Home() {
  const { t, tc, lang } = useT();
  const { c } = useTheme();
  const langSet = usePrefs((p) => p.lang);
  const tourDone = usePrefs((p) => p.tourDone);
  const setPrefs = usePrefs((p) => p.set);
  const openSheet = useUi((u) => u.openSheet);
  const [count, setCount] = useState(0);
  const [pausedTs, setPausedTs] = useState<number | null>(null);
  const [notice, setNotice] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refresh = useCallback(async () => {
    const p = await loadPaused();
    setPausedTs(p?.ts ?? null);
    setCount(await getStore().moments.count());
    return p;
  }, []);

  useFocusEffect(
    useCallback(() => {
      let alive = true;
      void refresh().then((p) => {
        // On launch, a paused moment under 3 days old opens the Recover sheet (once per launch;
        // after that, Begin or the "Continue my previous moment" card open it).
        if (!alive || recoverOffered.done) return;
        recoverOffered.done = true;
        if (p && !useUi.getState().sheet && usePrefs.getState().lang && usePrefs.getState().tourDone)
          openSheet('recover');
      });
      return () => {
        alive = false;
      };
    }, [refresh, openSheet]),
  );

  // Refresh after a sheet closes (e.g. "Start a new one" deletes the paused moment).
  useEffect(
    () =>
      useUi.subscribe((u, prev) => {
        if (prev.sheet && !u.sheet) void refresh();
      }),
    [refresh],
  );

  // The one-time "removed after 3 days" line: shown once, then dismisses itself.
  useEffect(() => {
    const showOnce = (p: { removedNotice: boolean }) => {
      if (!p.removedNotice) return;
      setNotice(true);
      setPrefs({ removedNotice: false });
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
      noticeTimer.current = setTimeout(() => setNotice(false), 12_000);
    };
    const id = setTimeout(() => showOnce(usePrefs.getState()), 0);
    const unsub = usePrefs.subscribe(showOnce);
    return () => {
      clearTimeout(id);
      unsub();
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [setPrefs]);

  if (!langSet) return <Redirect href="/language" />;
  if (!tourDone) return <Redirect href="/onboarding" />;

  const begin = async () => {
    const p = await loadPaused();
    if (p) openSheet('recover');
    else beginSession(false);
  };
  const ttlDays = Math.round(PAUSE_TTL_MS / DAY_MS);

  return (
    <Screen
      header={<Header />}
      testID="screen-home"
      actions={
        <>
          <Button label={t('begin')} onPress={begin} testID="begin" />
          <Button
            kind="plain"
            label={count ? `${t('your_moments')} (${localizeDigits(count, lang)})` : t('your_moments')}
            onPress={() => router.navigate('/moments')}
            testID="your-moments"
          />
        </>
      }
    >
      {notice ? <Notice icon="lock">{tc('paused_removed', ttlDays)}</Notice> : null}
      <Hero source={SCENES.welcome} />
      <Heading>{t('w_title')}</Heading>
      <Lead>{t('w_sub')}</Lead>
      {pausedTs ? (
        <Tile
          title={t('recover_continue')}
          sub={tc('removes_in', daysLeft(pausedTs))}
          icon="pause"
          onPress={() => openSheet('recover')}
          testID="paused-card"
        />
      ) : null}
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <Icon name="lock" size={18} color={c.textMuted} />
        <Txt v="secondary" muted style={{ flex: 1 }}>
          {t('w_private')}
        </Txt>
      </View>
      <Button kind="quiet" label={t('mode_together')} onPress={() => beginSession(true)} testID="with-someone" />
    </Screen>
  );
}
