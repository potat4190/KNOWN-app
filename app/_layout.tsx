/**
 * Root: GestureHandlerRootView > YouVersionProvider > Theme > (i18n via prefs) > DB > sheets > Stack,
 * plus the session sheets, the judge-panel tab and the app-switcher privacy cover.
 */
import { useEffect, useState } from 'react';
import { AppState, View, type AppStateStatus } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { YouVersionProvider } from '@youversion/platform-react-native-expo-ui';
import { NotoSansMyanmar_400Regular } from '@expo-google-fonts/noto-sans-myanmar/400Regular';
import { NotoSansMyanmar_700Bold } from '@expo-google-fonts/noto-sans-myanmar/700Bold';
import { NotoSansArabic_400Regular } from '@expo-google-fonts/noto-sans-arabic/400Regular';
import { NotoSansArabic_700Bold } from '@expo-google-fonts/noto-sans-arabic/700Bold';
import { NotoNaskhArabic_400Regular } from '@expo-google-fonts/noto-naskh-arabic/400Regular';
import { NotoNaskhArabic_700Bold } from '@expo-google-fonts/noto-naskh-arabic/700Bold';
import { YOUVERSION_APP_KEY } from '@/config/flags';
import { ThemeProvider, useTheme } from '@/theme';
import { SerifGate } from '@/theme/SerifGate';
import { usePrefs } from '@/state/prefs';
import { openStore } from '@/data/store';
import { cleanupPaused } from '@/state/session-store';
import { syncDirection } from '@/i18n';
import { LANG_INFO } from '@/i18n/langs';
import { SheetHost } from '@/features/sheets/SheetHost';
import { PanelTab } from '@/features/panel/PanelTab';
import { TourProvider } from '@/features/tour/TourProvider';
import { MusicHost } from '@/services/music/MusicHost';
import { LampGlow } from '@/components/Lamp';

void SplashScreen.preventAutoHideAsync().catch(() => {});

/** When KNOWN leaves the foreground, cover the screen so the app switcher doesn't show her words. */
function PrivacyCover() {
  const { c } = useTheme();
  const [state, setState] = useState<AppStateStatus>(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', setState);
    return () => sub.remove();
  }, []);
  if (state === 'active') return null;
  return (
    <View
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: c.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      accessibilityElementsHidden
    >
      <LampGlow size={140} />
    </View>
  );
}

function Shell() {
  const { c, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="language" options={{ gestureEnabled: false }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="session" options={{ gestureEnabled: false }} />
        <Stack.Screen name="done" options={{ gestureEnabled: false }} />
        <Stack.Screen name="paused" options={{ gestureEnabled: false }} />
        <Stack.Screen name="moment/[id]" />
        <Stack.Screen name="help" options={{ presentation: 'modal' }} />
        <Stack.Screen name="reader" options={{ presentation: 'modal' }} />
        <Stack.Screen name="panel" options={{ presentation: 'modal' }} />
      </Stack>
      <SheetHost />
      <PanelTab />
      <PrivacyCover />
    </>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const theme = usePrefs((p) => p.theme);
  const lang = usePrefs((p) => p.lang) ?? 'en';
  const [fontsLoaded, fontError] = useFonts({
    NotoSansMyanmar_400Regular,
    NotoSansMyanmar_700Bold,
    NotoSansArabic_400Regular,
    NotoSansArabic_700Bold,
    NotoNaskhArabic_400Regular,
    NotoNaskhArabic_700Bold,
  });

  useEffect(() => {
    syncDirection();
    // Open the encrypted DB, then the paused-moment cleanup that runs on every launch (8.7).
    void openStore()
      .then(() => cleanupPaused())
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready && (fontsLoaded || fontError)) void SplashScreen.hideAsync().catch(() => {});
  }, [ready, fontsLoaded, fontError]);

  if (!ready || !(fontsLoaded || fontError)) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <YouVersionProvider appKey={YOUVERSION_APP_KEY} theme={theme} locale={LANG_INFO[lang].tag}>
          <SerifGate>
            <ThemeProvider>
              <BottomSheetModalProvider>
                <TourProvider>
                  <MusicHost />
                  <Shell />
                </TourProvider>
              </BottomSheetModalProvider>
            </ThemeProvider>
          </SerifGate>
        </YouVersionProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
