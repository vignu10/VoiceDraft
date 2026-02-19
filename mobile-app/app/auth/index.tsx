import { useEffect } from 'react';
import { useRouter } from 'expo-router';

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

  return null;
}
