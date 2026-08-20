import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import {
  pickDocumentFromCamera,
  pickDocumentFromGallery,
} from './uploadDocument.helpers';
import { styles } from './UploadDocumentSheet.styles';
import { AppText as Text } from '../AppText';
import type {
  UploadDocumentSheetProps,
  UploadDocumentSource,
} from './UploadDocumentSheet.types';

const DEFAULT_SOURCES: readonly UploadDocumentSource[] = ['camera', 'gallery'];

/** Ignore overlay taps right after open so the opening press doesn't dismiss the sheet. */
const OPEN_GUARD_MS = 450;

export const UploadDocumentSheet = ({
  visible,
  onClose,
  onPicked,
  title = 'Upload Document',
  subtitle = 'Choose how you want to add your file.',
  cameraLabel = 'Take Photo',
  cameraHint = 'Use your camera to capture the document',
  galleryLabel = 'Choose from Gallery',
  galleryHint = 'Select an existing photo from your device',
  cancelLabel = 'Cancel',
  sources = DEFAULT_SOURCES,
  imagePickerOptions,
}: UploadDocumentSheetProps) => {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const openedAtRef = useRef(0);
  const onPickedRef = useRef(onPicked);
  const onCloseRef = useRef(onClose);
  const optionsRef = useRef(imagePickerOptions);
  const sourcesRef = useRef(sources);
  const labelsRef = useRef({ title, subtitle, cameraLabel, galleryLabel, cancelLabel });
  const pickingRef = useRef(false);
  const iosPresentingRef = useRef(false);

  onPickedRef.current = onPicked;
  onCloseRef.current = onClose;
  optionsRef.current = imagePickerOptions;
  sourcesRef.current = sources;
  labelsRef.current = { title, subtitle, cameraLabel, galleryLabel, cancelLabel };

  const resetBusy = useCallback(() => {
    pickingRef.current = false;
    setBusy(false);
  }, []);

  const runPicker = useCallback(
    async (source: UploadDocumentSource, waitAfterModalMs: number) => {
      if (pickingRef.current) {
        return;
      }

      pickingRef.current = true;
      setBusy(true);

      try {
        const pickerOptions = {
          ...optionsRef.current,
          waitAfterModalMs,
        };

        const document =
          source === 'camera'
            ? await pickDocumentFromCamera(pickerOptions)
            : await pickDocumentFromGallery(pickerOptions);

        if (document) {
          onPickedRef.current(document);
        }
      } finally {
        resetBusy();
      }
    },
    [resetBusy],
  );

  /**
   * iOS: use native ActionSheet (no RN Modal). Modal + camera freezes Expo on device.
   * Important: do NOT clear the ActionSheet timer when `visible` flips to false —
   * we close `visible` ourselves before presenting the sheet.
   */
  useEffect(() => {
    if (!visible || Platform.OS !== 'ios') {
      return;
    }

    if (iosPresentingRef.current || pickingRef.current) {
      onCloseRef.current();
      return;
    }

    iosPresentingRef.current = true;
    onCloseRef.current();

    const timer = setTimeout(() => {
      const activeSources = sourcesRef.current.length
        ? [...sourcesRef.current]
        : [...DEFAULT_SOURCES];
      const labels = labelsRef.current;
      const optionLabels = activeSources.map((source) =>
        source === 'camera' ? labels.cameraLabel : labels.galleryLabel,
      );
      const options = [...optionLabels, labels.cancelLabel];
      const cancelButtonIndex = options.length - 1;

      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: labels.title,
          message: labels.subtitle,
          options,
          cancelButtonIndex,
          userInterfaceStyle: 'light',
        },
        (buttonIndex) => {
          iosPresentingRef.current = false;

          if (buttonIndex === cancelButtonIndex || buttonIndex == null) {
            resetBusy();
            return;
          }

          const source = activeSources[buttonIndex];
          if (!source) {
            resetBusy();
            return;
          }

          triggerLightHaptic();
          void runPicker(source, 0);
        },
      );
    }, 120);

    // Keep timer alive even after `visible` becomes false (we close it on purpose).
    return undefined;
  }, [visible, resetBusy, runPicker]);

  useEffect(() => {
    if (visible && Platform.OS !== 'ios') {
      openedAtRef.current = Date.now();
      resetBusy();
    }
  }, [visible, resetBusy]);

  const handleClose = useCallback(() => {
    if (pickingRef.current) {
      return;
    }
    if (Date.now() - openedAtRef.current < OPEN_GUARD_MS) {
      return;
    }
    onCloseRef.current();
  }, []);

  const runSource = useCallback(
    async (source: UploadDocumentSource) => {
      if (pickingRef.current) {
        return;
      }

      triggerLightHaptic();
      onCloseRef.current();
      await runPicker(source, 300);
    },
    [runPicker],
  );

  if (Platform.OS === 'ios') {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityLabel="Close upload sheet"
        />
        <View
          style={[
            styles.sheet,
            sheetLayer,
            { paddingBottom: Math.max(insets.bottom, spacing.xxl) },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerIcon}>
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={24} color={colors.white} />
              )}
            </View>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
          </View>

          <View style={styles.options}>
            {sources.includes('camera') ? (
              <Pressable
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => void runSource('camera')}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={cameraLabel}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="camera-outline" size={24} color="#374BB1" />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{cameraLabel}</Text>
                  <Text style={styles.optionHint}>{cameraHint}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C4C5D7" />
              </Pressable>
            ) : null}

            {sources.includes('gallery') ? (
              <Pressable
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => void runSource('gallery')}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={galleryLabel}
              >
                <View style={styles.optionIcon}>
                  <Ionicons name="images-outline" size={24} color="#374BB1" />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{galleryLabel}</Text>
                  <Text style={styles.optionHint}>{galleryHint}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#C4C5D7" />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.85 }]}
            onPress={handleClose}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
          >
            <Text style={styles.cancelLabel}>{cancelLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const sheetLayer = {
  zIndex: 2,
  elevation: 12,
};
