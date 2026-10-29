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
import { AppFooter, IconButton, AppText as Text, WarningCallout } from '@/shared/components';
import { colors } from '@/shared/theme';
import { RIDE_PUBLISHED_SCREEN } from '@/features/offer-ride/constants/ride-published.constants';
import { useOfferRidePublished } from '@/features/offer-ride/hooks';
import { styles } from './OfferRidePublishedScreen.styles';

export const OfferRidePublishedScreen = () => {
  const {
    isAssured,
    successTitle,
    successSubtitle,
    statusLabel,
    pickupLabel,
    dropoffLabel,
    departureLabel,
    seatsLabel,
    priceLabel,
    vehicleName,
    vehiclePlate,
    preferenceChips,
    refundableAmount,
    openNotifications,
    manageMyRides,
    shareRide,
  } = useOfferRidePublished();

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

  const handleManageRides = useCallback(() => {
    manageMyRides();
  }, [manageMyRides]);

  const handleShare = useCallback(() => {
    shareRide();
  }, [shareRide]);

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
        <View style={styles.hero}>
          <View style={styles.iconArea}>
            <Animated.View style={[styles.ping, pingStyle]} />
            <Animated.View style={[styles.successCircle, checkStyle]}>
              <Ionicons name="checkmark-circle" size={44} color={colors.white} />
            </Animated.View>
          </View>
          <Text style={styles.title}>{successTitle}</Text>
          <Text style={styles.subtitle}>{successSubtitle}</Text>
          {isAssured && statusLabel ? (
            <Text style={styles.subtitle}>{statusLabel}</Text>
          ) : null}
        </View>

        <View style={styles.tripCard}>
          <View style={styles.tripBody}>
            <View style={styles.routeRow}>
              <View style={styles.routeTrack}>
                <View style={styles.routeDot} />
                <View style={styles.routeLine} />
                <Ionicons name="location" size={20} color={colors.primary} />
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

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
                <View style={styles.metaCopy}>
                  <Text style={styles.metaLabel}>{RIDE_PUBLISHED_SCREEN.dateTimeLabel}</Text>
                  <Text style={styles.metaValue}>{departureLabel}</Text>
                </View>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="people-outline" size={20} color={colors.textSecondary} />
                <View style={styles.metaCopy}>
                  <Text style={styles.metaLabel}>
                    {RIDE_PUBLISHED_SCREEN.availabilityLabel}
                  </Text>
                  <Text style={styles.metaValue}>{seatsLabel}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.fareBar}>
            <Text style={styles.fareLabel}>{RIDE_PUBLISHED_SCREEN.fareLabel}</Text>
            <Text style={styles.fareValue}>{priceLabel}</Text>
          </View>
        </View>

        <View style={styles.vehicleCard}>
          <View style={styles.vehicleRow}>
            <View style={styles.vehicleIcon}>
              <Ionicons name="car-outline" size={28} color={colors.textSecondary} />
            </View>
            <View>
              <Text style={styles.vehicleName}>{vehicleName}</Text>
              <Text style={styles.vehiclePlate}>{vehiclePlate}</Text>
            </View>
          </View>

          {preferenceChips.length > 0 ? (
            <View style={styles.chipsRow}>
              {preferenceChips.map((chip) => (
                <View key={chip.id} style={styles.chip}>
                  <Ionicons name={chip.icon} size={16} color={colors.textSecondary} />
                  <Text style={styles.chipLabel}>{chip.label}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {isAssured ? (
          <>
            <View style={styles.refundCard}>
              <View style={styles.refundLeft}>
                <View style={styles.refundIcon}>
                  <Ionicons name="wallet-outline" size={22} color={colors.warningDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.refundTitle}>
                    {RIDE_PUBLISHED_SCREEN.refundableTitle(refundableAmount)}
                  </Text>
                  <Text style={styles.refundBody}>{RIDE_PUBLISHED_SCREEN.refundableBody}</Text>
                </View>
              </View>
              <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
            </View>

            <WarningCallout
              prefix={RIDE_PUBLISHED_SCREEN.assuredNotePrefix}
              message={RIDE_PUBLISHED_SCREEN.assuredNote}
              style={styles.assuredNote}
            />
          </>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleManageRides}
            accessibilityRole="button"
            accessibilityLabel={RIDE_PUBLISHED_SCREEN.manageRidesLabel}
          >
            <Text style={styles.primaryLabel}>{RIDE_PUBLISHED_SCREEN.manageRidesLabel}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && { opacity: 0.9, backgroundColor: colors.surfaceMuted },
            ]}
            onPress={handleShare}
            accessibilityRole="button"
            accessibilityLabel={RIDE_PUBLISHED_SCREEN.shareRideLabel}
          >
            <Ionicons name="share-outline" size={18} color={colors.primary} />
            <Text style={styles.secondaryLabel}>{RIDE_PUBLISHED_SCREEN.shareRideLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
