import React, { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppFooter, IconButton, SuccessHero, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import { CORPORATE_VERIFICATION_SUCCESS_SCREEN } from '@/features/office-commute/constants';
import { useCorporateVerificationSuccess } from '@/features/office-commute/hooks';
import { styles } from './CorporateVerificationSuccessScreen.styles';

export const CorporateVerificationSuccessScreen = () => {
  const { trustScore, goDashboard, goBack } = useCorporateVerificationSuccess();

  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const handleDashboard = useCallback(() => {
    triggerLightHaptic();
    goDashboard();
  }, [goDashboard]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={goBack}
          color="#374BB1"
          accessibilityLabel="Go back"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.content}>
          <SuccessHero
            title={CORPORATE_VERIFICATION_SUCCESS_SCREEN.title}
            subtitle={CORPORATE_VERIFICATION_SUCCESS_SCREEN.subtitle}
          >
            <View style={styles.metrics}>
              <View style={styles.metricCard}>
                <View>
                  <Text style={styles.metricLabel}>
                    {CORPORATE_VERIFICATION_SUCCESS_SCREEN.trustLabel}
                  </Text>
                  <Text style={styles.metricValue}>{trustScore}%</Text>
                </View>
                <View style={styles.metricIcon}>
                  <Ionicons name="shield-checkmark" size={24} color="#374BB1" />
                </View>
              </View>

              <View style={styles.metricCard}>
                <View>
                  <Text style={styles.metricLabel}>
                    {CORPORATE_VERIFICATION_SUCCESS_SCREEN.statusLabel}
                  </Text>
                  <View style={styles.statusRow}>
                    <Animated.View style={[styles.statusDot, pulseStyle]} />
                    <Text style={styles.statusValue}>
                      {CORPORATE_VERIFICATION_SUCCESS_SCREEN.statusValue}
                    </Text>
                  </View>
                </View>
                <Ionicons name="time-outline" size={28} color="#636C74" />
              </View>
            </View>
          </SuccessHero>

          <Pressable
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleDashboard}
            accessibilityRole="button"
            accessibilityLabel={CORPORATE_VERIFICATION_SUCCESS_SCREEN.ctaLabel}
          >
            <Text style={styles.ctaLabel}>{CORPORATE_VERIFICATION_SUCCESS_SCREEN.ctaLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="profile" />
    </SafeAreaView>
  );
};
