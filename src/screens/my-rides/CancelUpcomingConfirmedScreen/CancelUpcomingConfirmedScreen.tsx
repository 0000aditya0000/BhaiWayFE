import React, { useCallback, useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic, useExitOnBack } from '@/shared/utils';
import { CANCEL_UPCOMING_CONFIRMED_SCREEN } from '@/features/my-rides/constants';
import { useCancelUpcomingConfirmed } from '@/features/my-rides/hooks';
import { styles } from './CancelUpcomingConfirmedScreen.styles';

export const CancelUpcomingConfirmedScreen = () => {
  const { heading, subtitle, detailLines, showAssuredPassengerResult, backLabel, goToMyRides } =
    useCancelUpcomingConfirmed();
  useExitOnBack(goToMyRides);

  const iconScale = useSharedValue(0.8);
  const iconOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslate = useSharedValue(12);
  const subtitleOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.2);

  useEffect(() => {
    iconOpacity.value = withTiming(1, { duration: 280 });
    iconScale.value = withSpring(1, { damping: 12, stiffness: 180 });
    textOpacity.value = withDelay(100, withTiming(1, { duration: 320 }));
    textTranslate.value = withDelay(100, withSpring(0, { damping: 14, stiffness: 160 }));
    subtitleOpacity.value = withDelay(200, withTiming(1, { duration: 360 }));

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 900, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withSequence(withTiming(0.08, { duration: 900 }), withTiming(0.2, { duration: 900 })),
      -1,
      false,
    );
  }, [
    iconOpacity,
    iconScale,
    pulseOpacity,
    pulseScale,
    subtitleOpacity,
    textOpacity,
    textTranslate,
  ]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: iconOpacity.value,
    transform: [{ scale: iconScale.value }],
  }));

  const headingAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslate.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goToMyRides();
  }, [goToMyRides]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={handleBack}
          color={colors.primary}
          accessibilityLabel="Go back"
        />
        <Text style={styles.headerTitle}>{CANCEL_UPCOMING_CONFIRMED_SCREEN.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconStack}>
          <Animated.View style={[styles.pulseOuter, pulseAnimatedStyle]} />
          <View style={styles.pulseInner} />
          <Animated.View style={[styles.iconCircle, iconAnimatedStyle]}>
            <Ionicons name="close" size={48} color="#BA1A1A" />
          </Animated.View>
        </View>

        <Animated.Text style={[styles.heading, headingAnimatedStyle]}>
          {heading}
        </Animated.Text>
        {showAssuredPassengerResult ? (
          <Animated.View style={[styles.detailList, subtitleAnimatedStyle]}>
            {detailLines.map((line) => (
              <Text key={line} style={styles.detailLine}>
                {line}
              </Text>
            ))}
          </Animated.View>
        ) : (
          <Animated.Text style={[styles.subtitle, subtitleAnimatedStyle]}>
            {subtitle}
          </Animated.Text>
        )}
      </View>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel={backLabel}
        >
          <Text style={styles.backLabel}>{backLabel}</Text>
        </Pressable>
      </View>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
