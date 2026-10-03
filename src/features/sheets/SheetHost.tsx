/**
 * The session sheets: Exit ("Stop for now?"), Doesn't-fit, Recover, and the
 * Delete-everything confirmation reached from the Exit sheet.
 */
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Sheet } from '@/components/Sheet';
import { Button } from '@/components/Button';
import { InlineConfirm, Lead, Tile } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { P, ref, sceneOf, type PathKey } from '@/lib/content';
import { useUi } from '@/state/ui';
import { usePrefs } from '@/state/prefs';
import {
  daysLeft,
  deleteEverything,
  discardPaused,
  loadPaused,
  pauseSession,
  resumePaused,
  useSession,
} from '@/state/session-store';
import { beginSession, leaveTo, restoreStack } from '@/state/nav';
import * as S from '@/state/session';

function ExitSheet() {
  const { t, lang } = useT();
  const { c } = useTheme();
  const close = useUi((u) => u.closeSheet);
  const s = useSession((x) => x.s);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const pause = async () => {
    close();
    await pauseSession();
    leaveTo('/paused');
  };
  const endNow = async () => {
    close();
    await discardPaused();
    useSession.getState().end();
    leaveTo('/');
  };
  const end = () => (s && S.hasTyped(s, lang) ? setConfirmEnd(true) : void endNow());
  const clearAll = async () => {
    close();
    await deleteEverything();
    leaveTo('/');
  };

  return (
    <>
      <Lead>{t('exit_sub')}</Lead>
      <Tile icon="pause" title={t('exit_save')} sub={t('exit_save_d')} onPress={pause} testID="exit-save" />
      <Tile icon="end" title={t('exit_end')} onPress={end} testID="exit-end" />
      {confirmEnd ? (
        <InlineConfirm
          question={t('discard_q')}
          yes={t('discard_yes')}
          no={t('exit_stay')}
          onYes={endNow}
          onNo={() => setConfirmEnd(false)}
          testID="discard-confirm"
        />
      ) : null}
      <Button label={t('exit_stay')} onPress={close} testID="exit-stay" />
      {confirmClear ? (
        <InlineConfirm
          question={t('clear_q')}
          yes={t('clear_yes')}
          no={t('cancel')}
          danger
          onYes={clearAll}
          onNo={() => setConfirmClear(false)}
          testID="exit-clear-confirm"
        />
      ) : (
        <Pressable
          onPress={() => setConfirmClear(true)}
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: 'center' }}
          testID="exit-clear"
        >
          <Txt v="secondary" weight="bold" color={c.danger} center>
            {t('clear_all')}
          </Txt>
        </Pressable>
      )}
    </>
  );
}

function NoFitSheet() {
  const { t, lang } = useT();
  const { c, radius } = useTheme();
  const close = useUi((u) => u.closeSheet);
  const s = useSession((x) => x.s);
  const [pending, setPending] = useState<{ kind: 'swap'; path: PathKey } | { kind: 'repick' } | null>(null);
  if (!s || !s.path) return null;
  const { person, psalms } = S.noFitOptions(s);

  const doSwap = (path: PathKey) => {
    useSession.getState().update((x) => S.swap(x, path));
    close();
  };
  const doRepick = () => {
    useSession.getState().update(S.repick);
    close();
    router.dismissTo('/session/feel');
  };
  // Never throw away a prayer she typed without asking.
  const ask = (a: NonNullable<typeof pending>) =>
    S.prayerEdited(s, lang) ? setPending(a) : a.kind === 'swap' ? doSwap(a.path) : doRepick();

  return (
    <>
      <Lead>{t('nofit_sub')}</Lead>
      {pending ? (
        <InlineConfirm
          question={t('replace_prayer_q')}
          yes={t('replace_prayer_yes')}
          no={t('nofit_stay')}
          onYes={() => (pending.kind === 'swap' ? doSwap(pending.path) : doRepick())}
          onNo={() => setPending(null)}
          testID="swap-confirm"
        />
      ) : null}
      {person ? (
        <Tile
          face={sceneOf(person)}
          title={t('nofit_other', { name: P(person, 'name', lang) })}
          sub={P(person, 'title', lang)}
          onPress={() => ask({ kind: 'swap', path: person })}
          testID="nofit-person"
        />
      ) : null}
      {psalms.length ? (
        <View style={{ gap: 8 }}>
          <Txt v="secondary" weight="bold" muted>
            {t('lament_head')}
          </Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {psalms.map((k) => (
              <Pressable
                key={k}
                onPress={() => ask({ kind: 'swap', path: k })}
                accessibilityRole="button"
                testID={`nofit-${k}`}
                style={{
                  width: '48.5%',
                  minHeight: 64,
                  padding: 12,
                  borderRadius: radius.card,
                  borderWidth: 1,
                  borderColor: c.border,
                  backgroundColor: c.surface,
                  gap: 2,
                }}
              >
                <Txt v="secondary" weight="bold">
                  {P(k, 'title', lang)}
                </Txt>
                <Txt v="footnote" muted>
                  {ref(k, lang)}
                </Txt>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      {s.from === 'pics' ? (
        <Tile icon="pics" title={t('nofit_pictures')} onPress={() => ask({ kind: 'repick' })} testID="nofit-pictures" />
      ) : null}
      <Button label={t('nofit_stay')} onPress={close} testID="nofit-stay" />
    </>
  );
}

function RecoverSheet() {
  const { t, tc } = useT();
  const close = useUi((u) => u.closeSheet);
  const [info, setInfo] = useState<{ step: string; days: number } | null>(null);
  useEffect(() => {
    void loadPaused().then((p) => {
      if (!p) return close();
      setInfo({ step: t(S.stepNameFor(p.hist?.[p.hist.length - 1] ?? p.state.screen)), days: daysLeft(p.ts) });
    });
  }, [close, t]);
  if (!info) return null;
  const resume = async () => {
    const stack = await resumePaused();
    close();
    if (stack) restoreStack(stack);
  };
  const fresh = async () => {
    await discardPaused();
    close();
    beginSession(false);
  };
  return (
    <>
      <Lead>
        {t('recover_where2', { step: info.step })} {tc('removes_n', info.days)}
      </Lead>
      <Button label={t('recover_continue')} onPress={resume} testID="recover-continue" />
      <Button kind="plain" label={t('recover_new')} onPress={fresh} testID="recover-new" />
      <Txt v="secondary" muted>
        {t('recover_note2')}
      </Txt>
    </>
  );
}

export function SheetHost() {
  const sheet = useUi((u) => u.sheet);
  const close = useUi((u) => u.closeSheet);
  const lang = usePrefs((p) => p.lang);
  const { t } = useT();
  if (!lang) return null;
  return (
    <>
      <Sheet open={sheet === 'exit'} onClose={close} title={t('exit_title')} testID="sheet-exit">
        {sheet === 'exit' ? <ExitSheet /> : null}
      </Sheet>
      <Sheet open={sheet === 'nofit'} onClose={close} title={t('nofit_title')} testID="sheet-nofit">
        {sheet === 'nofit' ? <NoFitSheet /> : null}
      </Sheet>
      <Sheet
        open={sheet === 'recover'}
        onClose={() => {}}
        locked
        eyebrow={t('recover_eyebrow')}
        title={t('recover_title')}
        testID="sheet-recover"
      >
        {sheet === 'recover' ? <RecoverSheet /> : null}
      </Sheet>
    </>
  );
}
