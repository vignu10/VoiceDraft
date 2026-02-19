import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View } from 'react-native';
import { ThemedText } from '@/components/themed-text';

/**
 * Auth index screen - redirects to sign-in
 * This file is required by expo-router to properly navigate to the auth folder
 */
export default function AuthIndex() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in immediately
    router.replace('/auth/sign-in');
  }, [router]);

  // Show a minimal loading state instead of blank screen
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ThemedText>Loading...</ThemedText>
    </View>
  );
}
