import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Archivo_400Regular,
  Archivo_600SemiBold,
  Archivo_900Black_Italic,
} from '@expo-google-fonts/archivo';
import { Caveat_700Bold } from '@expo-google-fonts/caveat';
import { PermanentMarker_400Regular } from '@expo-google-fonts/permanent-marker';
import { IBMPlexMono_600SemiBold } from '@expo-google-fonts/ibm-plex-mono';
import { theme } from '@spinema/shared';
import { authClient } from '../lib/auth';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Archivo_400Regular,
    Archivo_600SemiBold,
    Archivo_900Black_Italic,
    Caveat_700Bold,
    PermanentMarker_400Regular,
    IBMPlexMono_600SemiBold,
  });

  // The session comes from expo-secure-store first, then from the API (docs/comptes.md).
  const { data: session, isPending } = authClient.useSession();
  const ready = (loaded || Boolean(error)) && !isPending;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;
  const signedIn = Boolean(session);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.mur } }}
      >
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="index" />
          <Stack.Screen name="moi" />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        {/* Reset link from the e-mail: works signed in or not. */}
        <Stack.Screen name="reinitialiser" />
      </Stack>
    </>
  );
}
