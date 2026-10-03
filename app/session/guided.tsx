/** Guided orientation ("With someone I trust"): one screen, then Feel. The guide never sees anything in the app. */
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Heading, Lead, Notice } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { Lamp } from '@/components/Lamp';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { useSession } from '@/state/session-store';
import { goSession } from '@/state/nav';

export default function Guided() {
  const { t } = useT();
  const { c } = useTheme();
  const s = useSession((x) => x.s);
  if (!s) return null;
  return (
    <Screen
      header={<Header onBack={() => router.back()} />}
      testID="screen-guided"
      actions={<Button label={t('start_exp')} onPress={() => goSession('feel')} testID="start-exp" />}
    >
      <Lamp size={110} />
      <Txt v="footnote" weight="bold" color={c.lampInk}>
        {t('guided_eyebrow')}
      </Txt>
      <Heading>{t('guided_title')}</Heading>
      <Lead>{t('guided_body')}</Lead>
      <Notice icon="lock">{t('guided_note')}</Notice>
    </Screen>
  );
}
