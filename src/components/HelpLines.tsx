/**
 * Help lines (Design Lab helpLines(full)). The order is the safety floor:
 *  1. findahelpline.com (finds lines in her country), always first
 *  2. her local emergency number (a verified number for her region, else generic text)
 *  3. US services: 988 (call/text) and 911
 *  4. (full) a copyable message for her community guide
 *  5. (full) her school
 * Every number and link comes from src/config/help-lines.ts.
 */
import { Linking, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import { getLocales } from 'expo-localization';
import { useState } from 'react';
import { HELP_LINES, localEmergencyFor } from '@/config/help-lines';
import { useT } from '@/i18n';
import { useTheme } from '@/theme';
import { Card, StatusLine } from './bits';
import { Button } from './Button';
import { Txt } from './Txt';

function Line({ title, desc, children }: { title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <Card>
      <Txt v="body" weight="bold">
        {title}
      </Txt>
      {desc ? (
        <Txt v="secondary" muted>
          {desc}
        </Txt>
      ) : null}
      {children}
    </Card>
  );
}

function Num({ value }: { value: string }) {
  return (
    <Txt v="h2" selectable ltr accessibilityLabel={value.split('').join(' ')}>
      {value}
    </Txt>
  );
}

export function HelpLines({ full }: { full?: boolean }) {
  const { t } = useT();
  const { c } = useTheme();
  const [status, setStatus] = useState('');
  const region = getLocales()[0]?.regionCode ?? null;
  const local = localEmergencyFor(region);
  const call = (kind: 'tel' | 'sms', v: string) => void Linking.openURL(`${kind}:${v}`);
  return (
    <View style={{ gap: 12 }} testID="help-lines">
      <Line title={t('help_world_t')} desc={t('help_world_d')}>
        <Button
          kind="soft"
          label={`${t('help_open')} ↗`}
          onPress={() => void WebBrowser.openBrowserAsync(HELP_LINES.findahelpline.value)}
          testID="help-findahelpline"
        />
      </Line>
      <Line title={t('help_local')} desc={t('help_local_d')}>
        {local ? (
          <View style={{ gap: 8 }}>
            <Num value={local.value} />
            <Button kind="soft" label={t('help_call')} onPress={() => call('tel', local.value)} />
          </View>
        ) : null}
      </Line>
      <Line title={t('help_988')} desc={`${t('help_us')} ${t('help_988_d')}`}>
        <Num value={HELP_LINES.us988Call.value} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            kind="soft"
            label={t('help_call')}
            onPress={() => call('tel', HELP_LINES.us988Call.value)}
            style={{ flex: 1 }}
          />
          <Button
            kind="soft"
            label={t('help_text')}
            onPress={() => call('sms', HELP_LINES.us988Text.value)}
            style={{ flex: 1 }}
          />
        </View>
        <Txt v="secondary" muted>
          {t('help_911')} · {t('help_911_d')}
        </Txt>
        <Button
          kind="plain"
          label={`${t('help_call')} ${HELP_LINES.us911.value}`}
          onPress={() => call('tel', HELP_LINES.us911.value)}
        />
      </Line>
      {full ? (
        <>
          <Line title={t('help_guide_t')}>
            <View style={{ backgroundColor: c.warm, borderRadius: 12, padding: 12 }}>
              <Txt v="body" selectable>
                {t('help_msg')}
              </Txt>
            </View>
            <Button
              kind="plain"
              label={t('share_copy')}
              onPress={async () => {
                await Clipboard.setStringAsync(t('help_msg'));
                setStatus(t('copied'));
              }}
              testID="help-copy"
            />
            <StatusLine text={status} />
          </Line>
          <Line title={t('help_school')} desc={t('help_school_d')} />
        </>
      ) : null}
    </View>
  );
}
