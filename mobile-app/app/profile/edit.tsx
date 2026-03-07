import { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColors } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import {
  FadeIn,
  SlideIn,
  PressableScale,
  AnimatedButton,
  AnimatedInput,
} from '@/components/ui/animated';
import { Spacing, Typography, Palette, withOpacity, BorderRadius } from '@/constants/design-system';
import { Duration } from '@/constants/animations';
import { useProfile, useUpdateProfile } from '@/hooks/use-api';
import { uploadAvatar } from '@/services/api/profiles';
import { API_BASE_URL } from '@/constants/config';

export default function ProfileEditScreen() {
  const colors = useThemeColors();
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Initialize form when profile data loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  // Construct full avatar URL if avatar_url is a relative path
  const getAvatarUrl = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return url; // Already a full URL
    // No token needed - UUID path provides security
    return `${API_BASE_URL}${url}`;
  };

  const handlePickAvatar = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant photo library permissions to change your avatar.');
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setIsUploadingAvatar(true);
        try {
          // Upload to S3
          const { avatarUrl: newAvatarUrl } = await uploadAvatar(result.assets[0].uri);
          setAvatarUrl(newAvatarUrl);
        } finally {
          setIsUploadingAvatar(false);
        }
      }
    } catch (error) {
      console.error('Error picking avatar:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        full_name: fullName.trim() || undefined,
        bio: bio.trim() || undefined,
        avatar_url: avatarUrl || undefined,
      });
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      // Error is handled by the mutation hook
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        {/* @ts-ignore - SafeAreaView needs flex: 1 to expand */}
        <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
          <View style={styles.safeArea}>
            <View style={styles.loadingContainer}>
              <ThemedText style={[styles.loadingText, { color: colors.textMuted }]}>
                Loading profile...
              </ThemedText>
            </View>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* @ts-ignore - SafeAreaView needs flex: 1 to expand */}
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={styles.safeArea}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <FadeIn delay={0}>
            <View style={styles.header}>
              <PressableScale onPress={() => router.back()} hapticStyle="light" style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </PressableScale>
              <ThemedText style={[styles.title, { color: colors.text }]}>Edit Profile</ThemedText>
              <View style={styles.headerSpacer} />
            </View>
          </FadeIn>

          {/* Avatar Section */}
          <SlideIn direction="up" delay={Duration.fastest}>
            <View style={styles.avatarSection}>
              <TouchableOpacity
                onPress={handlePickAvatar}
                disabled={isUploadingAvatar}
                activeOpacity={0.8}
              >
                {avatarUrl ? (
                  <Image
                    source={{ uri: getAvatarUrl(avatarUrl) ?? undefined }}
                    style={styles.avatarImage}
                    onError={() => {
                      // Image loading failed - will use placeholder
                    }}
                    onLoad={() => { /* Image loaded successfully */ }}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="person" size={48} color={colors.primary} />
                    <Ionicons name="camera" size={20} color={colors.primary} style={styles.cameraIcon} />
                  </View>
                )}
                {isUploadingAvatar && (
                  <View style={styles.avatarLoadingOverlay}>
                    <Ionicons name="reload" size={24} color={colors.textInverse} />
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="pencil" size={14} color={colors.textInverse} />
                </View>
              </TouchableOpacity>
              <ThemedText style={[styles.avatarHint, { color: colors.textMuted }]}>
                Tap to change your profile picture
              </ThemedText>
            </View>
          </SlideIn>

          {/* Form */}
          <SlideIn direction="up" delay={Duration.fast}>
            <View style={styles.form}>
              {/* Full Name */}
              <View style={styles.fieldGroup}>
                <ThemedText style={[styles.label, { color: colors.textMuted }]}>FULL NAME</ThemedText>
                <AnimatedInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.placeholder}
                  leftIcon="person-outline"
                  autoCapitalize="words"
                />
              </View>

              {/* Bio */}
              <View style={styles.fieldGroup}>
                <ThemedText style={[styles.label, { color: colors.textMuted }]}>BIO</ThemedText>
                <AnimatedInput
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell us about yourself"
                  placeholderTextColor={colors.placeholder}
                  leftIcon="text-outline"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          </SlideIn>

          {/* Save Button */}
          <SlideIn direction="up" delay={Duration.normal}>
            <View style={styles.buttonContainer}>
              <AnimatedButton
                variant="primary"
                size="lg"
                onPress={handleSave}
                loading={updateProfileMutation.isPending || isUploadingAvatar}
                disabled={updateProfileMutation.isPending || isUploadingAvatar}
              >
                Save Changes
              </AnimatedButton>
            </View>
          </SlideIn>
        </ScrollView>
        </View>
      {/* @ts-ignore - SafeAreaView needs flex: 1 to expand */}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing[10],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[8],
    paddingBottom: Spacing[4],
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: Spacing[2],
    includeFontPadding: false,
  },
  headerSpacer: {
    width: 44,
  },
  // Avatar styles
  avatarSection: {
    alignItems: 'center',
    marginTop: Spacing[4],
    marginBottom: Spacing[6],
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: BorderRadius.full,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: 'absolute',
  },
  avatarLoadingOverlay: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: withOpacity(Palette.black, 0.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.xl,
    backgroundColor: Palette.emerald[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Palette.white,
  },
  avatarHint: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing[3],
  },
  // Form styles
  form: {
    paddingHorizontal: Spacing[6],
  },
  fieldGroup: {
    marginBottom: Spacing[6],
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: Typography.letterSpacing.widest,
    marginBottom: Spacing[3],
    includeFontPadding: false,
  },
  buttonContainer: {
    paddingHorizontal: Spacing[6],
    marginTop: Spacing[8],
  },
});
