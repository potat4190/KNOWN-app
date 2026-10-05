/**
 * Keep: she checks what to save on this phone. Save once: after saving, Keep
 * shows it as saved (savedMomentId) and can't create a second Moment.
 * "My message" is pre-checked only if she chose to keep one. If the phone's
 * storage couldn't be opened (memory only), Keep says so before and after.
 * "Finish without saving" asks first if she typed or changed anything.
 */
import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Choice, Heading, InlineConfirm, Lead, Notice } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { ref } from '@/lib/content';
import { useSession, saveMoment, discardPaused } from '@/state/session-store';
import { leaveTo, useSessionScreen } from '@/state/nav';
import * as S from '@/state/session';
import { useMsgText } from '@/state/useMsgText';
import { setLastSaved } from '@/state/done';
import { getStore } from '@/data/store';

const clip = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n)}…` : s);

export default function Keep() {
  const s = useSessionScreen('keep');
  const update = useSession((x) => x.update);
  const { t, lang } = useT();
  const { c } = useTheme();
  const msgText = useMsgText();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  if (!s || !s.path) return null;
  const rows = S.keepRows(s);
  const saved = !!s.savedMomentId;
  const persistent = getStore().persistent;

  const detail: Record<keyof S.KeepChoice, string | null> = {
    passage: ref(s.path, lang),
    stay: S.stayText(s, lang),
    prayer: clip(S.currentPrayer(s, lang)),
    words: clip(s.words.trim()),
    msg: clip(msgText),
  };
  const title: Record<keyof S.KeepChoice, string> = {
    passage: t('keep_passage'),
    stay: t('keep_stood'),
    prayer: t('keep_prayer'),
    words: t('keep_words'),
    msg: t('keep_msg'),
  };

  const save = async () => {
    const m = await saveMoment(lang, msgText);
    if (m) {
      setLastSaved(true);
      // Pushed (not replaced): Back from Done returns here and shows it as saved.
      router.push('/done');
    }
  };
  const finishWithout = async () => {
    await discardPaused();
    useSession.getState().end();
    setLastSaved(false);
    leaveTo('/done');
  };
  // Her own prayer, words or message would be thrown away: ask first (as the ✕ sheet does).
  const askFinish = () => (S.hasTyped(s, lang) ? setConfirmDiscard(true) : void finishWithout());

  return (
    <Screen
      header={<Header inSession step={4} onBack={() => router.back()} />}
      testID="screen-keep"
      actions={
        saved ? (
          <Button label={t('done')} onPress={() => router.push('/done')} testID="keep-done" />
        ) : confirmDiscard ? (
          <InlineConfirm
            question={t('discard_q')}
            yes={t('discard_yes')}
            no={t('cancel')}
            onYes={() => void finishWithout()}
            onNo={() => setConfirmDiscard(false)}
            testID="finish-confirm"
          />
        ) : (
          <>
            <Button label={t('save_moment')} onPress={save} disabled={!S.canSave(s)} testID="save-moment" />
            <Button kind="plain" label={t('end_nosave')} onPress={askFinish} testID="finish-without" />
          </>
        )
      }
    >
      <Txt v="footnote" weight="bold" color={c.lampInk}>
        {t('keep_eyebrow')}
      </Txt>
      <Heading>{t('keep_title')}</Heading>
      <Lead>{t('keep_sub')}</Lead>
      {saved ? (
        <Notice icon="check">{t(persistent ? 'saved_ok' : 'saved_memory')}</Notice>
      ) : (
        <View style={{ gap: 10 }}>
          {persistent ? null : <Notice icon="lock">{t('store_memory')}</Notice>}
          {rows.map((k) => (
            <Choice
              key={k}
              title={title[k]}
              detail={detail[k]}
              on={s.keep[k]}
              onPress={() => update((x) => S.toggleKeep(x, k))}
              testID={`keep-${k}`}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}
