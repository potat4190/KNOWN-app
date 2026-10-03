/**
 * Thinking (own words): breathing lamp, "You said". The relay gets 8 s, then
 * the on-device matcher answers. A crisis phrase or the relay's risk flag → Crisis.
 */
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Heading, Lead, SaidCard } from '@/components/bits';
import { Lamp } from '@/components/Lamp';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { useSession } from '@/state/session-store';
import { replaceSession, useSessionScreen } from '@/state/nav';
import { isPathKey } from '@/lib/content';
import { match } from '@/services/matcher/matcher';
import { relayDeps } from '@/services/matcher/deps';
import * as S from '@/state/session';

function Dots() {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'center' }} accessibilityElementsHidden>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.lamp, opacity: 0.4 + i * 0.25 }}
        />
      ))}
    </View>
  );
}

export default function Thinking() {
  const s = useSessionScreen('thinking');
  const { t, lang } = useT();
  const started = useRef(false);

  useEffect(() => {
    const cur = useSession.getState().s;
    if (!cur || started.current) return;
    started.current = true;
    const text = cur.words.trim();
    void match(text, lang, relayDeps()).then((r) => {
      const now = useSession.getState().s;
      if (!now || now.screen !== 'thinking') return;
      const { result, crisis } = S.acceptMatch(r, isPathKey);
      useSession.getState().update((x) => ({
        ...S.openStory(x, { from: 'words', sel: null, path: result.key!, ai: result }),
        crisis,
      }));
      replaceSession(crisis ? 'crisis' : 'scripture');
    });
  }, [lang]);

  if (!s) return null;
  return (
    <Screen header={<Header inSession step={1} />} center testID="screen-thinking">
      <Lamp size={130} breathe />
      <Dots />
      <Heading center>{t('thinking')}</Heading>
      <Lead center>{t('thinking_sub')}</Lead>
      <SaidCard label={t('you_said')} words={s.words.trim()} />
    </Screen>
  );
}
