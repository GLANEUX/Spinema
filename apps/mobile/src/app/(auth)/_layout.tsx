import { Stack } from 'expo-router';
import { theme } from '@spinema/shared';

/** Screens reachable without an account: sign-in, sign-up, forgotten password. */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.mur } }}
    />
  );
}
