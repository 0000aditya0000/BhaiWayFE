import React, { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { APP_CONFIG } from '@/config';
import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { RIDE_PUBLISHED_SCREEN } from '@/features/office-commute/constants';
import { useRidePublished } from '@/features/office-commute/hooks';
import { styles } from './RidePublishedScreen.styles';

export const RidePublishedScreen = () => {
  const {
    pickupLabel,
    dropoffLabel,
    departureLabel,
    seatsLabel,
    priceLabel,
    dayChips,
    isOneTime,
    occurrenceSummary,
    openNotifications,
    viewMyRides,
    modifyRide,
  } = useRidePublished();

  const checkScale = useSharedValue(0.7);
  const checkOpacity = useSharedValue(0);
  const pingScale = useSharedValue(1);
  const pingOpacity = useSharedValue(0.35);

  useEffect(() => {
    checkOpacity.value = withTiming(1, { duration: 280 });
    checkScale.value = withSequence(
      withSpring(1.08, { damping: 10, stiffness: 180 }),
      withSpring(1, { damping: 14, stiffness: 200 }),
    );
    pingScale.value = withRepeat(
      withSequence(withTiming(1.35, { duration: 900 }), withTiming(1, { duration: 0 })),
      -1,
      false,
    );
    pingOpacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 900 }), withTiming(0.35, { duration: 0 })),
      -1,
      false,
    );
  }, [checkOpacity, checkScale, pingOpacity, pingScale]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const pingStyle = useAnimatedStyle(() => ({
    opacity: pingOpacity.value,
    transform: [{ scale: pingScale.value }],
  }));

  const handleViewRides = useCallback(() => {
    triggerLightHaptic();
    viewMyRides();
  }, [viewMyRides]);

  const handleModify = useCallback(() => {
    triggerLightHaptic();
    modifyRide();
  }, [modifyRide]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.brand}>{APP_CONFIG.name || RIDE_PUBLISHED_SCREEN.brandName}</Text>
        <IconButton
          icon="notifications-outline"
          onPress={openNotifications}
          color={colors.primary}
          accessibilityLabel="Notifications"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.iconArea}>
            <Animated.View style={[styles.ping, pingStyle]} />
            <Animated.View style={[styles.successCircle, checkStyle]}>
              <Ionicons name="checkmark-circle" size={48} color={colors.white} />
            </Animated.View>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.title}>{RIDE_PUBLISHED_SCREEN.title}</Text>
            <Text style={styles.subtitle}>{RIDE_PUBLISHED_SCREEN.subtitle}</Text>
          </View>

          <View style={styles.section}>
            <View style={styles.routeCard}>
              <View style={styles.routeRow}>
                <View style={styles.routeTrack}>
                  <View style={styles.routeDot} />
                  <View style={styles.routeLine} />
                  <Ionicons name="location" size={20} color="#191C1D" />
                </View>
                <View style={styles.routeStops}>
                  <View>
                    <Text style={styles.stopLabel}>{RIDE_PUBLISHED_SCREEN.pickupLabel}</Text>
                    <Text style={styles.stopValue}>{pickupLabel}</Text>
                  </View>
                  <View>
                    <Text style={styles.stopLabel}>{RIDE_PUBLISHED_SCREEN.dropLabel}</Text>
                    <Text style={styles.stopValue}>{dropoffLabel}</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons
                  name="time-outline"
                  size={22}
                  color="#7C839B"
                  style={styles.statIcon}
                />
                <Text style={styles.statLabel}>{RIDE_PUBLISHED_SCREEN.timingLabel}</Text>
                <Text style={styles.statValue}>{departureLabel}</Text>
                {isOneTime ? (
                  <Text style={styles.oneTime}>{RIDE_PUBLISHED_SCREEN.oneTimeLabel}</Text>
                ) : (
                  <View style={styles.daysRow}>
                    {dayChips.map((day) => (
                      <View key={day.id} style={styles.dayChip}>
                        <Text style={styles.dayChipLabel}>{day.label}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.statCard}>
                <Ionicons
                  name="car-sport-outline"
                  size={22}
                  color="#7C839B"
                  style={styles.statIcon}
                />
                <Text style={styles.statLabel}>{RIDE_PUBLISHED_SCREEN.capacityLabel}</Text>
                <Text style={styles.statValue}>{seatsLabel}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceValue}>{priceLabel}</Text>
                  <Text style={styles.priceSuffix}>{RIDE_PUBLISHED_SCREEN.perSeatLabel}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleViewRides}
          accessibilityRole="button"
          accessibilityLabel={RIDE_PUBLISHED_SCREEN.viewRidesLabel}
        >
          <Text style={styles.primaryLabel}>{RIDE_PUBLISHED_SCREEN.viewRidesLabel}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && { opacity: 0.9, backgroundColor: '#EFF4FF' },
          ]}
          onPress={handleModify}
          accessibilityRole="button"
          accessibilityLabel={RIDE_PUBLISHED_SCREEN.modifyLabel}
        >
          <Ionicons name="create-outline" size={18} color="#191C1D" />
          <Text style={styles.secondaryLabel}>{RIDE_PUBLISHED_SCREEN.modifyLabel}</Text>
        </Pressable>
      </View>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
