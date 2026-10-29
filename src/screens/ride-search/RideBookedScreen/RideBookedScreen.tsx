import React, { useCallback, useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { APP_CONFIG, ROUTES } from '@/config';
import { AppFooter, IconButton, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import {
  BookedDriverCard,
  BookedRideDetailsCard,
} from '@/features/ride-search/components';
import { BOOKED_SCREEN } from '@/features/ride-search/constants';
import { useBookedRide } from '@/features/ride-search/hooks';
import type { RideType } from '@/features/ride-search/types';
import { styles } from './RideBookedScreen.styles';

const isRideType = (value: string): value is RideType =>
  value === 'regular' || value === 'assured';

export const RideBookedScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rideId?: string;
    rideType?: string;
    bookingId?: string;
    origin?: string;
    destination?: string;
    driverName?: string;
    carModel?: string;
    price?: string;
    seats?: string;
    originLat?: string;
    originLng?: string;
    destinationLat?: string;
    destinationLng?: string;
  }>();

  const rideTypeParam = getSearchParam(params.rideType);
  const rideType: RideType = isRideType(rideTypeParam) ? rideTypeParam : 'regular';
  const priceParam = Number(getSearchParam(params.price));
  const seatsParam = Number(getSearchParam(params.seats));
  const originLat = Number(getSearchParam(params.originLat));
  const originLng = Number(getSearchParam(params.originLng));
  const destinationLat = Number(getSearchParam(params.destinationLat));
  const destinationLng = Number(getSearchParam(params.destinationLng));

  const {
    details,
    meetMessage,
    isAssured,
    trackRide,
    viewRideDetails,
    chatDriver,
    callDriver,
  } = useBookedRide({
    rideId: getSearchParam(params.rideId) || 'ride-default',
    rideType,
    bookingId: getSearchParam(params.bookingId) || undefined,
    origin: getSearchParam(params.origin),
    destination: getSearchParam(params.destination),
    driverName: getSearchParam(params.driverName),
    carModel: getSearchParam(params.carModel),
    price: Number.isFinite(priceParam) ? priceParam : undefined,
    seats: Number.isFinite(seatsParam) && seatsParam > 0 ? seatsParam : undefined,
    originLat: Number.isFinite(originLat) ? originLat : undefined,
    originLng: Number.isFinite(originLng) ? originLng : undefined,
    destinationLat: Number.isFinite(destinationLat) ? destinationLat : undefined,
    destinationLng: Number.isFinite(destinationLng) ? destinationLng : undefined,
  });

  const checkScale = useSharedValue(0.3);
  const checkOpacity = useSharedValue(0);

  useEffect(() => {
    checkOpacity.value = withTiming(1, { duration: 280 });
    checkScale.value = withSequence(
      withSpring(1.05, { damping: 10, stiffness: 180 }),
      withSpring(0.9, { damping: 12, stiffness: 220 }),
      withSpring(1, { damping: 14, stiffness: 200 }),
    );
  }, [checkOpacity, checkScale]);

  const checkAnimatedStyle = useAnimatedStyle(() => ({
    opacity: checkOpacity.value,
    transform: [{ scale: checkScale.value }],
  }));

  const handleMenuPress = useCallback(() => {
    router.replace(ROUTES.home);
  }, [router]);

  const handleNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  const handleTrack = useCallback(() => {
    triggerLightHaptic();
    trackRide();
  }, [trackRide]);

  const handleRideDetails = useCallback(() => {
    triggerLightHaptic();
    viewRideDetails();
  }, [viewRideDetails]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="menu"
            onPress={handleMenuPress}
            size={26}
            color={colors.primary}
            accessibilityLabel="Open menu"
          />
          <Text style={styles.brandName} accessibilityRole="header">
            {APP_CONFIG.name}
          </Text>
        </View>
        <IconButton
          icon="notifications-outline"
          onPress={handleNotifications}
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
          <Animated.View style={[styles.checkWrap, checkAnimatedStyle]}>
            <Ionicons name="checkmark-circle" size={48} color={colors.white} />
          </Animated.View>
          <Text style={styles.title}>{BOOKED_SCREEN.title}</Text>
          <Text style={styles.subtitle}>{meetMessage}</Text>
        </View>

        {isAssured ? (
          <View style={styles.assuredRefund}>
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
            <Text style={styles.assuredRefundText}>{BOOKED_SCREEN.assuredRefundNote}</Text>
          </View>
        ) : null}

        <View style={styles.detailsCardWrap}>
          <BookedRideDetailsCard details={details} />
        </View>

        <View style={styles.driverWrap}>
          <BookedDriverCard
            name={details.driverName}
            subtitle={details.driverSubtitle}
            onChat={chatDriver}
            onCall={callDriver}
          />
        </View>

        {isAssured ? (
          <View style={styles.cancelNote}>
            <Ionicons name="information-circle" size={18} color="#374BB1" />
            <Text style={styles.cancelNoteText}>{BOOKED_SCREEN.assuredCancelNote}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [
              styles.trackButton,
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleTrack}
            accessibilityRole="button"
            accessibilityLabel="Track my ride"
          >
            <Text style={styles.trackLabel}>{BOOKED_SCREEN.trackLabel}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.detailsButton,
              pressed && { backgroundColor: '#EFF4FF', transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleRideDetails}
            accessibilityRole="button"
            accessibilityLabel="View ride details"
          >
            <Text style={styles.detailsLabel}>{BOOKED_SCREEN.rideDetailsActionLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
