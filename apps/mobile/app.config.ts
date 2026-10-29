import type { ExpoConfig } from 'expo/config';

/**
 * Three variants of the app, chosen with APP_VARIANT:
 * - development: Expo Go on the dev machine (pnpm start)
 * - preview: "Spinema préprod", installed next to the real app, talks to the staging API
 * - production: "Spinema", the Play Store app
 */
type Variant = 'development' | 'preview' | 'production';
const variant = (process.env.APP_VARIANT ?? 'development') as Variant;

const VARIANTS: Record<Variant, { name: string; package: string }> = {
  development: { name: 'Spinema dev', package: 'com.glaneux.spinema.dev' },
  preview: { name: 'Spinema préprod', package: 'com.glaneux.spinema.preview' },
  production: { name: 'Spinema', package: 'com.glaneux.spinema' },
};

/** Version shown to users; bump it before tagging a release. */
const version = '0.1.0';
/** Must increase with every build installed on a phone (CI passes the run number). */
const versionCode = Number(process.env.BUILD_NUMBER ?? 1);

const config: ExpoConfig = {
  name: VARIANTS[variant].name,
  slug: 'spinema',
  scheme: variant === 'production' ? 'spinema' : `spinema-${variant}`,
  version,
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  backgroundColor: '#1B1714',
  android: {
    package: VARIANTS[variant].package,
    versionCode,
    adaptiveIcon: {
      backgroundColor: '#2A211C',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  plugins: [
    'expo-router',
    'expo-font',
    [
      'expo-splash-screen',
      { backgroundColor: '#1B1714', image: './assets/splash-icon.png', imageWidth: 160 },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: { variant },
};

export default config;
