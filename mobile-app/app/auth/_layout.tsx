import { Stack , useRouter } from 'expo-router';
import { useAuthStore } from '@/stores';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

export default function AuthLayout() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Mark as ready after a short delay to ensure navigation is mounted
    const timeout = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Only navigate when both ready and authenticated
    if (isReady && isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isReady, isAuthenticated, router]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Smooth card-style navigation
        presentation: 'card',
        // Disable swipe back for auth screens to prevent confusion
        gestureEnabled: Platform.OS === 'ios',
        // Smooth spring animation for transitions
        animation: 'default',
        contentStyle: {
          backgroundColor: 'transparent',
        },
        // Prevent swipe back on iOS
        fullScreenGestureEnabled: false,
      }}
    >
      <Stack.Screen
        name="sign-in"
        options={{
          // No special options for sign-in - it's the entry point
        }}
      />
      <Stack.Screen
        name="sign-up"
        options={{
          // Sign up uses same card-style navigation
          // Disable swipe back to prevent going back from sign-up
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          // Modal presentation for forgot password
          presentation: 'modal',
          gestureEnabled: true,
          animation: 'default',
        }}
      />
    </Stack>
  );
}
