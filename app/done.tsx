/** Done: hero, closing copy, "Saved to Moments on this phone" when saved; Done → Home; View Moments. */
import { useState } from 'react';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Hero } from '@/components/SceneBanner';
import { Button } from '@/components/Button';
import { Heading, Lead } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { SCENES } from '@/lib/content';
import { useT } from '@/i18n';
import { wasSaved } from '@/state/done';
import { useSession } from '@/state/session-store';
import { leaveTo } from '@/state/nav';

export default function Done() {
  const { t } = useT();
  const [saved] = useState(wasSaved());
  const home = () => {
    useSession.getState().end();
    leaveTo('/');
  };
  const moments = () => {
    useSession.getState().end();
    leaveTo('/moments');
  };
  return (
    <Screen
      header={<Header />}
      testID="screen-done"
      actions={
        <>
          <Button label={t('done')} onPress={home} testID="done-home" />
          {saved ? <Button kind="plain" label={t('view_moments')} onPress={moments} testID="view-moments" /> : null}
        </>
      }
    >
      <Hero source={SCENES.done} />
      <Heading center>{t('closing_title')}</Heading>
      <Lead center>{t('closing_sub')}</Lead>
      {saved ? (
        <Txt v="secondary" muted center testID="saved-ok">
          {t('saved_ok')}
        </Txt>
      ) : null}
    </Screen>
  );
}
