/** Crisis gate (step 2): a danger-tinted card, the help lines, then Help or Scripture. No tips, no music here. */
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Card, Heading } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { HelpLines } from '@/components/HelpLines';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { useSession } from '@/state/session-store';
import { replaceSession, useSessionScreen } from '@/state/nav';
import { NW } from '@/lib/content';

export default function Crisis() {
  const s = useSessionScreen('crisis');
  const { t } = useT();
  const { c } = useTheme();
  if (!s) return null;
  const toScripture = () => {
    if (!s.path) useSession.getState().update((x) => ({ ...x, path: NW, seen: [NW], from: 'words' }));
    replaceSession('scripture');
  };
  return (
    <Screen
      header={<Header inSession step={2} />}
      testID="screen-crisis"
      actions={
        <>
          <Button label={t('crisis_help')} onPress={() => router.push('/help')} testID="crisis-help" />
          <Button kind="plain" label={t('crisis_go')} onPress={toScripture} testID="crisis-go" />
        </>
      }
    >
      <Card tone="danger">
        <Txt v="footnote" weight="bold" color={c.danger}>
          {t('crisis_eyebrow')}
        </Txt>
        <Heading>{t('crisis_title')}</Heading>
        <Txt v="body">{t('crisis_body')}</Txt>
      </Card>
      <HelpLines />
    </Screen>
  );
}
