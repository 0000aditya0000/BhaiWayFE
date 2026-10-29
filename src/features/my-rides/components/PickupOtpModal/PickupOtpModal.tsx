import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { OTPInput, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { DRIVER_PICKUP_SCREEN } from '../../constants';
import { styles } from './PickupOtpModal.styles';
import type { PickupOtpModalProps } from './PickupOtpModal.types';

export const PickupOtpModal = ({
  visible,
  passengerName,
  otpLength,
  value,
  error,
  verifying,
  hintOtp,
  onChange,
  onVerify,
  onClose,
  footerExtra,
}: PickupOtpModalProps) => {
  const canVerify = value.length === otpLength && !verifying;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss OTP dialog"
      >
        <Pressable
          style={styles.card}
          onPress={(event) => event.stopPropagation()}
          accessibilityRole="none"
        >
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <Ionicons name="keypad-outline" size={28} color="#4B61C4" />
            </View>
            <Text style={styles.title}>{DRIVER_PICKUP_SCREEN.otpTitle}</Text>
            <Text style={styles.subtitle}>
              {DRIVER_PICKUP_SCREEN.otpSubtitle(passengerName)}
            </Text>
          </View>

          <View style={styles.otpWrap}>
            <OTPInput
              value={value}
              onChange={onChange}
              cellCount={otpLength}
              error={error ?? undefined}
            />
          </View>

          {hintOtp ? (
            <View style={styles.hint}>
              <Text style={styles.hintText}>
                {DRIVER_PICKUP_SCREEN.otpHint}: {hintOtp}
              </Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.verifyButton,
                (!canVerify || pressed) && styles.verifyDisabled,
                pressed && canVerify && { transform: [{ scale: 0.98 }] },
              ]}
              onPress={onVerify}
              disabled={!canVerify}
              accessibilityRole="button"
              accessibilityLabel={DRIVER_PICKUP_SCREEN.otpConfirmLabel}
            >
              {verifying ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.verifyLabel}>
                  {DRIVER_PICKUP_SCREEN.otpConfirmLabel}
                </Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              onPress={onClose}
              disabled={verifying}
              accessibilityRole="button"
              accessibilityLabel={DRIVER_PICKUP_SCREEN.otpCancelLabel}
            >
              <Text style={styles.cancelLabel}>{DRIVER_PICKUP_SCREEN.otpCancelLabel}</Text>
            </Pressable>
          </View>

          {footerExtra ? <View style={styles.footerExtra}>{footerExtra}</View> : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
};
