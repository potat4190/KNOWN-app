/**
 * Scripture, step 2. Scene banner; the opening "Here's one place you might begin."
 * (pictures / no words, see S.openingFor) or "You said" + the AI's one-line reason (own words); the page card; the invite;
 * "Who was {name}?" with the team's own retelling (never styled as Scripture).
 */
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Heading, Lead, SaidCard } from '@/components/bits';
import { SceneBanner } from '@/components/SceneBanner';
import { PageCard } from '@/components/PageCard';
import { Txt } from '@/components/Txt';
import { Icon } from '@/components/Icon';
import { hasKey, useT } from '@/i18n';
import { useTheme } from '@/theme';
import { NW, P, storySource } from '@/lib/content';
import { useSession } from '@/state/session-store';
import { goSession, useSessionScreen } from '@/state/nav';
import { useUi } from '@/state/ui';
import { useScripture } from '@/services/scripture/useScripture';
import * as S from '@/state/session';
import { TourTarget } from '@/features/tour/TourTarget';
import { useTips } from '@/features/tour/TourProvider';
import { useMusic } from '@/services/music/MusicHost';
import { withSessionMood } from '@/features/mood/SessionMood';

function Scripture() {
  const s = useSessionScreen('scripture');
  const { t, lang } = useT();
  const { c } = useTheme();
  // "Who was {name}?" is open for one story at a time; a new story starts closed.
  const [aboutFor, setAboutFor] = useState<string | null>(null);
  const resolved = useScripture(s?.path ?? null, lang);
  useTips('scripture', ['scripture_full', 'scripture_nofit']);
  useMusic('scripture');

  // Remember which edition was shown, for the Moment.
  useEffect(() => {
    if (!resolved) return;
    const shown: S.ScriptureShown =
      resolved.source === 'youversion'
        ? { source: 'youversion', versionId: resolved.versionId, abbr: resolved.abbr }
        : { source: 'bundled', versionId: null, abbr: resolved.abbr };
    useSession.getState().update((x) => ({ ...x, scripture: shown }));
  }, [resolved]);

  if (!s || !s.path) return null;
  const path = s.path;
  const opening = S.openingFor(s, lang, t, hasKey);
  const story = P(path, 'story', lang);
  const ai = s.ai;
  const aboutOpen = aboutFor === path;

  return (
    <Screen
      header={<Header inSession step={2} onBack={() => router.back()} />}
      testID="screen-scripture"
      actions={
        <>
          <Button label={t('continue_ready')} onPress={() => goSession('pray')} testID="to-pray" />
          <TourTarget id="scripture_nofit" fixed>
            <Button
              kind="quiet"
              label={t('not_fit')}
              onPress={() => useUi.getState().openSheet('nofit')}
              testID="not-fit"
            />
          </TourTarget>
        </>
      }
    >
      <SceneBanner path={path} name={P(path, 'name', lang)} title={P(path, 'title', lang)} />
      {s.from === 'words' ? (
        <>
          <SaidCard label={t('you_said')} words={s.words.trim()}>
            <Txt v="secondary">{t('ai_thanks')}</Txt>
            {!s.swapped && ai?.unsure ? (
              <Txt v="secondary" testID="ai-reason">
                {t('ai_start')}
              </Txt>
            ) : null}
            {!s.swapped && ai && !ai.unsure && ai.reason ? (
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
                <Icon name="spark" size={16} color={c.lampInk} />
                <Txt v="secondary" style={{ flex: 1 }} testID="ai-reason">
                  {ai.reason}
                </Txt>
              </View>
            ) : null}
            {!s.swapped && ai?.source === 'local' && !ai.unsure ? (
              <Txt v="footnote" weight="bold" color={c.lampInk} testID="ai-local-tag">
                {t('ai_local')}
              </Txt>
            ) : null}
          </SaidCard>
          <Heading srOnly>{`${P(path, 'name', lang)}: ${P(path, 'title', lang)}`}</Heading>
        </>
      ) : opening ? (
        <>
          <Heading>{opening.h}</Heading>
          <Lead>{opening.p}</Lead>
        </>
      ) : null}
      {path === NW ? (
        // Psalm 77 is honest lament: pair it with Help (critique).
        <Button kind="plain" label={t('help_title')} onPress={() => router.push('/help')} testID="nw-help" />
      ) : null}
      <PageCard path={path} resolved={resolved} testID="page-card" />
      <Txt v="body">{P(path, 'invite', lang)}</Txt>
      {story.length ? (
        <View style={{ gap: 10 }}>
          <Pressable
            onPress={() => setAboutFor(aboutOpen ? null : path)}
            accessibilityRole="button"
            accessibilityState={{ expanded: aboutOpen }}
            style={{
              minHeight: 44,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTopWidth: 1,
              borderColor: c.border,
              paddingTop: 8,
            }}
            testID="about-toggle"
          >
            <Txt v="body" weight="bold">
              {t('about', { name: P(path, 'name', lang) })}
            </Txt>
            <View style={{ transform: [{ rotate: aboutOpen ? '90deg' : '0deg' }] }}>
              <Icon name="chevron" color={c.textMuted} size={20} />
            </View>
          </Pressable>
          {aboutOpen ? (
            <View style={{ gap: 10 }}>
              <Txt v="body">{P(path, 'intro', lang)}</Txt>
              {story.map((para, i) => (
                <Txt key={i} v="body">
                  {para}
                </Txt>
              ))}
              <Txt v="secondary" muted testID="story-src">
                {t('story_src', { ref: storySource(path, lang) })}
              </Txt>
            </View>
          ) : null}
        </View>
      ) : (
        <Txt v="secondary" muted>
          {P(path, 'intro', lang)}
        </Txt>
      )}
    </Screen>
  );
}

export default withSessionMood(Scripture);
