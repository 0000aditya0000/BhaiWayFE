import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText as Text } from '@/shared/components';
import { colors } from '@/theme/colorTheme';
import { SETTINGS_GUIDANCE_COPY } from '../config/locationDisclosure.config';

export interface LocationSettingsGuideModalProps {
  visible: boolean;
  onOpenSettings: () => void;
  onDismiss: () => void;
}

export const LocationSettingsGuideModal = ({
  visible,
  onOpenSettings,
  onDismiss,
}: LocationSettingsGuideModalProps) => {
  const isIos = Platform.OS === 'ios';
  const copy = isIos ? SETTINGS_GUIDANCE_COPY.ios : SETTINGS_GUIDANCE_COPY.android;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.dialogCard}>
            <View style={styles.iconWrap}>
              <Ionicons name="settings-outline" size={32} color={colors.primary} />
            </View>

            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>

            <View style={styles.stepsContainer}>
              {copy.steps.map((step, index) => (
                <View key={index} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNumber}>{index + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.primaryButton}
                onPress={onOpenSettings}
                accessibilityRole="button"
                accessibilityLabel="Open device settings"
              >
                <Text style={styles.primaryButtonText}>{copy.buttonText}</Text>
              </Pressable>

              <Pressable
                style={styles.dismissButton}
                onPress={onDismiss}
                accessibilityRole="button"
                accessibilityLabel="Cancel settings guide"
              >
                <Text style={styles.dismissButtonText}>{copy.dismissText}</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  safeArea: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingTop: 26,
    paddingHorizontal: 22,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  stepsContainer: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  actions: {
    width: '100%',
    gap: 10,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  dismissButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
