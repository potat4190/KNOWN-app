/**
 * Moment detail: date, title, Scripture excerpt (if kept), her words, what
 * stayed, prayer, message (with Copy). Delete with an inline confirmation.
 * Translate-on-open: if the moment's language differs from the app's, ask;
 * Yes re-renders the bundled content (Scripture, title, story, the say-line
 * and an unedited prayer) in the current language. Her own typed words are
 * never translated.
 */
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Card, Heading, InlineConfirm, StatusLine } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { BundledVerses, Skeleton } from '@/components/PageCard';
import { BibleTextView } from '@youversion/platform-react-native-expo-ui';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { isLang, type Lang } from '@/i18n/langs';
import { P, PASSAGES, isPathKey, ref, usfmRefs } from '@/lib/content';
import { getStore } from '@/data/store';
import { usePrefs } from '@/state/prefs';
import type { Moment } from '@/data/types';
import { resolve, bundled, type Resolved } from '@/services/scripture/scripture';
import { scriptureDeps } from '@/services/scripture/useScripture';
import { fmtDate, translateMoment } from '@/lib/moments';

/** Reopening uses the same YouVersion version when online, otherwise the bundled text with a note. */
function useMomentScripture(m: Moment | null, lang: Lang): Resolved | null {
  const [yv, setYv] = useState<{ id: string; r: Resolved } | null>(null);
  const yvWanted = !!m && m.passage && isPathKey(m.path) && m.scriptureSource === 'youversion' && !!m.versionId;
  useEffect(() => {
    if (!m || !yvWanted || !isPathKey(m.path)) return;
    const deps = { ...scriptureDeps(lang), version: { id: m.versionId!, abbr: m.abbr } };
    void resolve(m.path, lang, deps).then((r) => setYv({ id: `${m.id}|${lang}`, r }));
  }, [m, lang, yvWanted]);
  if (!m || !m.passage || !isPathKey(m.path)) return null;
  if (!yvWanted) return bundled(m.path, lang, { version: null }, 'no-version');
  return yv?.id === `${m.id}|${lang}` ? yv.r : null;
}

export default function MomentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useT();
  const { c, scheme, textScale } = useTheme();
  const [m, setM] = useState<Moment | null | undefined>(undefined);
  const [confirm, setConfirm] = useState(false);
  const [askTranslate, setAskTranslate] = useState(false);
  const [status, setStatus] = useState('');

  const load = useCallback(
    () =>
      getStore()
        .moments.get(String(id))
        .then((x) => {
          setM(x);
          if (x && x.lang !== lang) setAskTranslate(true);
        }),
    [id, lang],
  );
  useEffect(() => {
    let alive = true;
    void getStore()
      .moments.get(String(id))
      .then((x) => {
        if (!alive) return;
        setM(x);
        if (x && x.lang !== usePrefs.getState().lang) setAskTranslate(true);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const mLang: Lang = m && isLang(m.lang) ? m.lang : lang;
  const scripture = useMomentScripture(m ?? null, mLang);

  if (m === undefined) return null;
  if (!m || !isPathKey(m.path)) {
    return (
      <Screen
        header={<Header onBack={() => router.back()} />}
        actions={<Button kind="soft" label={t('back_moments')} onPress={() => router.back()} />}
      >
        <Heading>{t('moment_gone')}</Heading>
      </Screen>
    );
  }
  const path = m.path;

  const del = async () => {
    await getStore().moments.remove(m.id);
    router.back();
  };
  const doTranslate = async () => {
    const patch = translateMoment(m, lang);
    await getStore().moments.update(m.id, patch);
    setAskTranslate(false);
    await load();
  };

  return (
    <Screen
      header={<Header onBack={() => router.back()} />}
      testID="screen-moment"
      actions={<Button kind="soft" label={t('back_moments')} onPress={() => router.back()} testID="back-moments" />}
    >
      {askTranslate ? (
        <InlineConfirm
          question={t('translate_q')}
          yes={t('translate_yes')}
          no={t('translate_no')}
          onYes={doTranslate}
          onNo={() => setAskTranslate(false)}
          testID="translate-q"
        />
      ) : null}
      <Txt v="footnote" weight="bold" color={c.lampInk}>
        {fmtDate(m.createdAt, mLang)}
      </Txt>
      <Heading>{P(path, 'title', mLang)}</Heading>
      {m.passage ? (
        <Card>
          {!scripture ? (
            <Skeleton />
          ) : scripture.source === 'youversion' ? (
            usfmRefs(path, PASSAGES[path].ex).map((r) => (
              <BibleTextView
                key={r}
                reference={r}
                versionId={scripture.versionId}
                theme={scheme}
                fontSize={Math.round(20 * textScale)}
              />
            ))
          ) : (
            <BundledVerses path={path} verses={PASSAGES[path].ex} textLang={scripture.textLang} />
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt v="secondary" weight="bold">
              {ref(path, mLang)}
            </Txt>
            <Txt v="secondary" muted>
              {scripture?.abbr ?? m.abbr}
            </Txt>
          </View>
          {scripture?.source === 'bundled' && m.scriptureSource === 'youversion' ? (
            <Txt v="footnote" muted>
              {t('bundled_note')}
            </Txt>
          ) : null}
        </Card>
      ) : null}
      {m.words ? (
        <View style={{ gap: 6 }}>
          <Txt v="secondary" weight="bold">
            {t('keep_words')}
          </Txt>
          <Card tone="warm">
            <Txt v="body" selectable>
              {m.words}
            </Txt>
          </Card>
        </View>
      ) : null}
      {m.stay ? (
        <View style={{ gap: 6 }}>
          <Txt v="secondary" weight="bold">
            {t('m_stood')}
          </Txt>
          <Txt v="body" style={{ fontStyle: 'italic' }}>
            “{m.stay}”
          </Txt>
        </View>
      ) : null}
      {m.prayer ? (
        <View style={{ gap: 6 }}>
          <Txt v="secondary" weight="bold">
            {t('m_prayer')}
          </Txt>
          <Card>
            <Txt v="body" face="reading" selectable>
              {m.prayer}
            </Txt>
          </Card>
        </View>
      ) : null}
      {m.msg ? (
        <View style={{ gap: 6 }}>
          <Txt v="secondary" weight="bold">
            {t('keep_msg')}
          </Txt>
          <Card>
            <Txt v="body" selectable>
              {m.msg}
            </Txt>
          </Card>
          <Button
            kind="plain"
            label={t('share_copy')}
            onPress={async () => {
              await Clipboard.setStringAsync(m.msg ?? '');
              setStatus(t('copied'));
            }}
          />
        </View>
      ) : null}
      <StatusLine text={status} />
      {confirm ? (
        <InlineConfirm
          question={t('delete_q')}
          yes={t('delete_yes')}
          no={t('delete_no')}
          onYes={del}
          onNo={() => setConfirm(false)}
          danger
          testID="delete-confirm"
        />
      ) : (
        <Button
          kind="plain"
          label={t('delete_moment')}
          onPress={() => setConfirm(true)}
          testID="delete-moment"
          style={{ alignSelf: 'flex-start' }}
        />
      )}
    </Screen>
  );
}
