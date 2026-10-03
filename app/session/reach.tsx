/**
 * Reach out, step 4. She chooses who and what it says; KNOWN never sends
 * anything for her (copy, or the system share sheet). Translate (with a
 * back-translation to check the meaning) appears only when a relay is set.
 */
import { useState } from 'react';
import { Pressable, Share, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Card, Chip, Heading, Lead, StatusLine } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { Icon } from '@/components/Icon';
import { useT } from '@/i18n';
import { useMsgText } from '@/state/useMsgText';
import { useTheme } from '@/theme';
import { LANGS, LANG_INFO, type Lang } from '@/i18n/langs';
import { useSession } from '@/state/session-store';
import { useSessionScreen } from '@/state/nav';
import { translateMessage } from '@/services/matcher/matcher';
import { relayAvailable, relayDeps } from '@/services/matcher/deps';
import * as S from '@/state/session';

export default function Reach() {
  const s = useSessionScreen('reach');
  const update = useSession((x) => x.update);
  const { t, lang } = useT();
  const { c, radius, type } = useTheme();
  const text = useMsgText();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  if (!s) return null;
  const m = s.msg;
  const reader = m.lang;
  const needsTr = reader !== lang;
  const canTranslate = relayAvailable();
  const tr = m.tr && m.trFor === `${reader}|${text}` ? m.tr : null;

  const copy = async (v: string) => {
    await Clipboard.setStringAsync(v);
    setStatus(t('copied'));
  };
  const share = async () => {
    try {
      await Share.share({ message: tr ? tr.translation : text });
    } catch {
      // She closed the sheet; nothing was sent.
    }
  };
  const translate = async () => {
    setBusy(true);
    setStatus('');
    try {
      const r = await translateMessage(text, lang, reader, relayDeps());
      update((x) => ({ ...x, msg: { ...x.msg, tr: r, trFor: `${reader}|${text}` } }));
    } catch {
      setStatus(t('tr_off'));
    }
    setBusy(false);
  };

  return (
    <Screen
      header={<Header inSession step={4} onBack={() => router.back()} />}
      testID="screen-reach"
      actions={
        <>
          {needsTr && tr ? (
            <Button label={t('copy_tr')} onPress={() => copy(tr.translation)} testID="copy-tr" />
          ) : (
            <Button label={t('share_copy')} onPress={() => copy(text)} testID="copy-msg" />
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {needsTr && tr ? <Button kind="plain" label={t('share_copy')} onPress={() => copy(text)} /> : null}
            <Button kind="plain" label={t('share_sheet')} onPress={share} testID="share" />
          </View>
        </>
      }
    >
      <Heading>{t('reach_title')}</Heading>
      <Lead>{t('reach_sub')}</Lead>

      <Txt v="secondary" weight="bold">
        {t('to')}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip
          label={t('to_guide')}
          on={m.to === 'guide'}
          onPress={() => update((x) => ({ ...x, msg: { ...x.msg, to: 'guide' } }))}
          testID="to-guide"
        />
        <Chip
          label={t('to_friend')}
          on={m.to === 'friend'}
          onPress={() => update((x) => ({ ...x, msg: { ...x.msg, to: 'friend' } }))}
          testID="to-friend"
        />
      </View>

      <Txt v="secondary" weight="bold">
        {t('need')}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(['listen', 'pray', 'time'] as const).map((n) => (
          <Chip
            key={n}
            label={t(`n_${n}`)}
            on={m.need === n}
            onPress={() => update((x) => S.setNeed(x, n))}
            testID={`need-${n}`}
          />
        ))}
      </View>

      <Txt v="secondary" weight="bold" nativeID="msg-label">
        {t('msg_label')}
      </Txt>
      <TextInput
        testID="msg-input"
        accessibilityLabel={t('msg_label')}
        value={text}
        onChangeText={(v) => update((x) => S.setMsgText(x, v))}
        multiline
        style={{
          ...type('body'),
          color: c.text,
          minHeight: 140,
          padding: 14,
          textAlignVertical: 'top',
          borderRadius: radius.card,
          borderWidth: 1.5,
          borderColor: c.border,
          backgroundColor: c.surface,
        }}
      />
      {m.edited ? (
        <Txt v="secondary" muted>
          {t('edits_kept')}
        </Txt>
      ) : null}

      <Txt v="secondary" weight="bold">
        {t('reads_in')}
      </Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }} accessibilityRole="radiogroup">
        {LANGS.map((l: Lang) => (
          <Chip
            key={l}
            label={LANG_INFO[l].name}
            on={reader === l}
            onPress={() => update((x) => ({ ...x, msg: { ...x.msg, lang: l } }))}
            testID={`reader-${l}`}
          />
        ))}
      </View>

      {needsTr ? (
        tr ? (
          <View style={{ gap: 10 }}>
            <Card tone="warm">
              <Txt v="footnote" weight="bold" color={c.lampInk}>
                {t('tr_label', { lang: LANG_INFO[reader].name })}
              </Txt>
              <Txt v="body" lang={reader} selectable testID="translation">
                {tr.translation}
              </Txt>
            </Card>
            <Card>
              <Txt v="footnote" weight="bold" color={c.lampInk}>
                {t('back_check', { lang: LANG_INFO[lang].name })}
              </Txt>
              <Txt v="body" testID="back-translation">
                {tr.back}
              </Txt>
            </Card>
          </View>
        ) : canTranslate ? (
          <View style={{ gap: 8 }}>
            <Button
              kind="soft"
              label={t(busy ? 'translating' : 'translate')}
              disabled={busy}
              onPress={translate}
              testID="translate"
            />
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
              <Icon name="spark" size={18} color={c.lampInk} />
              <Txt v="secondary" muted style={{ flex: 1 }}>
                {t('tr_note')}
              </Txt>
            </View>
          </View>
        ) : (
          // No relay configured: no fake Translate button (critique), just the honest fallback.
          <Txt v="secondary" muted testID="tr-off">
            {t('tr_off')}
          </Txt>
        )
      ) : null}

      <StatusLine text={status} />
      <Txt v="secondary" muted>
        {t('share_note')}
      </Txt>
      <Pressable
        accessibilityRole="button"
        onPress={() => update(S.keepMsg)}
        disabled={m.keep}
        testID="keep-msg"
        style={{ minHeight: 44, justifyContent: 'center' }}
      >
        <Txt v="secondary" weight="bold" color={m.keep ? c.textMuted : c.text} center>
          {t(m.keep ? 'keep_msg_done' : 'keep_msg_btn')}
        </Txt>
      </Pressable>
      <Button kind="soft" label={t('back_choices')} onPress={() => router.back()} testID="back-choices" />
    </Screen>
  );
}
