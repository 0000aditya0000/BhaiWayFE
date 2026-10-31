import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText as Text } from '@/shared/components';
import { colors } from '@/theme/colorTheme';
import { getPlatformDisclosureConfig } from '../config/locationDisclosure.config';

export interface LocationDisclosureModalProps {
  visible: boolean;
  onConsent: () => void;
  onDecline: () => void;
  loading?: boolean;
}

export const LocationDisclosureModal = ({
  visible,
  onConsent,
  onDecline,
  loading = false,
}: LocationDisclosureModalProps) => {
  const config = getPlatformDisclosureConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDecline}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.dialogCard}>
            <View style={styles.header}>
              <View style={styles.badgeWrap}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={styles.badgeText}>{config.badgeText}</Text>
              </View>
              <Text style={styles.title}>{config.title}</Text>
            </View>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.primaryBox}>
                <Ionicons
                  name="navigate-circle-outline"
                  size={24}
                  color={colors.primary}
                  style={styles.primaryIcon}
                />
                <Text style={styles.primaryText}>{config.primaryExplanation}</Text>
              </View>

              <View style={styles.bulletsWrap}>
                {config.bulletPoints.map((bullet, index) => (
                  <View key={index} style={styles.bulletRow}>
                    <View style={styles.bulletIconWrap}>
                      <Ionicons
                        name={bullet.icon}
                        size={18}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.bulletTextWrap}>
                      <Text style={styles.bulletTitle}>{bullet.title}</Text>
                      <Text style={styles.bulletDesc}>{bullet.description}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.privacyBox}>
                <Ionicons
                  name="shield-outline"
                  size={16}
                  color={colors.textSecondary}
                  style={styles.privacyIcon}
                />
                <Text style={styles.privacyText}>{config.privacyNote}</Text>
              </View>
            </ScrollView>

            <View style={styles.actionsFooter}>
              <Pressable
                style={[styles.continueButton, loading && styles.buttonDisabled]}
                onPress={onConsent}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Consent to location sharing and continue"
              >
                <Text style={styles.continueButtonText}>
                  {loading ? 'Please wait...' : config.continueButtonText}
                </Text>
              </Pressable>

              <Pressable
                style={styles.notNowButton}
                onPress={onDecline}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Decline background location"
              >
                <Text style={styles.notNowButtonText}>
                  {config.notNowButtonText}
                </Text>
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
    maxWidth: 440,
    maxHeight: '90%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogCard: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 0.3,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  scrollArea: {
    maxHeight: 380,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  primaryBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF3FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D8DCF2',
    marginBottom: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  primaryIcon: {
    marginTop: 2,
  },
  primaryText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    color: colors.primaryDark,
  },
  bulletsWrap: {
    gap: 12,
    marginBottom: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bulletIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bulletTextWrap: {
    flex: 1,
  },
  bulletTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  bulletDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 6,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
  },
  privacyIcon: {
    marginTop: 2,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  actionsFooter: {
    marginTop: 18,
    gap: 10,
  },
  continueButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  notNowButton: {
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notNowButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
