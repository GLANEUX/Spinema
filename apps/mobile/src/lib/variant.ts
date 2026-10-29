import Constants from 'expo-constants';

export type Variant = 'development' | 'preview' | 'production';

/** Which build is running (see app.config.ts). */
export const variant: Variant =
  (Constants.expoConfig?.extra?.variant as Variant | undefined) ?? 'development';

/** Scotch label shown on non-production builds, so préprod is never mistaken for the real app. */
export const variantLabel: string | null = {
  development: 'dev',
  preview: 'préprod',
  production: null,
}[variant];
