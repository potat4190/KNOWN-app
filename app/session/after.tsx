/** After, step 4: Keep / Reach out / Sit a little longer, or Finish for now (nothing saved). */
import { router } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Heading, Lead, Tile } from '@/components/bits';
import { useT } from '@/i18n';
import { useSession, discardPaused } from '@/state/session-store';
import { goSession, leaveTo, useSessionScreen } from '@/state/nav';
import { TourTarget } from '@/features/tour/TourTarget';
import { useTips } from '@/features/tour/TourProvider';

export default function After() {
  const s = useSessionScreen('after');
  const { t } = useT();
  useTips('after', ['after_tiles', 'header_x']);
  if (!s) return null;
  const finish = async () => {
    await discardPaused();
    useSession.getState().end();
    leaveTo('/done');
  };
  return (
    <Screen
      header={<Header inSession step={4} onBack={() => router.back()} />}
      testID="screen-after"
      actions={<Button kind="soft" label={t('a_finish')} onPress={finish} testID="finish" />}
    >
      <Heading>{t('respond_title')}</Heading>
      <Lead>{t('after_sub')}</Lead>
      <TourTarget id="after_tiles">
        <View style={{ gap: 10 }}>
          <Tile icon="keep" title={t('a_keep')} sub={t('a_keep_d')} onPress={() => goSession('keep')} testID="a-keep" />
          <Tile
            icon="reach"
            title={t('a_reach')}
            sub={t('a_reach_d')}
            onPress={() => goSession('reach')}
            testID="a-reach"
          />
          <Tile icon="sit" title={t('a_sit')} sub={t('a_sit_d')} onPress={() => goSession('sit')} testID="a-sit" />
        </View>
      </TourTarget>
    </Screen>
  );
}
