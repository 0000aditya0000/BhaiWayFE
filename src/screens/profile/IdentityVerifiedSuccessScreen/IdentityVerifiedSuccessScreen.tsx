import React, { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { triggerSuccessHaptic } from '@/shared/utils';
import { IDENTITY_VERIFIED_SUCCESS_SCREEN } from '@/features/profile/constants';
import { useIdentityVerifiedSuccess } from '@/features/profile/hooks';
import { identityVerifiedTokens, styles } from './IdentityVerifiedSuccessScreen.styles';

const CONFETTI_COLORS = ['#4B61C4', '#374BB1', '#DDE1FF', '#B7C4FF'] as const;

export const IdentityVerifiedSuccessScreen = () => {
  const { isAuthFlow, ctaLabel, continuing, continueAfterVerification, goBack } =
    useIdentityVerifiedSuccess();

  const pulse = useSharedValue(1);
  const checkScale = useSharedValue(0.85);
  const checkOpacity = useSharedValue(0);
  const floatA = useSharedValue(0);
  const floatB = useSharedValue(0);
  const floatC = useSharedValue(0);

  useEffect(() => {
    triggerSuccessHaptic();
    checkOpacity.value = withTiming(1, { duration: 280 });
    checkScale.value = withSequence(
      withSpring(1.06, { damping: 12, stiffness: 180 }),
      withSpring(1, { damping: 14, stiffness: 200 }),
    );
    pulse.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 1000 }), withTiming(0.95, { duration: 1000 })),
      -1,
      false,
    );
    floatA.value = withRepeat(
      withSequence(withTiming(18, { duration: 1600 }), withTiming(0, { duration: 1600 })),
      -1,
      false,
    );
    floatB.value = withDelay(
      400,
      withRepeat(
        withSequence(withTiming(22, { duration: 1800 }), withTiming(0, { duration: 1800 })),
        -1,
        false,
      ),
    );
    floatC.value = withDelay(
      800,
      withRepeat(
        withSequence(withTiming(16, { duration: 1400 }), withTiming(0, { duration: 1400 })),
        -1,
        false,
      ),
    );
  }, [checkOpacity, checkScale, floatA, floatB, floatC, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.35 + (1.08 - pulse.value) * 0.4,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const confettiAStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatA.value }, { rotate: `${floatA.value * 4}deg` }],
    opacity: 0.85,
  }));
  const confettiBStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatB.value }, { rotate: `${-floatB.value * 3}deg` }],
    opacity: 0.75,
  }));
  const confettiCStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatC.value }, { rotate: `${floatC.value * 5}deg` }],
    opacity: 0.7,
  }));

  const handleBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const handleContinue = useCallback(() => {
    if (continuing) {
      return;
    }
    void continueAfterVerification();
  }, [continueAfterVerification, continuing]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={identityVerifiedTokens.PRIMARY}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle} accessibilityRole="header" numberOfLines={1}>
          {IDENTITY_VERIFIED_SUCCESS_SCREEN.headerTitle}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.content}>
          <View style={styles.heroWrap}>
            <Animated.View style={[styles.pulseGlow, pulseStyle]} />
            <Animated.View
              style={[
                styles.confettiDot,
                { top: -8, left: 8, backgroundColor: CONFETTI_COLORS[0] },
                confettiAStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.confettiDot,
                { top: 12, right: -4, backgroundColor: CONFETTI_COLORS[1] },
                confettiBStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.confettiDot,
                { bottom: 4, left: -6, backgroundColor: CONFETTI_COLORS[2] },
                confettiCStyle,
              ]}
            />
            <Animated.View style={[styles.checkCircle, checkStyle]}>
              <Ionicons
                name="checkmark-circle"
                size={64}
                color={identityVerifiedTokens.ON_PRIMARY_CONTAINER}
              />
            </Animated.View>
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.title}>{IDENTITY_VERIFIED_SUCCESS_SCREEN.title}</Text>
            <Text style={styles.subtitle}>{IDENTITY_VERIFIED_SUCCESS_SCREEN.subtitle}</Text>
          </View>

          <View style={styles.trustCard}>
            <View style={styles.trustLeft}>
              <View style={styles.trustIcon}>
                <Ionicons
                  name="shield-checkmark"
                  size={24}
                  color={identityVerifiedTokens.ON_SECONDARY_CONTAINER}
                />
              </View>
              <View>
                <Text style={styles.trustLabel}>{IDENTITY_VERIFIED_SUCCESS_SCREEN.trustLabel}</Text>
                <Text style={styles.trustValue}>{IDENTITY_VERIFIED_SUCCESS_SCREEN.trustValue}</Text>
              </View>
            </View>
            <View style={styles.trustRight}>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeLabel}>
                  {IDENTITY_VERIFIED_SUCCESS_SCREEN.statusBadge}
                </Text>
              </View>
              <Text style={styles.badgeUnlocked}>
                {IDENTITY_VERIFIED_SUCCESS_SCREEN.badgeUnlocked}
              </Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              continuing && { opacity: 0.7 },
              pressed && !continuing && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleContinue}
            disabled={continuing}
            accessibilityRole="button"
            accessibilityLabel={ctaLabel}
            accessibilityState={{ busy: continuing }}
          >
            <Text style={styles.ctaLabel}>{ctaLabel}</Text>
            <Ionicons name="chevron-forward" size={24} color={identityVerifiedTokens.ON_PRIMARY} />
          </Pressable>
        </View>
      </ScrollView>

      {!isAuthFlow ? <AppFooter activeTab="profile" /> : null}
    </SafeAreaView>
  );
};
