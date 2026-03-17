import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { useGuestDraftStore } from '@/stores/guest-draft-store';
import { View, StyleSheet } from 'react-native';
import { LogoWordmark } from '@/components/logo/LogoWordmark';
import { AnimatedLogoIcon } from '@/components/logo/AnimatedLogoIcon';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Root index screen - redirects based on auth state and guest drafts
 * - If authenticated: goes to (tabs)
 * - If not authenticated AND has guest draft: goes to guest draft view
 * - If not authenticated AND no guest draft: goes to auth/sign-in
 */
export default function Index() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const guestDraft = useGuestDraftStore((state) => state.draft);
  const [hasCheckedGuestDraft, setHasCheckedGuestDraft] = useState(false);

  useEffect(() => {
    // Check if there's a persisted guest draft
    const checkGuestDraft = async () => {
      try {
        const stored = await AsyncStorage.getItem('guest-draft-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Check if there's a draft in the persisted state
          if (parsed.state?.draft) {
            setHasCheckedGuestDraft(true);
            // Redirect to guest draft view
            router.replace({
              pathname: '/draft/[id]',
              params: { id: 'guest', isGuestFlow: 'true' }
            });
            return;
          }
        }
      } catch (error) {
        // Silently handle guest draft check errors
      }
      setHasCheckedGuestDraft(true);
    };

    if (!isAuthenticated) {
      checkGuestDraft();
    } else {
      setHasCheckedGuestDraft(true);
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Only redirect after we've checked for guest drafts
    if (!hasCheckedGuestDraft) return;

    if (isAuthenticated) {
      router.replace('/(tabs)');
    } else {
      router.replace('/auth/sign-in');
    }
  }, [isAuthenticated, hasCheckedGuestDraft, router]);

  // Show splash screen while redirecting
  return (
    <View style={styles.container}>
      <AnimatedLogoIcon size={128} />
      <View style={styles.wordmarkContainer}>
        <LogoWordmark size="lg" showTagline={true} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121210',
  },
  wordmarkContainer: {
    marginTop: 24,
  },
});
