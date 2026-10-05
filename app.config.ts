import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Build variants (brief section 15). APP_VARIANT = development | preview | production.
 * Bundle ids are provisional until the team settles publisher accounts (DECISIONS.md, 18.2 #12).
 */
type Variant = 'development' | 'preview' | 'production';
const variant = (process.env.APP_VARIANT as Variant) || 'development';

const BASE_ID = 'org.ifiusa.known';
const NAMES: Record<Variant, string> = { development: 'KNOWN Dev', preview: 'KNOWN Preview', production: 'KNOWN' };
const IDS: Record<Variant, string> = {
  development: `${BASE_ID}.dev`,
  preview: `${BASE_ID}.preview`,
  production: BASE_ID,
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: NAMES[variant],
  slug: 'known',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'known',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: IDS[variant],
    supportsTablet: true,
    config: { usesNonExemptEncryption: false },
    infoPlist: {
      // No background audio: music stops when KNOWN leaves the screen.
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: IDS[variant],
    // Her words must never leave the phone in a device backup.
    allowBackup: false,
    adaptiveIcon: {
      backgroundColor: '#121212',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    blockedPermissions: ['android.permission.RECORD_AUDIO'],
  },
  // Web: one page app (GitHub Pages serves index.html; 404.html is a copy for deep links).
  web: { output: 'single', favicon: './assets/images/favicon.png' },
  plugins: [
    'expo-router',
    ['expo-sqlite', { useSQLCipher: true }],
    'expo-secure-store',
    'expo-localization',
    'expo-font',
    ['expo-audio', { microphonePermission: false, recordAudioAndroid: false, enableBackgroundPlayback: false }],
    'expo-web-browser',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#ffffff',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
        dark: { backgroundColor: '#121212', image: './assets/images/splash-icon.png' },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
    // The web build is served from a sub-path on GitHub Pages (https://<user>.github.io/<repo>/).
    ...(process.env.WEB_BASE_URL ? { baseUrl: process.env.WEB_BASE_URL } : {}),
  },
  owner: 'rhidayas-team',
  extra: { variant, eas: { projectId: '547daba6-e339-40f0-ac3a-1adb31aea3f1' } },
});
