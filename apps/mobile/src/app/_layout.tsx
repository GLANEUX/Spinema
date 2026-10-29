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

  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.colors.mur } }}
      />
    </>
  );
}
