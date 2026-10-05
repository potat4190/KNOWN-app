/**
 * More: Settings, Help, About, Show me around again. Every control here works
 * or isn't shown (Bible version only with a working YouVersion key; music only
 * when a track is configured; the judge-panel switch only in dev/preview).
 */
import { useState } from 'react';
import { Pressable, Switch, View } from 'react-native';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import { BibleVersionSheet } from '@/components/BibleVersionSheet';
import { Screen } from '@/components/Screen';
import { Header } from '@/components/Header';
import { Button } from '@/components/Button';
import { Card, Heading, InlineConfirm, Segmented, StatusLine, Tile } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { applyLanguage, needsDirectionReload, useT } from '@/i18n';
import { useTheme } from '@/theme';
import { LANGS, LANG_INFO, type Lang } from '@/i18n/langs';
import { usePrefs, type ThemePref } from '@/state/prefs';
import { deleteEverything } from '@/state/session-store';
import { SHOW_PANEL_TOGGLE, VARIANT } from '@/config/flags';
import { BIBLE_VERSIONS } from '@/config/bible-versions';
import { VERSIONS } from '@/lib/content';
import { anyMusicConfigured } from '@/services/music/resolve';
import { useYvKeyOk } from '@/services/scripture/useYvKey';
import { fetchVersionMeta } from '@/services/scripture/useScripture';
import { resetTour } from '@/features/tour/TourProvider';

function Row({
  label,
  desc,
  value,
  onChange,
  testID,
}: {
  label: string;
  desc?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  testID?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}>
      <View style={{ flex: 1 }}>
        <Txt v="body" weight="bold">
          {label}
        </Txt>
        {desc ? (
          <Txt v="secondary" muted>
            {desc}
          </Txt>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        accessibilityLabel={label}
        testID={testID}
        trackColor={{ true: c.lamp, false: c.border }}
        thumbColor="#fff"
      />
    </View>
  );
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ gap: 10 }}>
    <Txt v="secondary" weight="bold" muted>
      {title}
    </Txt>
    {children}
  </View>
);

export default function More() {
  const { t, lang } = useT();
  const p = usePrefs();
  const yvOk = useYvKeyOk();
  const [rtlFor, setRtlFor] = useState<Lang | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [picker, setPicker] = useState(false);
  const [status, setStatus] = useState('');
  const { scheme, c } = useTheme();

  const pickLang = (l: Lang) => {
    if (l === lang) return;
    if (needsDirectionReload(l)) setRtlFor(l);
    else void applyLanguage(l);
  };
  // Her choice is kept per app language (team decision 2026-10-04).
  const currentVersion = p.yvVersions[lang] ?? BIBLE_VERSIONS[lang];

  return (
    <Screen header={<Header hideGear />} testID="screen-more">
      <Heading>{t('settings')}</Heading>

      <Section title={t('lang_label')}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LANGS.map((l) => (
            <Button
              key={l}
              kind={l === lang ? 'primary' : 'soft'}
              small
              label={LANG_INFO[l].name}
              onPress={() => pickLang(l)}
              style={{ alignSelf: 'auto', minWidth: 96 }}
              accessibilityState={{ selected: l === lang }}
              testID={`set-lang-${l}`}
            />
          ))}
        </View>
        {rtlFor ? (
          <InlineConfirm
            question={t('rtl_restart_q')}
            yes={t('rtl_restart_yes')}
            no={t('cancel')}
            onYes={() => void applyLanguage(rtlFor)}
            onNo={() => setRtlFor(null)}
            testID="rtl-confirm"
          />
        ) : null}
      </Section>

      <Section title={t('theme_label')}>
        <Segmented<ThemePref>
          label={t('theme_label')}
          value={p.theme}
          onChange={(v) => p.set({ theme: v })}
          items={[
            { key: 'system', label: t('theme_sys') },
            { key: 'light', label: t('theme_light') },
            { key: 'dark', label: t('theme_dark') },
          ]}
        />
      </Section>

      {yvOk ? (
        <Section title={t('bible_version')}>
          <Tile
            title={currentVersion ? currentVersion.abbr : t('bible_version_builtin')}
            sub={t('bible_version_d')}
            icon="keep"
            onPress={() => setPicker(true)}
            testID="bible-version"
          />
          <BibleVersionSheet
            isOpen={picker}
            onClose={() => setPicker(false)}
            versionId={currentVersion?.id}
            theme={scheme}
            onSelect={async (id) => {
              setPicker(false);
              const meta = await fetchVersionMeta(id).catch(() => null);
              const yvVersions = usePrefs.getState().yvVersions;
              p.set({ yvVersions: { ...yvVersions, [lang]: { id, abbr: meta?.abbr || String(id) } } });
            }}
          />
        </Section>
      ) : null}

      {anyMusicConfigured() ? (
        <Row
          label={t('music_label')}
          desc={t('music_d')}
          value={p.musicOn}
          onChange={(v) => p.set({ musicOn: v })}
          testID="music-switch"
        />
      ) : null}

      <Section title={t('about_label')}>
        <Tile
          title={t('tour_again')}
          icon="spark"
          onPress={() => {
            resetTour();
            router.push('/onboarding');
          }}
          testID="tour-again"
        />
        <Row label={t('tips_label')} value={p.tipsOn} onChange={(v) => p.set({ tipsOn: v })} testID="tips-switch" />
        <StatusLine text={status} />
      </Section>

      {SHOW_PANEL_TOGGLE ? (
        <Row
          label={t('panel_label')}
          desc={t('panel_d')}
          value={p.panelOn}
          // Off leaves no trace of the panel, including a fast-forwarded clock.
          onChange={(v) => p.set(v ? { panelOn: true } : { panelOn: false, clockOffset: 0 })}
          testID="panel-switch"
        />
      ) : null}

      <Tile title={t('help_title')} icon="help" onPress={() => router.push('/help')} testID="more-help" />

      <Card>
        <Txt v="secondary" weight="bold">
          {t('sources_label')}
        </Txt>
        {(Object.keys(VERSIONS) as Lang[]).map((l) => (
          <Txt key={l} v="footnote" muted lang={l}>
            {VERSIONS[l].abbr}: {VERSIONS[l].name}
          </Txt>
        ))}
        {yvOk ? (
          <Txt v="footnote" muted>
            YouVersion Platform
          </Txt>
        ) : null}
        <Txt v="secondary" weight="bold" style={{ marginTop: 8 }}>
          {t('credits_label')}
        </Txt>
        <Txt v="footnote" muted>
          {t('credits_body')}
        </Txt>
        <Txt v="footnote" muted style={{ marginTop: 8 }} lang="en">
          {t('version_label')} {Constants.expoConfig?.version ?? ''}
          {VARIANT !== 'production' ? ` (${VARIANT})` : ''}
        </Txt>
      </Card>

      {confirmClear ? (
        <InlineConfirm
          question={t('clear_q')}
          yes={t('clear_yes')}
          no={t('cancel')}
          danger
          onYes={async () => {
            await deleteEverything();
            setConfirmClear(false);
            setStatus(t('clear_done'));
          }}
          onNo={() => setConfirmClear(false)}
          testID="clear-confirm"
        />
      ) : (
        <Pressable
          onPress={() => setConfirmClear(true)}
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: 'center' }}
          testID="clear-all"
        >
          <Txt v="secondary" weight="bold" color={c.danger}>
            {t('clear_all')}
          </Txt>
        </Pressable>
      )}
    </Screen>
  );
}
