import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AppFooter,
  BrandTopBar,
  IconButton,
  KeyboardAwareScrollView,
  ScreenIntro,
  AppText as Text,
} from '@/shared/components';
import { colors } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { HomeLoader } from '@/features/home/components';
import {
  CommuteBookingMapHero,
  CommutePaymentSummary,
  CommuteRideAlongsSection,
} from '@/features/office-commute/components';
import { COMMUTE_REVIEW_BOOKING_SCREEN } from '@/features/office-commute/constants';
import { useCommuteReviewBooking } from '@/features/office-commute/hooks';
import { ReviewBookingPromoSection } from '@/features/ride-search/components';
import { styles } from './CommuteReviewBookingScreen.styles';

export const CommuteReviewBookingScreen = () => {
  const params = useLocalSearchParams<{
    rideId?: string;
    origin?: string;
    destination?: string;
    driverName?: string;
    carModel?: string;
    price?: string;
    dateLabel?: string;
    departureTime?: string;
    originLat?: string;
    originLng?: string;
    destinationLat?: string;
    destinationLng?: string;
    matchPercent?: string;
  }>();

  const priceParam = Number(getSearchParam(params.price));
  const matchPercentParam = Number(getSearchParam(params.matchPercent));
  const originLat = Number(getSearchParam(params.originLat));
  const originLng = Number(getSearchParam(params.originLng));
  const destinationLat = Number(getSearchParam(params.destinationLat));
  const destinationLng = Number(getSearchParam(params.destinationLng));

  const {
    booking,
    selectedSeats,
    maxSeats,
    loadState,
    errorMessage,
    routeCoordinates,
    confirming,
    promoInput,
    promoApplied,
    promoApplying,
    promoDiscount,
    promoError,
    displayFareTotal,
    setPromoInput,
    applyPromo,
    clearPromo,
    openAvailableCoupons,
    setSelectedSeats,
    confirmBooking,
    retryLoad,
    goBack,
    openNotifications,
  } = useCommuteReviewBooking({
    rideId: getSearchParam(params.rideId) || '',
    origin: getSearchParam(params.origin),
    destination: getSearchParam(params.destination),
    driverName: getSearchParam(params.driverName),
    carModel: getSearchParam(params.carModel),
    price: Number.isFinite(priceParam) ? priceParam : undefined,
    dateLabel: getSearchParam(params.dateLabel),
    departureTime: getSearchParam(params.departureTime),
    matchPercent: Number.isFinite(matchPercentParam) ? matchPercentParam : undefined,
    originLat: Number.isFinite(originLat) ? originLat : undefined,
    originLng: Number.isFinite(originLng) ? originLng : undefined,
    destinationLat: Number.isFinite(destinationLat) ? destinationLat : undefined,
    destinationLng: Number.isFinite(destinationLng) ? destinationLng : undefined,
  });

  const handleConfirm = useCallback(() => {
    triggerLightHaptic();
    confirmBooking();
  }, [confirmBooking]);

  if (loadState === 'loading' || !booking) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <BrandTopBar
          onMenuPress={goBack}
          right={
            <IconButton
              icon="notifications-outline"
              onPress={openNotifications}
              accessibilityLabel="Notifications"
            />
          }
        />
        <View style={styles.loadingWrap}>
          <HomeLoader label="Loading ride details…" />
        </View>
      </SafeAreaView>
    );
  }

  if (loadState === 'error') {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <BrandTopBar
          onMenuPress={goBack}
          right={
            <IconButton
              icon="notifications-outline"
              onPress={openNotifications}
              accessibilityLabel="Notifications"
            />
          }
        />
        <View style={styles.errorWrap}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.errorText}>
            {errorMessage || COMMUTE_REVIEW_BOOKING_SCREEN.loadErrorTitle}
          </Text>
          <Pressable
            onPress={retryLoad}
            style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.88 }]}
            accessibilityRole="button"
          >
            <Text style={styles.retryText}>{COMMUTE_REVIEW_BOOKING_SCREEN.retryLabel}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <BrandTopBar
        onMenuPress={goBack}
        right={
          <IconButton
            icon="notifications-outline"
            onPress={openNotifications}
            accessibilityLabel="Notifications"
          />
        }
      />

      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        footer={
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.confirmButton,
                confirming && styles.confirmButtonBusy,
                pressed && !confirming && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleConfirm}
              disabled={confirming}
              accessibilityRole="button"
              accessibilityLabel={COMMUTE_REVIEW_BOOKING_SCREEN.confirmLabel}
            >
              {confirming ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <>
                  <Text style={styles.confirmLabel}>
                    {COMMUTE_REVIEW_BOOKING_SCREEN.confirmLabel}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={colors.textInverse} />
                </>
              )}
            </Pressable>
          </View>
        }
      >
        <ScreenIntro
          title={COMMUTE_REVIEW_BOOKING_SCREEN.title}
          subtitle={COMMUTE_REVIEW_BOOKING_SCREEN.subtitle}
          variant="default"
          style={styles.intro}
        />

        <CommuteBookingMapHero
          pickup={booking.pickup}
          dropoff={booking.dropoff}
          routeCoordinates={routeCoordinates}
          distanceLabel={booking.distanceLabel}
          durationLabel={booking.durationLabel}
          matchPercent={booking.matchPercent}
          matchCaption={booking.matchCaption}
        />

        <View style={styles.tripCard}>
          <View style={styles.tripAccent} />
          <View style={styles.tripBody}>
            <View style={styles.driverRow}>
              <View style={styles.driverIconWrap}>
                <Ionicons name="person" size={22} color={colors.primary} />
              </View>
              <View style={styles.driverMeta}>
                <Text style={styles.driverName} numberOfLines={1}>
                  {booking.driverName}
                </Text>
                <Text style={styles.vehicleText} numberOfLines={1}>
                  {booking.carModel}
                </Text>
              </View>
            </View>

            <View style={styles.routePanel}>
              <View style={styles.routeRow}>
                <View style={styles.routeDotPickup} />
                <Text style={styles.routeText} numberOfLines={2}>
                  {booking.pickup.label}
                </Text>
              </View>
              <View style={styles.routeRow}>
                <View style={styles.routeDotDropoff} />
                <Text style={styles.routeText} numberOfLines={2}>
                  {booking.dropoff.label}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {booking.rideAlongs.length > 0 ? (
          <CommuteRideAlongsSection passengers={booking.rideAlongs} />
        ) : null}

        <ReviewBookingPromoSection
          value={promoInput}
          applied={promoApplied}
          applying={promoApplying}
          discount={promoDiscount}
          error={promoError}
          onChange={setPromoInput}
          onApply={applyPromo}
          onClear={clearPromo}
          onViewAvailableCoupons={openAvailableCoupons}
        />

        <CommutePaymentSummary
          fare={booking.fare}
          selectedSeats={selectedSeats}
          maxSeats={maxSeats}
          promoDiscount={promoDiscount}
          payableTotal={displayFareTotal}
          onDecrementSeats={() => setSelectedSeats(selectedSeats - 1)}
          onIncrementSeats={() => setSelectedSeats(selectedSeats + 1)}
        />
      </KeyboardAwareScrollView>

      <AppFooter />
    </SafeAreaView>
  );
};
