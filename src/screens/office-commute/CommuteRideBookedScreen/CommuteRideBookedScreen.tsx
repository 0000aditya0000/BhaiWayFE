import React, { useCallback, useEffect } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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
import { AppFooter, AppText as Text } from '@/shared/components';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { COMMUTE_RIDE_BOOKED_SCREEN } from '@/features/office-commute/constants';
import { useCommuteRideBooked } from '@/features/office-commute/hooks';
import { styles } from './CommuteRideBookedScreen.styles';

export const CommuteRideBookedScreen = () => {
  const params = useLocalSearchParams<{
    rideId?: string;
    origin?: string;
    destination?: string;
    driverName?: string;
    carModel?: string;
    price?: string;
    originLat?: string;
    originLng?: string;
    destinationLat?: string;
    destinationLng?: string;
  }>();

  const priceParam = Number(getSearchParam(params.price));
  const originLat = Number(getSearchParam(params.originLat));
  const originLng = Number(getSearchParam(params.originLng));
  const destinationLat = Number(getSearchParam(params.destinationLat));
  const destinationLng = Number(getSearchParam(params.destinationLng));

  const {
    details,
    openNotifications,
    messageDriver,
    callDriver,
    trackRide,
    openRideOptions,
  } = useCommuteRideBooked({
    rideId: getSearchParam(params.rideId) || 'ride-default',
    origin: getSearchParam(params.origin),
    destination: getSearchParam(params.destination),
    driverName: getSearchParam(params.driverName),
    carModel: getSearchParam(params.carModel),
    price: Number.isFinite(priceParam) ? priceParam : undefined,
    originLat: Number.isFinite(originLat) ? originLat : undefined,
    originLng: Number.isFinite(originLng) ? originLng : undefined,
    destinationLat: Number.isFinite(destinationLat) ? destinationLat : undefined,
    destinationLng: Number.isFinite(destinationLng) ? destinationLng : undefined,
  });

  const checkScale = useSharedValue(0.6);
  const checkOpacity = useSharedValue(0);
  const etaPulse = useSharedValue(1);

  useEffect(() => {
    checkOpacity.value = withTiming(1, { duration: 320 });
    checkScale.value = withSequence(
      withSpring(1.08, { damping: 10, stiffness: 180 }),
      withSpring(1, { damping: 14, stiffness: 200 }),
    );
    etaPulse.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false,
    );
  }, [checkOpacity, checkScale, etaPulse]);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const etaDotStyle = useAnimatedStyle(() => ({
    opacity: etaPulse.value,
  }));

  const firstName = details.driverName.split(' ')[0] || details.driverName;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brandName}>{APP_CONFIG.name}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [styles.notifyBtn, pressed && { opacity: 0.7 }]}
          onPress={openNotifications}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <Ionicons name="notifications-outline" size={22} color="#374BB1" />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Animated.View style={[styles.checkWrap, checkStyle]}>
            <Ionicons name="checkmark-circle" size={40} color="#000000" />
          </Animated.View>
          <Text style={styles.title} accessibilityRole="header">
            {COMMUTE_RIDE_BOOKED_SCREEN.title}
          </Text>
          <Text style={styles.subtitle}>{COMMUTE_RIDE_BOOKED_SCREEN.subtitle}</Text>
        </View>

        <View style={styles.driverCard}>
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: details.driverAvatarUri }}
              style={styles.avatar}
              accessibilityLabel={`${details.driverName} photo`}
            />
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#000000" />
            </View>
          </View>
          <View style={styles.driverMeta}>
            <View style={styles.driverTopRow}>
              <Text style={styles.driverName} numberOfLines={1}>
                {details.driverName}
              </Text>
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={14} color="#000000" />
                <Text style={styles.ratingText}>{details.driverRating.toFixed(1)}</Text>
              </View>
            </View>
            <Text style={styles.vehicleText}>{details.vehicleLabel}</Text>
            <View style={styles.contactRow}>
              <Pressable
                style={({ pressed }) => [styles.contactBtn, pressed && { opacity: 0.7 }]}
                onPress={messageDriver}
                accessibilityRole="button"
                accessibilityLabel="Message driver"
              >
                <Ionicons name="chatbubble-outline" size={14} color="#374BB1" />
                <Text style={styles.contactLabel}>{COMMUTE_RIDE_BOOKED_SCREEN.messageLabel}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.contactBtn, pressed && { opacity: 0.7 }]}
                onPress={callDriver}
                accessibilityRole="button"
                accessibilityLabel="Call driver"
              >
                <Ionicons name="call-outline" size={14} color="#374BB1" />
                <Text style={styles.contactLabel}>{COMMUTE_RIDE_BOOKED_SCREEN.callLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.tripCard}>
          <View style={styles.tripMetaRow}>
            <View style={styles.tripMetaItem}>
              <Ionicons name="calendar-outline" size={18} color="#45464D" />
              <Text style={styles.tripMetaText}>{details.dateLabel}</Text>
            </View>
            <View style={styles.tripMetaItem}>
              <Ionicons name="time-outline" size={18} color="#45464D" />
              <Text style={styles.tripMetaText}>{details.timeLabel}</Text>
            </View>
          </View>

          <View style={styles.routeList}>
            <View style={styles.routeDash} />
            <View style={styles.stopRow}>
              <View style={styles.stopDotOuter} />
              <View style={styles.stopContent}>
                <Text style={styles.stopLabel}>{COMMUTE_RIDE_BOOKED_SCREEN.pickupLabel}</Text>
                <Text style={styles.stopTitle}>{details.pickupTitle}</Text>
                <Text style={styles.stopAddress}>{details.pickupAddress}</Text>
              </View>
            </View>
            <View style={styles.stopRow}>
              <View style={styles.stopDotFilled} />
              <View style={styles.stopContent}>
                <Text style={styles.stopLabel}>{COMMUTE_RIDE_BOOKED_SCREEN.dropoffLabel}</Text>
                <Text style={styles.stopTitle}>{details.dropoffTitle}</Text>
                <Text style={styles.stopAddress}>{details.dropoffAddress}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.mapWrap}>
          <Image
            source={{ uri: details.mapImageUri }}
            style={styles.mapImage}
            resizeMode="cover"
            accessibilityLabel="Route map preview"
          />
          <View style={styles.etaBadge}>
            <Animated.View style={[styles.etaDot, etaDotStyle]} />
            <Text style={styles.etaText}>
              {firstName} is {COMMUTE_RIDE_BOOKED_SCREEN.etaBadge(details.etaMinutes)}
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.locateBtn, pressed && { transform: [{ scale: 0.95 }] }]}
            accessibilityRole="button"
            accessibilityLabel="Center map on my location"
          >
            <Ionicons name="locate-outline" size={20} color="#191C1D" />
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.trackButton, pressed && { opacity: 0.92 }]}
            onPress={trackRide}
            accessibilityRole="button"
            accessibilityLabel={COMMUTE_RIDE_BOOKED_SCREEN.trackLabel}
          >
            <Ionicons name="navigate" size={22} color="#FFFFFF" />
            <Text style={styles.trackLabel}>{COMMUTE_RIDE_BOOKED_SCREEN.trackLabel}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.optionsButton,
              pressed && { backgroundColor: '#EFF4FF' },
            ]}
            onPress={openRideOptions}
            accessibilityRole="button"
            accessibilityLabel={COMMUTE_RIDE_BOOKED_SCREEN.optionsLabel}
          >
            <Text style={styles.optionsLabel}>{COMMUTE_RIDE_BOOKED_SCREEN.optionsLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
