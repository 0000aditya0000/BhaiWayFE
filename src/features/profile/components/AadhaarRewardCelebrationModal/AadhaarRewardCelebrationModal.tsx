import React, { useEffect } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppText as Text } from '@/shared/components';
import { triggerSuccessHaptic } from '@/shared/utils';
import { AADHAAR_REWARD_SCREEN } from '../../constants/aadhaar-reward.constants';
import { styles } from './AadhaarRewardCelebrationModal.styles';
import type { AadhaarRewardCelebrationModalProps } from './AadhaarRewardCelebrationModal.types';

export const AadhaarRewardCelebrationModal = ({
  visible,
  onContinue,
}: AadhaarRewardCelebrationModalProps) => {
  const scale = useSharedValue(0.86);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) {
      scale.value = 0.86;
      opacity.value = 0;
      return;
    }
    triggerSuccessHaptic();
    opacity.value = withTiming(1, { duration: 220 });
    scale.value = withSpring(1, { damping: 14, stiffness: 180 });
  }, [opacity, scale, visible]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onContinue}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.confettiRow} accessibilityElementsHidden>
            <Text style={styles.confetti}>🎉</Text>
            <Text style={styles.confetti}>🥳</Text>
            <Text style={styles.confetti}>🎊</Text>
          </View>

          <View style={styles.emojiWrap} accessibilityElementsHidden>
            <Text style={styles.emoji}>🪙</Text>
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.title} accessibilityRole="header">
              {AADHAAR_REWARD_SCREEN.celebrationTitle}
            </Text>
            <Text style={styles.message}>{AADHAAR_REWARD_SCREEN.celebrationMessage}</Text>
            <Text style={styles.subtitle}>{AADHAAR_REWARD_SCREEN.celebrationSubtitle}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
            ]}
            onPress={onContinue}
            accessibilityRole="button"
            accessibilityLabel={AADHAAR_REWARD_SCREEN.celebrationCta}
          >
            <Text style={styles.primaryLabel}>{AADHAAR_REWARD_SCREEN.celebrationCta}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};
