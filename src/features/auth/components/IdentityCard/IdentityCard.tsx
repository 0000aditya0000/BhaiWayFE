import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors } from '@/shared/theme';
import { styles } from './IdentityCard.styles';
import type { IdentityCardProps } from './IdentityCard.types';
import { AppText as Text } from '@/shared/components';

export const IdentityCard = ({
  onVerifyPress,
  verified = false,
  optional = true,
}: IdentityCardProps) => {
  const handleVerify = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onVerifyPress?.();
  }, [onVerifyPress]);

  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />

      <View style={styles.content}>
        <View style={styles.illustration}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
          </View>
          <Ionicons name="person" size={28} color={colors.primary} style={styles.personIcon} />
        </View>

        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>
              {verified ? 'Identity Verified' : 'Verify Your Identity'}
            </Text>
            {optional && !verified ? <Text style={styles.optionalBadge}>Optional</Text> : null}
          </View>
          <Text style={styles.subtitle}>
            {verified
              ? 'Your identity is verified. You can continue once required profile details are filled.'
              : 'Verify with Aadhaar or your corporate email. You can skip this and do it later from Profile.'}
          </Text>

          {verified ? (
            <View style={styles.verifiedPill} accessibilityRole="text">
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
              <Text style={styles.verifiedLabel}>Verified</Text>
            </View>
          ) : (
            <Pressable
              onPress={handleVerify}
              style={styles.verifyButton}
              accessibilityRole="button"
              accessibilityLabel="Verify identity now (optional)"
            >
              <Ionicons name="shield-checkmark" size={16} color={colors.white} />
              <Text style={styles.verifyLabel}>Verify Now</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};
