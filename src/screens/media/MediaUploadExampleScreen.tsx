import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ImageUploader, IconButton, AppText as Text } from '@/shared/components';
import { cloudinaryConfig } from '@/config';
import {
  saveCorporateIdUrl,
  saveDrivingLicenseUrl,
  saveProfilePhotoUrl,
  saveVehicleRcUrl,
} from '@/features/media';
import type { CloudinaryUploadResponse, UploadKind } from '@/types/cloudinary';
import { colors, layout, spacing } from '@/shared/theme';
import { showSuccessFeedback } from '@/shared/utils/feedback';
import { getErrorMessage, triggerLightHaptic } from '@/shared/utils';
import { showAppAlert } from '@/store';

interface MediaUploadExampleScreenProps {
  kind: UploadKind;
  title: string;
  subtitle: string;
  submitLabel: string;
}

const persistByKind = async (
  kind: UploadKind,
  result: CloudinaryUploadResponse,
): Promise<void> => {
  if (kind === 'profile') {
    await saveProfilePhotoUrl(result);
    return;
  }
  if (kind === 'dl') {
    await saveDrivingLicenseUrl(result);
    return;
  }
  if (kind === 'rc') {
    await saveVehicleRcUrl(result);
    return;
  }
  if (kind === 'corporateId') {
    await saveCorporateIdUrl(result);
  }
};

export const MediaUploadExampleScreen = ({
  kind,
  title,
  subtitle,
  submitLabel,
}: MediaUploadExampleScreenProps) => {
  const router = useRouter();
  const [lastUpload, setLastUpload] = useState<CloudinaryUploadResponse | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const goBack = useCallback(() => {
    triggerLightHaptic();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/home');
  }, [router]);

  const handleUploaded = useCallback(async (result: CloudinaryUploadResponse) => {
    setLastUpload(result);
  }, []);

  const handleSave = useCallback(async () => {
    if (!lastUpload || isSaving) {
      return;
    }
    setIsSaving(true);
    try {
      await persistByKind(kind, lastUpload);
      showSuccessFeedback(
        'Uploaded',
        kind === 'dl'
          ? 'Driving license saved and verification submitted.'
          : kind === 'rc'
            ? 'Vehicle RC saved and verification submitted.'
            : 'Saved successfully.',
      );
    } catch (error) {
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? Number((error as { status?: unknown }).status)
          : undefined;
      if (status === 401) {
        showAppAlert(
          'Session expired',
          kind === 'rc'
            ? 'Please sign in again to submit vehicle verification.'
            : kind === 'dl'
              ? 'Please sign in again to submit driving license verification.'
              : 'Please sign in again and retry.',
        );
      } else {
        showAppAlert(
          'Upload failed',
          getErrorMessage(error, 'Could not save. Please try again.'),
        );
      }
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, kind, lastUpload]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={goBack}
          color={colors.primary}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!cloudinaryConfig.isConfigured ? (
          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Cloudinary not configured</Text>
            <Text style={styles.bannerBody}>
              Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET
              in your .env, then restart Expo with -c.
            </Text>
          </View>
        ) : null}

        <ImageUploader
          kind={kind}
          title={title}
          subtitle={subtitle}
          submitLabel={submitLabel}
          onUploaded={handleUploaded}
        />

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            (!lastUpload || isSaving || pressed) && styles.saveButtonDisabled,
          ]}
          disabled={!lastUpload || isSaving}
          onPress={() => {
            void handleSave();
          }}
          accessibilityRole="button"
          accessibilityLabel={submitLabel}
        >
          <Text style={styles.saveLabel}>
            {isSaving
              ? kind === 'dl'
                ? 'Submitting driving license verification…'
                : kind === 'rc'
                  ? 'Submitting vehicle verification…'
                  : 'Saving…'
              : submitLabel}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 64,
    backgroundColor: colors.white,
  },
  headerTitle: {
    position: 'absolute',
    left: 56,
    right: 56,
    zIndex: 0,
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xxxl,
    paddingBottom: spacing.huge,
  },
  banner: {
    padding: spacing.lg,
    borderRadius: layout.radiusLg,
    backgroundColor: '#FFF7ED',
    gap: spacing.xs,
  },
  bannerTitle: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bannerBody: {
    color: colors.textSecondary,
    lineHeight: 20,
  },
  saveButton: {
    height: layout.buttonHeight,
    borderRadius: layout.radiusXl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveLabel: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
