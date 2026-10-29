import React from 'react';
import { Modal, Pressable, View } from 'react-native';

import { AppText as Text } from '@/shared/components';
import { AADHAAR_REWARD_SCREEN } from '../../constants/aadhaar-reward.constants';
import { styles } from './AadhaarRewardClaimModal.styles';
import type { AadhaarRewardClaimModalProps } from './AadhaarRewardClaimModal.types';

export const AadhaarRewardClaimModal = ({
  visible,
  onClaim,
  onDismiss,
}: AadhaarRewardClaimModalProps) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onDismiss}
    statusBarTranslucent
  >
    <Pressable
      style={styles.overlay}
      onPress={onDismiss}
      accessibilityRole="button"
      accessibilityLabel="Dismiss claim coins modal"
    >
      <Pressable
        style={styles.card}
        onPress={(event) => event.stopPropagation()}
        accessibilityRole="none"
      >
        <View style={styles.emojiWrap} accessibilityElementsHidden>
          <Text style={styles.emoji}>🎁</Text>
        </View>

        <View style={styles.textBlock}>
          <Text style={styles.title} accessibilityRole="header">
            {AADHAAR_REWARD_SCREEN.claimTitle}
          </Text>
          <Text style={styles.message}>{AADHAAR_REWARD_SCREEN.claimMessage}</Text>
          <Text style={styles.hint}>{AADHAAR_REWARD_SCREEN.claimHint}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
            onPress={onClaim}
            accessibilityRole="button"
            accessibilityLabel={AADHAAR_REWARD_SCREEN.claimCta}
          >
            <Text style={styles.primaryLabel}>{AADHAAR_REWARD_SCREEN.claimCta}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
            onPress={onDismiss}
            accessibilityRole="button"
            accessibilityLabel={AADHAAR_REWARD_SCREEN.claimLater}
          >
            <Text style={styles.secondaryLabel}>{AADHAAR_REWARD_SCREEN.claimLater}</Text>
          </Pressable>
        </View>
      </Pressable>
    </Pressable>
  </Modal>
);
