import React, { useCallback } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import { AppFooter, Button, IconButton, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { formatBhaiWayCoins, getSearchParam, triggerLightHaptic } from '@/shared/utils';
import {
  RideDetailsCoPassengers,
  RideDetailsDriverCard,
  RideDetailsFareCard,
  RideDetailsRouteCard,
  RideDetailsRulesCard,
  RideDetailsScheduleCard,
} from '@/features/ride-search/components';
import { RIDE_DETAILS_SCREEN } from '@/features/ride-search/constants';
import { useRideDetails } from '@/features/ride-search/hooks';
import type { RideDetailsMode, RideType } from '@/features/ride-search/types';
import { styles } from './RideDetailsScreen.styles';

const isRideType = (value: string): value is RideType =>
  value === 'regular' || value === 'assured';

const isRideDetailsMode = (value: string): value is RideDetailsMode =>
  value === 'preview' || value === 'booked';

export const RideDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rideId?: string;
    rideType?: string;
    mode?: string;
    origin?: string;
    destination?: string;
    driverName?: string;
    carModel?: string;
    price?: string;
    distanceLabel?: string;
    durationLabel?: string;
    dateLabel?: string;
    departureTime?: string;
    originLat?: string;
    originLng?: string;
    destinationLat?: string;
    destinationLng?: string;
  }>();

  const rideTypeParam = getSearchParam(params.rideType);
  const rideType: RideType = isRideType(rideTypeParam) ? rideTypeParam : 'regular';
  const modeParam = getSearchParam(params.mode);
  const mode: RideDetailsMode = isRideDetailsMode(modeParam) ? modeParam : 'preview';
  const priceParam = Number(getSearchParam(params.price));
  const originLat = Number(getSearchParam(params.originLat));
  const originLng = Number(getSearchParam(params.originLng));
  const destinationLat = Number(getSearchParam(params.destinationLat));
  const destinationLng = Number(getSearchParam(params.destinationLng));

  const {
    details,
    isPreview,
    routeCoordinates,
    bookRide,
    contactDriver,
    cancelRide,
    chatPassenger,
    openMore,
  } = useRideDetails({
    rideId: getSearchParam(params.rideId) || 'ride-default',
    rideType,
    mode,
    origin: getSearchParam(params.origin),
    destination: getSearchParam(params.destination),
    driverName: getSearchParam(params.driverName),
    carModel: getSearchParam(params.carModel),
    price: Number.isFinite(priceParam) ? priceParam : undefined,
    distanceLabel: getSearchParam(params.distanceLabel) || undefined,
    durationLabel: getSearchParam(params.durationLabel) || undefined,
    dateLabel: getSearchParam(params.dateLabel) || undefined,
    departureTime: getSearchParam(params.departureTime) || undefined,
    originLat: Number.isFinite(originLat) ? originLat : undefined,
    originLng: Number.isFinite(originLng) ? originLng : undefined,
    destinationLat: Number.isFinite(destinationLat) ? destinationLat : undefined,
    destinationLng: Number.isFinite(destinationLng) ? destinationLng : undefined,
  });

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(isPreview ? ROUTES.rideSearchResult : ROUTES.rideSearchBooked);
  }, [isPreview, router]);

  const handleBook = useCallback(() => {
    triggerLightHaptic();
    bookRide();
  }, [bookRide]);

  const handleContact = useCallback(() => {
    triggerLightHaptic();
    contactDriver();
  }, [contactDriver]);

  const handleCancel = useCallback(() => {
    triggerLightHaptic();
    cancelRide();
  }, [cancelRide]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color={colors.primary}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle}>{RIDE_DETAILS_SCREEN.title}</Text>

        <IconButton
          icon="ellipsis-vertical"
          onPress={openMore}
          color={colors.primary}
          accessibilityLabel="More options"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          isPreview && styles.scrollContentWithFooter,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <RideDetailsScheduleCard dateTimeLabel={details.dateTimeLabel} />

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Ionicons name="navigate-outline" size={14} color={colors.primary} />
            <Text style={styles.statText}>{details.distanceLabel}</Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={styles.statText}>{details.durationLabel}</Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="car-outline" size={14} color={colors.primary} />
            <Text style={styles.statText}>
              {details.seatsLeft}{' '}
              {details.seatsLeft === 1
                ? RIDE_DETAILS_SCREEN.seatsLeftLabel
                : RIDE_DETAILS_SCREEN.seatsLeftPluralLabel}
            </Text>
          </View>
        </View>

        <RideDetailsRouteCard
          pickup={details.pickup}
          dropoff={details.dropoff}
          routeCoordinates={routeCoordinates}
        />

        <RideDetailsDriverCard driver={details.driver} />

        <RideDetailsRulesCard rules={details.rules} />

        {!isPreview ? (
          <RideDetailsCoPassengers
            passengers={details.coPassengers}
            maxPassengers={details.maxPassengers}
            seatsLeft={details.seatsLeft}
            onChat={chatPassenger}
          />
        ) : null}

        <RideDetailsFareCard fare={details.fare} />

        {!isPreview ? (
          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && {
                  backgroundColor: 'rgba(186, 26, 26, 0.05)',
                  transform: [{ scale: 0.98 }],
                },
              ]}
              onPress={handleCancel}
              accessibilityRole="button"
              accessibilityLabel="Cancel ride"
            >
              <Text style={styles.cancelLabel}>{RIDE_DETAILS_SCREEN.cancelLabel}</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.previewHint}>{RIDE_DETAILS_SCREEN.previewFooterHint}</Text>
        )}
      </ScrollView>

      {isPreview ? (
        <View style={styles.bookingBar}>
          <View style={styles.bookingPriceCol}>
            <Text style={styles.bookingPriceLabel}>{RIDE_DETAILS_SCREEN.totalLabel}</Text>
            <Text style={styles.bookingPrice}>
              {formatBhaiWayCoins(details.fare.total, { spaced: false })}
            </Text>
          </View>
          <View style={styles.bookingActions}>
            <Pressable
              style={({ pressed }) => [
                styles.contactButton,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleContact}
              accessibilityRole="button"
              accessibilityLabel={RIDE_DETAILS_SCREEN.contactDriverLabel}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
            </Pressable>
            <Button
              label={RIDE_DETAILS_SCREEN.bookLabel}
              onPress={handleBook}
              fullWidth={false}
              style={styles.bookButton}
              accessibilityLabel={RIDE_DETAILS_SCREEN.bookLabel}
            />
          </View>
        </View>
      ) : null}

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
