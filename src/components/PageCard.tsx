/**
 * The Scripture page card (brief 5.3, 8.3): serif text with small bold
 * lamp-ink verse numbers, a soft amber glow at the top, a footer with the
 * reference (bold) and the edition, and two tool pills: "Read the full
 * passage" and "Open in YouVersion". The footer always says which edition is
 * shown, and the YouVersion pill opens exactly the version it names.
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { BibleTextView } from '@youversion/platform-react-native-expo-ui';
import { PASSAGES, range, ref, verseText, type PathKey } from '@/lib/content';
import { useTheme } from '@/theme';
import { useT } from '@/i18n';
import { localizeDigits, LANG_INFO } from '@/i18n/langs';
import { youVersionLink, type Resolved } from '@/services/scripture/scripture';
import { Txt } from './Txt';
import { LampGlow } from './Lamp';
import { TourTarget } from '@/features/tour/TourTarget';

function Pill({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  const { c, radius } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        minHeight: 44,
        paddingHorizontal: 14,
        borderRadius: radius.full,
        backgroundColor: c.fillMuted,
        justifyContent: 'center',
      }}
    >
      <Txt v="secondary" weight="bold" maxFontSizeMultiplier={1.5}>
        {label}
      </Txt>
    </Pressable>
  );
}

export function Skeleton({ lines = 4 }: { lines?: number }) {
  const { c } = useTheme();
  const { t } = useT();
  return (
    <View accessible accessibilityLabel={t('scripture_loading')} style={{ gap: 10, paddingVertical: 8 }}>
      {Array.from({ length: lines }, (_, i) => (
        <View
          key={i}
          style={{ height: 16, borderRadius: 8, backgroundColor: c.fillMuted, width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </View>
  );
}

export function BundledVerses({
  path,
  verses,
  textLang,
}: {
  path: PathKey;
  verses: number[];
  textLang: Parameters<typeof verseText>[2];
}) {
  const { c, type } = useTheme();
  const { lang } = useT();
  const ltr = LANG_INFO[lang].rtl && !LANG_INFO[textLang].rtl;
  return (
    <View style={{ gap: 10 }} accessibilityLanguage={LANG_INFO[textLang].tag}>
      {verses.map((v) => (
        <Txt key={v} v="scripture" lang={textLang} ltr={ltr}>
          <Txt v="footnote" weight="bold" color={c.lampInk} style={{ ...type('footnote', { weight: 'bold' }) }}>
            {localizeDigits(v, textLang)}{' '}
          </Txt>
          {verseText(path, v, textLang)}
        </Txt>
      ))}
    </View>
  );
}

export function PageCard({ path, resolved, testID }: { path: PathKey; resolved: Resolved | null; testID?: string }) {
  const { c, radius, scheme, textScale } = useTheme();
  const { t, lang } = useT();
  const [full, setFull] = useState(false);
  const p = PASSAGES[path];
  const verses = full ? range(p) : p.ex;
  const link = resolved ? youVersionLink(resolved, path) : null;

  const openYouVersion = () => {
    if (!link) return;
    if (link.inApp) router.push({ pathname: '/reader', params: { path, versionId: String(link.versionId) } });
    else void WebBrowser.openBrowserAsync(link.url);
  };

  return (
    <View
      testID={testID}
      style={{
        borderRadius: radius.card,
        backgroundColor: c.surface,
        borderWidth: 1,
        borderColor: c.border,
        overflow: 'hidden',
      }}
    >
      <View style={{ position: 'absolute', top: -70, alignSelf: 'center', opacity: 0.55 }} pointerEvents="none">
        <LampGlow size={180} opacity={0.6} />
      </View>
      <View style={{ padding: 18, gap: 14 }}>
        {!resolved ? (
          <Skeleton />
        ) : resolved.source === 'youversion' ? (
          <View style={{ gap: 4 }}>
            {(full ? resolved.full : resolved.excerpt).map((r) => (
              <BibleTextView
                key={r}
                reference={r}
                versionId={resolved.versionId}
                theme={scheme}
                fontSize={Math.round(20 * textScale)}
              />
            ))}
          </View>
        ) : (
          <BundledVerses path={path} verses={verses} textLang={resolved.textLang} />
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <Txt v="secondary" weight="bold">
            {ref(path, lang)}
          </Txt>
          <Txt v="secondary" muted testID="edition-abbr">
            {resolved ? resolved.abbr : ' '}
          </Txt>
        </View>
        {resolved?.source === 'youversion' && resolved.attribution ? (
          <Txt v="footnote" muted numberOfLines={4}>
            {resolved.attribution}
          </Txt>
        ) : null}
        {resolved?.source === 'bundled' && resolved.fallback ? (
          <Txt v="footnote" muted>
            {t('lang_fallback')}
          </Txt>
        ) : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <TourTarget id="scripture_full">
            <Pill label={t(full ? 'show_less' : 'read_full')} onPress={() => setFull((f) => !f)} testID="read-full" />
          </TourTarget>
          {link ? (
            <Pill
              testID="open-youversion"
              label={link.inApp ? t('yv_open') : t('yv_open_v', { abbr: link.abbr })}
              onPress={openYouVersion}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}
