import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { QueryProvider } from '@/providers/query-provider';
import { DialogProvider } from '@/components/ui/dialog';
import { useFonts } from '@expo-google-fonts/nunito/useFonts';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // OPTIMIZATION: Load only essential font variants (3 instead of 5)
  // This reduces initial bundle size and speeds up time-to-interactive
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  useEffect(() => {
    // OPTIMIZATION: Add timeout to hide splash screen after 3 seconds max
    // This prevents indefinite splash screen on slow connections
    const timeoutId = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 3000);

    if (fontsLoaded) {
      clearTimeout(timeoutId);
      SplashScreen.hideAsync();
    }

    return () => clearTimeout(timeoutId);
  }, [fontsLoaded]);

  // OPTIMIZATION: Remove blocking render - show app immediately with fallback fonts
  return (
    <QueryProvider>
      <DialogProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="recording"
            options={{
              presentation: 'fullScreenModal',
            }}
          />
          <Stack.Screen
            name="keyword"
            options={{
              presentation: 'modal',
              headerShown: true,
              title: 'Blog Options',
            }}
          />
          <Stack.Screen
            name="draft/processing"
            options={{
              presentation: 'fullScreenModal',
              gestureEnabled: false,
            }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true, title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </DialogProvider>
    </QueryProvider>
  );
}
