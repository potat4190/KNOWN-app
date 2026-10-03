/** Help (modal, reachable from every screen). No tips, no music here. */
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Heading, Lead } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { HelpLines } from '@/components/HelpLines';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';

export default function Help() {
  const { t } = useT();
  const { c } = useTheme();
  return (
    <Screen
      header={<Header hideHelp hideGear onBack={() => router.back()} />}
      testID="screen-help"
      actions={<Button kind="soft" label={t('back')} onPress={() => router.back()} testID="help-back" />}
    >
      <Txt v="footnote" weight="bold" color={c.lampInk}>
        {t('help_eyebrow')}
      </Txt>
      <Heading>{t('help_title')}</Heading>
      <Lead>{t('help_sub')}</Lead>
      <HelpLines full />
      <Txt v="secondary" muted>
        {t('help_note')}
      </Txt>
    </Screen>
  );
}
