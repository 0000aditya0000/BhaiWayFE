import React, { useCallback, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ROUTES } from '@/config';
import {
  AppFooter,
  AppText as Text,
  Button,
  IconButton,
  KeyboardAwareScrollView,
  ScreenHeader,
} from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { getSearchParam } from '@/shared/utils';
import {
  ReviewBookingAssuredSection,
  ReviewBookingDriverCard,
  ReviewBookingFareCard,
  ReviewBookingMapPreview,
  ReviewBookingPromoSection,
  ReviewBookingRouteCard,
  PassengerStepper,
} from '@/features/ride-search/components';
import { REVIEW_BOOKING_SCREEN } from '@/features/ride-search/constants';
import { useReviewBooking } from '@/features/ride-search/hooks';
import type { RideType } from '@/features/ride-search/types';
import { styles } from './ReviewBookingScreen.styles';

const PROMO_TOP_GAP = spacing.md;

const isRideType = (value: string): value is RideType =>
  value === 'regular' || value === 'assured';

export const ReviewBookingScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    rideId?: string;
    rideType?: string;
    origin?: string;
    destination?: string;
    driverName?: string;
    carModel?: string;
    price?: string;
    seats?: string;
    availableSeats?: string;
    dateLabel?: string;
    departureTime?: string;
    originLat?: string;
    originLng?: string;
    destinationLat?: string;
    destinationLng?: string;
  }>();

  const rideTypeParam = getSearchParam(params.rideType);
  const rideType: RideType = isRideType(rideTypeParam) ? rideTypeParam : 'regular';
  const priceParam = Number(getSearchParam(params.price));
  const seatsParam = Number(getSearchParam(params.seats));
  const availableSeatsParam = Number(getSearchParam(params.availableSeats));
  const originLat = Number(getSearchParam(params.originLat));
  const originLng = Number(getSearchParam(params.originLng));
  const destinationLat = Number(getSearchParam(params.destinationLat));
  const destinationLng = Number(getSearchParam(params.destinationLng));

  const {
    booking,
    routeCoordinates,
    promoInput,
    promoApplied,
    promoApplying,
    promoError,
    selectedSeats,
    maxSeats,
    isRegular,
    isAssured,
    assuredLoadState,
    assuredErrorMessage,
    canConfirmAssured,
    assuredDepositPercentage,
    assuredDepositPenaltyNotice,
    retryAssuredLoad,
    setSelectedSeats,
    setPromoInput,
    applyPromo,
    clearPromo,
    openAvailableCoupons,
    confirmBooking,
  } = useReviewBooking({
    rideId: getSearchParam(params.rideId) || 'ride-default',
    rideType,
    origin: getSearchParam(params.origin),
    destination: getSearchParam(params.destination),
    driverName: getSearchParam(params.driverName),
    carModel: getSearchParam(params.carModel),
    price: Number.isFinite(priceParam) ? priceParam : undefined,
    seats: Number.isFinite(seatsParam) && seatsParam > 0 ? seatsParam : undefined,
    availableSeats:
      Number.isFinite(availableSeatsParam) && availableSeatsParam > 0
        ? availableSeatsParam
        : undefined,
    dateLabel: getSearchParam(params.dateLabel),
    departureTime: getSearchParam(params.departureTime),
    originLat: Number.isFinite(originLat) ? originLat : undefined,
    originLng: Number.isFinite(originLng) ? originLng : undefined,
    destinationLat: Number.isFinite(destinationLat) ? destinationLat : undefined,
    destinationLng: Number.isFinite(destinationLng) ? destinationLng : undefined,
  });

  const scrollRef = useRef<ScrollView>(null);
  const promoOffsetY = useRef(0);
  const promoFocusedRef = useRef(false);

  const scrollPromoIntoView = useCallback(() => {
    scrollRef.current?.scrollTo({
      y: Math.max(0, promoOffsetY.current - PROMO_TOP_GAP),
      animated: true,
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const subscription = Keyboard.addListener(showEvent, () => {
      if (!promoFocusedRef.current) {
        return;
      }
      scrollPromoIntoView();
    });

    return () => subscription.remove();
  }, [scrollPromoIntoView]);

  const handlePromoLayout = useCallback((event: LayoutChangeEvent) => {
    promoOffsetY.current = event.nativeEvent.layout.y;
  }, []);

  const handlePromoFocus = useCallback(() => {
    promoFocusedRef.current = true;
    requestAnimationFrame(scrollPromoIntoView);
  }, [scrollPromoIntoView]);

  const handlePromoBlur = useCallback(() => {
    promoFocusedRef.current = false;
  }, []);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);

  const handleNotifications = useCallback(() => {
    router.push(ROUTES.notifications);
  }, [router]);

  const handleEditRoute = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    }
  }, [router]);

  const header = (
    <ScreenHeader
      title={REVIEW_BOOKING_SCREEN.title}
      onBack={handleBack}
      right={
        <IconButton
          icon="notifications-outline"
          onPress={handleNotifications}
          color={colors.primary}
          accessibilityLabel="Open notifications"
        />
      }
    />
  );

  if (isAssured && assuredLoadState === 'loading') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {header}
        <View style={styles.centerState} accessibilityLabel="Loading Assured ride details">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.centerStateText}>{REVIEW_BOOKING_SCREEN.loadingLabel}</Text>
        </View>
        <AppFooter activeTab="rides" />
      </SafeAreaView>
    );
  }

  if (isAssured && (assuredLoadState === 'error' || assuredLoadState === 'unavailable')) {
    const isUnavailable = assuredLoadState === 'unavailable';
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {header}
        <View style={styles.centerState}>
          <Text style={styles.centerStateTitle}>
            {isUnavailable
              ? REVIEW_BOOKING_SCREEN.unavailableTitle
              : REVIEW_BOOKING_SCREEN.loadErrorTitle}
          </Text>
          <Text style={styles.centerStateText}>
            {assuredErrorMessage ||
              (isUnavailable
                ? REVIEW_BOOKING_SCREEN.unavailableBody
                : 'Could not load this Assured ride. Please try again.')}
          </Text>
          {isUnavailable ? (
            <Pressable
              style={styles.retryBtn}
              onPress={handleBack}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.retryLabel}>Back</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.retryBtn}
              onPress={retryAssuredLoad}
              accessibilityRole="button"
              accessibilityLabel="Retry loading ride"
            >
              <Text style={styles.retryLabel}>{REVIEW_BOOKING_SCREEN.loadErrorRetry}</Text>
            </Pressable>
          )}
        </View>
        <AppFooter activeTab="rides" />
      </SafeAreaView>
    );
  }

  const confirmDisabled = isAssured && !canConfirmAssured;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {header}

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        scrollViewRef={scrollRef}
        footer={
          <View style={styles.footer}>
            <Button
              label={
                isRegular
                  ? REVIEW_BOOKING_SCREEN.confirmRegularLabel
                  : REVIEW_BOOKING_SCREEN.confirmLabel
              }
              onPress={confirmBooking}
              showArrow
              disabled={confirmDisabled}
              accessibilityLabel="Confirm booking and continue to payment"
            />
          </View>
        }
      >
        <ReviewBookingMapPreview
          pickup={booking.pickup}
          dropoff={booking.dropoff}
          routeCoordinates={routeCoordinates}
          distanceLabel={booking.distanceLabel}
          durationLabel={booking.durationLabel}
        />

        <ReviewBookingRouteCard
          pickup={booking.pickup}
          dropoff={booking.dropoff}
          onEditPickup={handleEditRoute}
          onEditDropoff={handleEditRoute}
        />

        <ReviewBookingDriverCard driver={booking.driver} />

        <PassengerStepper
          value={selectedSeats}
          min={1}
          max={maxSeats}
          onChange={setSelectedSeats}
        />

        <View onLayout={handlePromoLayout}>
          <ReviewBookingPromoSection
            value={promoInput}
            applied={promoApplied}
            applying={promoApplying}
            discount={booking.fare.promoDiscount}
            error={promoError}
            onChange={setPromoInput}
            onApply={applyPromo}
            onClear={clearPromo}
            onViewAvailableCoupons={openAvailableCoupons}
            onFocus={handlePromoFocus}
            onBlur={handlePromoBlur}
          />
        </View>

        {isAssured ? (
          <ReviewBookingAssuredSection
            fee={booking.fare.assuredFee}
            percentage={assuredDepositPercentage}
            showPreviousCancellationNotice={
              assuredDepositPenaltyNotice.showPreviousCancellationNotice
            }
            penaltyPercentage={assuredDepositPenaltyNotice.percentage}
          />
        ) : null}

        <ReviewBookingFareCard
          fare={booking.fare}
          showAssuredFee={isAssured}
          showPlatformFee={!isRegular && booking.fare.platformFee > 0}
        />
      </KeyboardAwareScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
