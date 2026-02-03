import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { QueryProvider } from '@/providers/query-provider';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="recording"
            options={{
              presentation: 'fullScreenModal',
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="keyword"
            options={{
              presentation: 'modal',
              title: 'Blog Options',
            }}
          />
          <Stack.Screen
            name="draft/processing"
            options={{
              presentation: 'fullScreenModal',
              headerShown: false,
              gestureEnabled: false,
            }}
          />
          <Stack.Screen
            name="draft/[id]"
            options={{
              title: 'Edit Draft',
            }}
          />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </QueryProvider>
  );
}
