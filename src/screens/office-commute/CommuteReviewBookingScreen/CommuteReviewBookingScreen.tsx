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
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, IconButton, KeyboardAwareScrollView, AppText as Text } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import {
  CommuteBookingMapHero,
  CommutePaymentSummary,
  CommuteRideAlongsSection,
} from '@/features/office-commute/components';
import { COMMUTE_REVIEW_BOOKING_SCREEN } from '@/features/office-commute/constants';
import { useCommuteReviewBooking } from '@/features/office-commute/hooks';
import { styles } from './CommuteReviewBookingScreen.styles';

const PROMO_TOP_GAP = spacing.md;

export const CommuteReviewBookingScreen = () => {
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
    booking,
    routeCoordinates,
    promoInput,
    promoApplied,
    confirming,
    setPromoInput,
    applyPromo,
    confirmBooking,
    goBack,
    openNotifications,
  } = useCommuteReviewBooking({
    rideId: getSearchParam(params.rideId) || 'commute-ride-1',
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

  const handleConfirm = useCallback(() => {
    triggerLightHaptic();
    confirmBooking();
  }, [confirmBooking]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={goBack}
            color={colors.primary}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle}>{COMMUTE_REVIEW_BOOKING_SCREEN.title}</Text>

        <IconButton
          icon="notifications-outline"
          onPress={openNotifications}
          color={colors.primary}
          accessibilityLabel="Notifications"
        />
      </View>

      <KeyboardAwareScrollView
        scrollViewRef={scrollRef}
        contentContainerStyle={styles.scrollContent}
        footer={
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.confirmButton,
                confirming && styles.confirmButtonBusy,
                pressed && !confirming && { opacity: 0.94, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleConfirm}
              disabled={confirming}
              accessibilityRole="button"
              accessibilityLabel={COMMUTE_REVIEW_BOOKING_SCREEN.confirmLabel}
            >
              {confirming ? (
                <>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.confirmLabel}>
                    {COMMUTE_REVIEW_BOOKING_SCREEN.confirmingLabel}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.confirmLabel}>
                    {COMMUTE_REVIEW_BOOKING_SCREEN.confirmLabel}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </>
              )}
            </Pressable>
          </View>
        }
      >
        <CommuteBookingMapHero
          pickup={booking.pickup}
          dropoff={booking.dropoff}
          routeCoordinates={routeCoordinates}
          distanceLabel={booking.distanceLabel}
          durationLabel={booking.durationLabel}
          matchPercent={booking.matchPercent}
          matchCaption={booking.matchCaption}
        />

        <View style={styles.content}>
          <CommuteRideAlongsSection passengers={booking.rideAlongs} />

          <View onLayout={handlePromoLayout}>
            <CommutePaymentSummary
              fare={booking.fare}
              promoValue={promoInput}
              promoApplied={promoApplied}
              onPromoChange={setPromoInput}
              onApplyPromo={applyPromo}
              onPromoFocus={() => {
                promoFocusedRef.current = true;
                scrollPromoIntoView();
              }}
              onPromoBlur={() => {
                promoFocusedRef.current = false;
              }}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <AppFooter />
    </SafeAreaView>
  );
};
