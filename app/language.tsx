/** First run: choose a language. The prompt appears in all five languages (as in the Design Lab). */
import { router } from 'expo-router';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button } from '@/components/Button';
import { Heading } from '@/components/bits';
import { Txt } from '@/components/Txt';
import { Mark } from '@/components/Header';
import { LANGS, LANG_INFO, type Lang } from '@/i18n/langs';
import { applyLanguage } from '@/i18n';
import { usePrefs } from '@/state/prefs';

export default function LanguageScreen() {
  const choose = async (lang: Lang) => {
    // First run: switching to Arabic reloads once to apply right-to-left.
    const reloading = await applyLanguage(lang);
    if (reloading) return;
    router.replace(usePrefs.getState().tourDone ? '/' : '/onboarding');
  };
  return (
    <Screen testID="screen-language">
      <View style={{ paddingTop: 24 }}>
        <Mark />
      </View>
      <Heading>Choose your language</Heading>
      <Txt v="body" muted>
        ဘာသာစကား ရွေးပါ · 选择语言 · 言語を選んでください ·{' '}
        <Txt v="body" muted lang="ar">
          اختر لغتك
        </Txt>
      </Txt>
      <View style={{ gap: 10 }}>
        {LANGS.map((l) => (
          <Button key={l} kind="soft" label={LANG_INFO[l].name} onPress={() => choose(l)} testID={`lang-${l}`} />
        ))}
      </View>
    </Screen>
  );
}
