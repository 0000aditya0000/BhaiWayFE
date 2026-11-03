import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { saveProfilePhotoUrl } from '@/features/media';
import { useUpload } from '@/hooks/useUpload';
import { UploadDocumentSheet, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { styles } from './AvatarPicker.styles';
import type { AvatarPickerProps } from './AvatarPicker.types';

const PROFILE_PICKER_OPTIONS = {
  allowsEditing: true,
  aspect: [1, 1] as [number, number],
  quality: 0.8,
};

export const AvatarPicker = ({
  imageUri,
  onImageSelected,
  error,
  onUploadingChange,
  onUploadError,
}: AvatarPickerProps) => {
  const [sheetVisible, setSheetVisible] = useState(false);
  const [brokenRemote, setBrokenRemote] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const { uploadLocalFile, isUploading, cancelUpload } = useUpload({
    kind: 'profile',
    onUploaded: async (result) => {
      await saveProfilePhotoUrl(result);
    },
    showAlerts: true,
  });

  useEffect(
    () => () => {
      cancelUpload();
    },
    [cancelUpload],
  );

  const openSheet = useCallback(() => {
    if (isUploading) {
      return;
    }
    triggerLightHaptic();
    setSheetVisible(true);
  }, [isUploading]);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const handlePicked = useCallback(
    (document: { uri: string; fileName?: string; mimeType?: string }) => {
      setBrokenRemote(false);
      setPreviewUri(document.uri);
      onUploadingChange?.(true);

      void (async () => {
        try {
          const uploaded = await uploadLocalFile({
            uri: document.uri,
            fileName: document.fileName ?? `profile_${Date.now()}.jpg`,
            mimeType: document.mimeType ?? 'image/jpeg',
          });

          if (!uploaded) {
            setPreviewUri(null);
            onUploadingChange?.(false);
            onUploadError?.(new Error('Failed to upload photo to Cloudinary. Please try again.'));
            return;
          }

          setPreviewUri(uploaded.secureUrl);
          onImageSelected(uploaded.secureUrl);
          onUploadingChange?.(false);
        } catch (err) {
          setPreviewUri(null);
          onUploadingChange?.(false);
          const uploadError = err instanceof Error ? err : new Error('Upload failed');
          onUploadError?.(uploadError);
        }
      })();
    },
    [onImageSelected, onUploadError, onUploadingChange, uploadLocalFile],
  );

  const displayUri = previewUri ?? imageUri;
  const showImage = Boolean(displayUri) && !brokenRemote;

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={openSheet}
        style={styles.avatarContainer}
        accessibilityRole="button"
        accessibilityLabel="Profile photo. Tap to add or change photo."
        disabled={isUploading}
      >
        <View style={styles.avatarCircle}>
          {showImage ? (
            <Image
              source={{ uri: displayUri as string }}
              style={styles.avatarImage}
              onError={() => setBrokenRemote(true)}
            />
          ) : (
            <Ionicons name="person" size={56} color={colors.primary} />
          )}
          {isUploading ? (
            <View style={styles.uploadingOverlay}>
              <ActivityIndicator color={colors.white} />
            </View>
          ) : null}
        </View>
        <View style={styles.cameraBadge}>
          <Ionicons name="camera" size={18} color={colors.white} />
        </View>
      </Pressable>

      <Text style={styles.hint}>{isUploading ? 'Uploading…' : 'Tap to add photo'}</Text>

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <UploadDocumentSheet
        visible={sheetVisible}
        onClose={closeSheet}
        onPicked={handlePicked}
        title="Profile Photo"
        subtitle="Take a new photo or choose one from your gallery."
        imagePickerOptions={PROFILE_PICKER_OPTIONS}
      />
    </View>
  );
};
