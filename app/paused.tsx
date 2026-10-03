/** Paused: lamp, "Saved for later", Done → Home. */
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Heading, Lead } from '@/components/bits';
import { Lamp } from '@/components/Lamp';
import { useT } from '@/i18n';

export default function Paused() {
  const { t } = useT();
  return (
    <Screen
      header={<Header />}
      center
      testID="screen-paused"
      actions={<Button label={t('done')} onPress={() => router.replace('/')} testID="paused-done" />}
    >
      <Lamp size={120} />
      <Heading center>{t('paused_title')}</Heading>
      <Lead center>{t('paused_sub')}</Lead>
    </Screen>
  );
}
