/**
 * Feel, step 1. Pictures (choose 1–2) or her own words. "I don't have the
 * words" is always available and opens Psalm 77. Continue is tap 3 to Scripture.
 */
import { router } from 'expo-router';
import { TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Heading, Lead, Notice, Segmented } from '@/components/bits';
import { PictureGrid } from '@/components/PictureGrid';
import { Txt } from '@/components/Txt';
import { Icon } from '@/components/Icon';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { FLAGS } from '@/config/flags';
import { useSession, openPictures } from '@/state/session-store';
import { goSession, useSessionScreen } from '@/state/nav';
import { useUi } from '@/state/ui';
import * as S from '@/state/session';
import { TourTarget } from '@/features/tour/TourTarget';
import { useTips } from '@/features/tour/TourProvider';

export default function Feel() {
  const s = useSessionScreen('feel');
  const update = useSession((x) => x.update);
  const { t, lang } = useT();
  const { c, radius, type } = useTheme();
  useTips('feel', ['feel_tabs', 'feel_nowords']);
  if (!s) return null;
  const words = s.mode === 'words' && FLAGS.ownWords;
  const n = s.pics.length;

  const onBack = () => {
    if (S.hasTyped(s, lang)) useUi.getState().openSheet('exit');
    else {
      useSession.getState().end();
      router.back();
    }
  };
  const next = async () => {
    const path = await openPictures();
    if (path) goSession('scripture');
  };
  const noWords = () => {
    update(S.openNoWords);
    goSession('scripture');
  };
  const findStory = () => {
    if (!s.words.trim()) return;
    goSession('thinking');
  };

  return (
    <Screen
      header={<Header inSession step={1} onBack={onBack} />}
      testID="screen-feel"
      actions={
        <>
          {words ? (
            <Button label={t('find_story')} onPress={findStory} disabled={!s.words.trim()} testID="find-story" />
          ) : (
            <Button label={t('continue')} onPress={next} disabled={!n} testID="continue" />
          )}
          <TourTarget id="feel_nowords" fixed>
            <Button kind="quiet" label={t('no_words')} onPress={noWords} testID="no-words" />
          </TourTarget>
        </>
      }
    >
      {s.note ? <Notice>{t(s.note)}</Notice> : null}
      <Heading>{t(words ? 'words_title' : 'pics_title')}</Heading>
      {FLAGS.ownWords ? (
        <TourTarget id="feel_tabs">
          <Segmented
            label={t('pics_eyebrow')}
            value={words ? 'words' : 'pics'}
            onChange={(m) => update((x) => ({ ...x, mode: m, note: null }))}
            items={[
              { key: 'pics', label: t('tab_pics'), testID: 'tab-pics' },
              { key: 'words', label: t('tab_words'), testID: 'tab-words' },
            ]}
          />
        </TourTarget>
      ) : null}
      {words ? (
        <View style={{ gap: 12 }}>
          <Lead>{t('words_lead')}</Lead>
          <TextInput
            testID="words-input"
            accessibilityLabel={t('words_label')}
            value={s.words}
            onChangeText={(v) => update((x) => ({ ...x, words: v }))}
            placeholder={t('words_ph')}
            placeholderTextColor={c.textMuted}
            multiline
            maxLength={1200}
            style={{
              ...type('body'),
              color: c.text,
              minHeight: 130,
              textAlignVertical: 'top',
              padding: 14,
              borderRadius: radius.card,
              borderWidth: 1.5,
              borderColor: c.border,
              backgroundColor: c.surface,
            }}
          />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Icon name="spark" size={18} color={c.lampInk} />
            <Txt v="secondary" muted style={{ flex: 1 }}>
              {t('ai_note')}
            </Txt>
          </View>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Lead>{t('pics_sub')}</Lead>
          <PictureGrid
            chosen={s.pics}
            onToggle={(k) => {
              update((x) => S.togglePic(x, k));
              const after = S.togglePic(s, k).pics.length;
              useUi.getState().say(t('pics_count', { n: after }));
            }}
          />
          <Txt v="secondary" muted center accessibilityElementsHidden>
            {n ? t('pics_count', { n }) : ' '}
          </Txt>
        </View>
      )}
    </Screen>
  );
}
