import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { showAppAlert } from '@/store';

import type { UploadedDocument } from '../UploadDocumentSheet/UploadDocumentSheet.types';

const DEFAULT_OPTIONS: ImagePicker.ImagePickerOptions = {
  // Images only — never request video / broad media library access.
  mediaTypes: ['images'],
  quality: 0.85,
  allowsEditing: false,
};

const toUploadedDocument = (asset: ImagePicker.ImagePickerAsset): UploadedDocument => ({
  uri: asset.uri,
  fileName: asset.fileName ?? undefined,
  mimeType: asset.mimeType ?? undefined,
  width: asset.width,
  height: asset.height,
});

export type PickDocumentOptions = ImagePicker.ImagePickerOptions & {
  /** Wait after closing a modal before launching the system picker. */
  waitAfterModalMs?: number;
};

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const withTimeout = async <T,>(promise: Promise<T>, ms: number, label: string): Promise<T> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out. Please try again.`));
        }, ms);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

/**
 * Android gallery selection uses the system Photo Picker via
 * `launchImageLibraryAsync` — no READ_MEDIA_* / media-library permission.
 * iOS still requests photo-library permission when required.
 */
export const shouldRequestMediaLibraryPermissionForGallery = (
  platformOS: typeof Platform.OS = Platform.OS,
): boolean => platformOS === 'ios';

export const pickDocumentFromCamera = async (
  options?: PickDocumentOptions,
): Promise<UploadedDocument | null> => {
  const { waitAfterModalMs = 0, ...pickerOptions } = options ?? {};

  try {
    const current = await ImagePicker.getCameraPermissionsAsync();
    let permission = current;

    if (!current.granted) {
      permission = await ImagePicker.requestCameraPermissionsAsync();
    }

    if (!permission.granted) {
      showAppAlert(
        'Camera permission needed',
        permission.canAskAgain === false
          ? 'Camera access is blocked. Enable it in Settings → BhaiWay → Camera.'
          : 'Allow camera access to take your profile photo.',
      );
      return null;
    }

    if (waitAfterModalMs > 0) {
      await delay(waitAfterModalMs);
    }

    // Do NOT use allowsEditing with camera — it freezes frequently on iOS Expo.
    const result = await withTimeout(
      ImagePicker.launchCameraAsync({
        ...DEFAULT_OPTIONS,
        ...pickerOptions,
        mediaTypes: ['images'],
        allowsEditing: false,
        aspect: undefined,
      }),
      60_000,
      'Camera',
    );

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    return toUploadedDocument(result.assets[0]);
  } catch (error) {
    showAppAlert(
      'Camera unavailable',
      error instanceof Error
        ? error.message
        : 'Could not open the camera. Please try again or use Gallery.',
    );
    return null;
  }
};

export const pickDocumentFromGallery = async (
  options?: PickDocumentOptions,
): Promise<UploadedDocument | null> => {
  const { waitAfterModalMs = 0, ...pickerOptions } = options ?? {};

  try {
    if (shouldRequestMediaLibraryPermissionForGallery()) {
      const current = await ImagePicker.getMediaLibraryPermissionsAsync();
      let permission = current;

      if (!current.granted) {
        permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (!permission.granted) {
        showAppAlert(
          'Photos permission needed',
          permission.canAskAgain === false
            ? 'Photo access is blocked. Enable it in Settings → BhaiWay → Photos.'
            : 'Allow photo library access to choose a profile photo.',
        );
        return null;
      }
    }

    if (waitAfterModalMs > 0) {
      await delay(waitAfterModalMs);
    }

    const result = await withTimeout(
      ImagePicker.launchImageLibraryAsync({
        ...DEFAULT_OPTIONS,
        ...pickerOptions,
        // Force images-only even if a caller overrides mediaTypes.
        mediaTypes: ['images'],
        // Gallery crop is OK; camera crop is not.
        allowsEditing: pickerOptions.allowsEditing ?? true,
      }),
      60_000,
      'Gallery',
    );

    if (result.canceled || !result.assets[0]) {
      return null;
    }

    return toUploadedDocument(result.assets[0]);
  } catch (error) {
    showAppAlert(
      'Gallery unavailable',
      error instanceof Error
        ? error.message
        : 'Could not open the gallery. Please try again.',
    );
    return null;
  }
};

export const isIos = Platform.OS === 'ios';
