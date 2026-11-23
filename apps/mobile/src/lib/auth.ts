import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { createAuthClient } from 'better-auth/react';
import { inferAdditionalFields, usernameClient } from 'better-auth/client/plugins';
import { expoClient } from '@better-auth/expo/client';
import { API_URL } from './api';

/**
 * Deep link scheme of the running variant (app.config.ts): spinema, spinema-preview or
 * spinema-development. Used for the links in the e-mails (docs/comptes.md).
 */
export const scheme = (Constants.expoConfig?.scheme as string | undefined) ?? 'spinema';

/**
 * Better Auth client (docs/comptes.md). The session cookie lives in expo-secure-store
 * (Android Keystore), never in AsyncStorage.
 */
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({ scheme, storagePrefix: 'spinema', storage: SecureStore }),
    usernameClient(),
    inferAdditionalFields({ user: { birthDate: { type: 'string', required: true } } }),
  ],
});
