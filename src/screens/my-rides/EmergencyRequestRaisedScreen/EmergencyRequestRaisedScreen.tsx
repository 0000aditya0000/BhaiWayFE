import React, { useCallback, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { triggerLightHaptic, useExitOnBack } from '@/shared/utils';
import { EMERGENCY_REQUEST_RAISED_SCREEN } from '@/features/my-rides/constants';
import { useEmergencyRequestRaised } from '@/features/my-rides/hooks';
import { styles } from './EmergencyRequestRaisedScreen.styles';

export const EmergencyRequestRaisedScreen = () => {
  const {
    referenceNumber,
    statusMessage,
    copyReference,
    goToMyRides,
    openSupport,
  } = useEmergencyRequestRaised();

  useExitOnBack(goToMyRides);

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);
  const statusOpacity = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ),
      -1,
      false,
    );
  }, [pulseOpacity, pulseScale]);

  useEffect(() => {
    statusOpacity.value = 0;
    statusOpacity.value = withTiming(1, { duration: 300 });
  }, [statusMessage, statusOpacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const statusStyle = useAnimatedStyle(() => ({
    opacity: statusOpacity.value,
  }));

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goToMyRides();
  }, [goToMyRides]);

  const handleSupport = useCallback(() => {
    triggerLightHaptic();
    openSupport();
  }, [openSupport]);

  const handleCopy = useCallback(() => {
    triggerLightHaptic();
    copyReference();
  }, [copyReference]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.glowTop} pointerEvents="none" />
      <View style={styles.glowBottom} pointerEvents="none" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color="#374BB1"
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle}>{EMERGENCY_REQUEST_RAISED_SCREEN.title}</Text>

        <IconButton
          icon="headset-outline"
          onPress={handleSupport}
          color="#374BB1"
          accessibilityLabel={EMERGENCY_REQUEST_RAISED_SCREEN.supportLabel}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.illustrationWrap}>
          <View style={styles.illustrationGlow} />
          <Animated.View style={[styles.iconCircle, pulseStyle]}>
            <Ionicons name="hourglass-outline" size={64} color="#374BB1" />
          </Animated.View>
          <View style={styles.scheduleBadge}>
            <Ionicons name="time-outline" size={22} color="#5C6276" />
          </View>
        </View>

        <Text style={styles.heading}>{EMERGENCY_REQUEST_RAISED_SCREEN.heading}</Text>
        <Text style={styles.body}>
          {EMERGENCY_REQUEST_RAISED_SCREEN.bodyPrefix}
          <Text style={styles.bodyHighlight}>
            {EMERGENCY_REQUEST_RAISED_SCREEN.bodyHighlight}
          </Text>
        </Text>

        <View style={styles.referenceCard}>
          <View style={styles.referenceTop}>
            <View style={styles.referenceText}>
              <Text style={styles.referenceLabel}>
                {EMERGENCY_REQUEST_RAISED_SCREEN.referenceLabel}
              </Text>
              <Text style={styles.referenceNumber}>{referenceNumber}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.copyButton,
                pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] },
              ]}
              onPress={handleCopy}
              accessibilityRole="button"
              accessibilityLabel={EMERGENCY_REQUEST_RAISED_SCREEN.copyLabel}
            >
              <Ionicons name="copy-outline" size={20} color="#585E72" />
            </Pressable>
          </View>

          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Animated.Text style={[styles.statusText, statusStyle]}>
              {statusMessage}
            </Animated.Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] },
          ]}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel={EMERGENCY_REQUEST_RAISED_SCREEN.backLabel}
        >
          <Text style={styles.backLabel}>{EMERGENCY_REQUEST_RAISED_SCREEN.backLabel}</Text>
        </Pressable>
      </View>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
