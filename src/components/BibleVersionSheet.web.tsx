/**
 * WEB ONLY. Settings → Bible version. The YouVersion SDK's BibleVersionPickerSheet returns
 * null in a browser (its sheet is native), which would leave a Settings row that does nothing.
 * On the phone that sheet shows YouVersion's browser picker inside a native bottom sheet; this
 * shows the same picker, put together the same way as the SDK's picker content
 * (dom/bible-version-picker-content), in a sheet drawn like the SDK's: grabber, "Cancel",
 * YouVersion's title, 78% of the screen tall, YouVersion's own colours.
 */
import { useState } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import {
  BibleLanguagePickerContent,
  BibleVersionPicker,
  BibleVersionPickerLanguageTrigger,
  YouVersionProvider,
} from '@youversion/platform-react-ui';
import { getTokens, type BibleVersionPickerSheetProps } from '@youversion/platform-react-native-expo-ui';
import { YOUVERSION_APP_KEY } from '@/config/flags';
import { WEB_COLUMN } from '@/config/web-layout';
import { useT } from '@/i18n';
import { LANG_INFO } from '@/i18n/langs';

type Props = Pick<BibleVersionPickerSheetProps, 'isOpen' | 'onClose' | 'versionId' | 'theme' | 'onSelect'>;

// YouVersion's own sheet header strings (SDK i18n). The SDK has no Japanese or Burmese
// strings and shows English there, so this does too.
const HEADER = {
  en: { cancel: 'Cancel', title: 'Bible Versions' },
  ar: { cancel: 'إلغاء', title: 'إصدارات الكتاب المقدس' },
  zh: { cancel: '取消', title: '聖經譯本' },
} as const;

// The SDK's sheet handle colours (palette gray20 / gray30, not exported).
const HANDLE = { light: '#bfbdbd', dark: '#636161' } as const;

// The SDK's shell styles for the picker, sized to this sheet instead of a WebView viewport.
const SHELL_CSS = `
[data-yv-version-picker-shell] {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--yv-background);
  color: var(--yv-foreground);
}
[data-yv-version-picker-shell] > * { min-height: 0; height: 100%; }
[data-yv-version-picker-shell] [data-yv-bible-language-picker],
[data-yv-version-picker-shell] [data-yv-bible-version-picker] { height: 100%; min-height: 0; }
[data-yv-version-picker-shell] [data-yv-bible-version-picker] > div,
[data-yv-version-picker-shell] [data-yv-bible-version-picker] [data-yv-sdk],
[data-yv-version-picker-shell] [data-yv-bible-language-picker] [data-yv-sdk] { min-height: 0; height: 100%; }
[data-yv-version-picker-shell] section:has([data-slot="input-group"]) { flex: 0 0 auto; padding-bottom: 1rem; }
`;

// The SDK's panel switch between the version list and the language list.
const PANEL = 'yv:min-h-0 yv:h-full yv:transition-all yv:duration-300 yv:ease-out yv:motion-reduce:transition-none';
const SHOWN = 'yv:grow yv:opacity-100 yv:pointer-events-auto yv:blur-none yv:scale-100';
const HIDDEN = 'yv:shrink yv:opacity-0 yv:pointer-events-none yv:blur-sm yv:scale-95';
const panelClass = (languages: boolean, panel: 'version' | 'language') =>
  panel === 'version'
    ? `${PANEL} ${languages ? HIDDEN : SHOWN}`
    : `${PANEL} yv:absolute yv:inset-0 ${languages ? SHOWN : HIDDEN}`;

function Picker({ versionId, scheme, locale, onPick }: {
  versionId: number;
  scheme: 'light' | 'dark';
  locale: string;
  onPick: (id: number) => void;
}) {
  const [languages, setLanguages] = useState(false);
  return (
    <YouVersionProvider appKey={YOUVERSION_APP_KEY} theme={scheme} locale={locale}>
      <style>{SHELL_CSS}</style>
      <div data-yv-sdk data-yv-theme={scheme} data-yv-version-picker-shell style={{ height: '100%' }}>
        <BibleVersionPicker.Root versionId={versionId} onVersionChange={onPick} background={scheme}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', height: '100%' }}>
            <div style={{ display: 'grid', gridTemplateRows: '1fr' }} className="yv:relative yv:min-h-0 yv:overflow-hidden">
              <div data-yv-bible-version-picker className={panelClass(languages, 'version')}>
                <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%', minHeight: 0 }}>
                  <div style={{ paddingTop: '1rem', paddingInline: '1rem', display: 'flex', justifyContent: 'end' }}>
                    <BibleVersionPickerLanguageTrigger
                      onClick={(e: { preventDefault: () => void }) => {
                        e.preventDefault();
                        setLanguages(true);
                      }}
                    />
                  </div>
                  <BibleVersionPicker.Content open />
                </div>
              </div>
              <div data-yv-bible-language-picker className={panelClass(languages, 'language')}>
                <BibleLanguagePickerContent open onRequestClose={() => setLanguages(false)} />
              </div>
            </div>
          </div>
        </BibleVersionPicker.Root>
      </div>
    </YouVersionProvider>
  );
}

export function BibleVersionSheet({ isOpen, onClose, versionId = 3034, theme, onSelect }: Props) {
  const { height } = useWindowDimensions();
  const { lang } = useT();
  const scheme = theme === 'dark' ? 'dark' : 'light';
  const tokens = getTokens(scheme);
  const header = HEADER[lang as keyof typeof HEADER] ?? HEADER.en;
  const pick = async (id: number) => {
    try {
      await onSelect?.(id);
    } catch {
      return;
    }
    onClose();
  };
  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable
          onPress={onClose}
          accessibilityElementsHidden
          style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)' }}
        />
        <View
          accessibilityViewIsModal
          testID="bible-version-sheet"
          style={{
            width: '100%',
            maxWidth: WEB_COLUMN,
            alignSelf: 'center',
            backgroundColor: tokens.background,
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            overflow: 'hidden',
          }}
        >
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <View style={{ width: 30, height: 4, borderRadius: 4, backgroundColor: HANDLE[scheme] }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 16, paddingHorizontal: 16 }}>
            <Pressable onPress={onClose} accessibilityRole="button" style={{ flex: 1 }} testID="bible-version-cancel">
              <Text style={{ color: scheme === 'dark' ? 'white' : 'black', fontSize: 16 }}>{header.cancel}</Text>
            </Pressable>
            <Text
              accessibilityRole="header"
              style={{ color: scheme === 'dark' ? 'white' : 'black', fontSize: 16, fontWeight: 'bold' }}
            >
              {header.title}
            </Text>
            <View style={{ flex: 1 }} />
          </View>
          <View style={{ width: '100%', height: Math.round(height * 0.78) }}>
            {isOpen ? (
              <Picker versionId={versionId} scheme={scheme} locale={LANG_INFO[lang].tag} onPick={(id) => void pick(id)} />
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}
