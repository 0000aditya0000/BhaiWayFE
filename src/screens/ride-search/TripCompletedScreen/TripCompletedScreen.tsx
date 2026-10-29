import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';

import { APP_CONFIG } from '@/config';
import { AppFooter, Avatar, IconButton, AppText as Text } from '@/shared/components';
import { isGoogleMapsBypassed, MapBypassSurface } from '@/shared/maps';
import { colors, spacing } from '@/shared/theme';
import { formatBhaiWayCoins, getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { TRIP_COMPLETED_SCREEN } from '@/features/ride-search/constants';
import { useTripCompleted } from '@/features/ride-search/hooks';
import type { MapCoordinate, RideType, TripCompletedPaymentId } from '@/features/ride-search/types';
import { styles } from './TripCompletedScreen.styles';

const isRideType = (value: string): value is RideType =>
  value === 'regular' || value === 'assured';

const EDGE_PADDING = {
  top: spacing.xl,
  right: spacing.xl,
  bottom: spacing.xl,
  left: spacing.xl,
};

const buildRegion = (coordinates: MapCoordinate[]): Region => {
  const lats = coordinates.map((c) => c.latitude);
  const lngs = coordinates.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.7, 0.05),
    longitudeDelta: Math.max((maxLng - minLng) * 1.7, 0.05),
  };
};

const paymentIconName = (id: TripCompletedPaymentId) =>
  id === 'wallet' ? ('wallet' as const) : ('cash-outline' as const);

const paymentIconStyle = (id: TripCompletedPaymentId) =>
  id === 'wallet' ? styles.paymentIconWallet : styles.paymentIconCash;

const paymentIconColor = (id: TripCompletedPaymentId) =>
  id === 'wallet' ? '#4B61C4' : '#434655';

export const TripCompletedScreen = () => {
  const params = useLocalSearchParams<{
    rideId?: string;
    rideType?: string;
    origin?: string;
    destination?: string;
    driverName?: string;
    carModel?: string;
    price?: string;
    originLat?: string;
    originLng?: string;
    destinationLat?: string;
    destinationLng?: string;
    bookingId?: string;
  }>();

  const rideTypeParam = getSearchParam(params.rideType);
  const rideType: RideType = isRideType(rideTypeParam) ? rideTypeParam : 'regular';
  const priceParam = Number(getSearchParam(params.price));
  const originLat = Number(getSearchParam(params.originLat));
  const originLng = Number(getSearchParam(params.originLng));
  const destinationLat = Number(getSearchParam(params.destinationLat));
  const destinationLng = Number(getSearchParam(params.destinationLng));

  const {
    trip,
    routeCoordinates,
    bookingLoading,
    settlement,
    showPaymentUi,
    paymentOptions,
    selectedPaymentId,
    selectPayment,
    paymentPhase,
    paymentError,
    insufficientBalance,
    payButtonLabel,
    payDisabled,
    paymentResult,
    submitPayment,
    openAddMoney,
    chooseCashAfterInsufficient,
    continueAfterPayment,
    openNotifications,
  } = useTripCompleted({
    rideId: getSearchParam(params.rideId) || 'ride-default',
    rideType,
    origin: getSearchParam(params.origin),
    destination: getSearchParam(params.destination),
    driverName: getSearchParam(params.driverName),
    carModel: getSearchParam(params.carModel),
    price: Number.isFinite(priceParam) ? priceParam : undefined,
    originLat: Number.isFinite(originLat) ? originLat : undefined,
    originLng: Number.isFinite(originLng) ? originLng : undefined,
    destinationLat: Number.isFinite(destinationLat) ? destinationLat : undefined,
    destinationLng: Number.isFinite(destinationLng) ? destinationLng : undefined,
    bookingId: getSearchParam(params.bookingId) || undefined,
  });

  const mapRef = useRef<MapView>(null);
  const isProcessing = paymentPhase === 'processing';
  const isSuccess = paymentPhase === 'success';
  const payableLabel = settlement?.fareLabel ?? trip.amountLabel;

  const polyline = useMemo(() => {
    if (routeCoordinates.length >= 2) {
      return routeCoordinates;
    }
    return [trip.pickup, trip.dropoff];
  }, [routeCoordinates, trip.dropoff, trip.pickup]);

  const initialRegion = useMemo(() => buildRegion(polyline), [polyline]);

  const fitRoute = useCallback(() => {
    mapRef.current?.fitToCoordinates(polyline, {
      edgePadding: EDGE_PADDING,
      animated: false,
    });
  }, [polyline]);

  useEffect(() => {
    fitRoute();
  }, [fitRoute]);

  const handlePrimaryAction = useCallback(() => {
    triggerLightHaptic();
    if (isSuccess) {
      continueAfterPayment();
      return;
    }
    submitPayment();
  }, [continueAfterPayment, isSuccess, submitPayment]);

  const successAmountLabel = useMemo(() => {
    const fareRaw = paymentResult?.fareAmount ?? settlement?.fareCoins;
    if (fareRaw != null && fareRaw !== '') {
      return formatBhaiWayCoins(Number(fareRaw), { spaced: false });
    }
    return payableLabel;
  }, [payableLabel, paymentResult?.fareAmount, settlement?.fareCoins]);

  const isCashSuccess = paymentResult?.paymentChannel?.toUpperCase() === 'CASH';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="car" size={28} color={colors.primary} />
          <Text style={styles.brandName}>{APP_CONFIG.name}</Text>
        </View>
        <IconButton
          icon="notifications-outline"
          onPress={openNotifications}
          color="#434655"
          accessibilityLabel="Open notifications"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heading}>{TRIP_COMPLETED_SCREEN.heading}</Text>
          <Text style={styles.subtitle}>{TRIP_COMPLETED_SCREEN.subtitle}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryTopRow}>
              <Text style={styles.summaryLabel}>{TRIP_COMPLETED_SCREEN.summaryLabel}</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>{trip.statusLabel}</Text>
              </View>
            </View>
            <Text style={styles.summaryDate} numberOfLines={2}>
              {trip.dateLabel}
            </Text>
          </View>

          <View style={styles.timeline}>
            <View style={styles.timelineTrack} />
            <View style={styles.timelineRow}>
              <View style={styles.timelineDotPrimary}>
                <Ionicons name="location" size={12} color={colors.white} />
              </View>
              <View style={styles.locationMeta}>
                <Text style={styles.locationLabel}>{TRIP_COMPLETED_SCREEN.pickupLabel}</Text>
                <Text style={styles.locationTitle}>{trip.pickupTitle}</Text>
                <Text style={styles.locationAddress}>{trip.pickupAddress}</Text>
              </View>
            </View>
            <View style={styles.timelineRow}>
              <View style={styles.timelineDotSecondary}>
                <Ionicons name="flag" size={12} color={colors.white} />
              </View>
              <View style={styles.locationMeta}>
                <Text style={styles.locationLabel}>{TRIP_COMPLETED_SCREEN.destinationLabel}</Text>
                <Text style={styles.locationTitle}>{trip.dropoffTitle}</Text>
                <Text style={styles.locationAddress}>{trip.dropoffAddress}</Text>
              </View>
            </View>
          </View>

          <View style={styles.summaryFooter}>
            <View style={styles.driverLeft}>
              <Avatar size={48} accessibilityLabel={`${trip.driverName} photo`} />
              <View style={styles.driverInfo}>
                <Text style={styles.driverLabel}>{TRIP_COMPLETED_SCREEN.driverLabel}</Text>
                <Text style={styles.driverName} numberOfLines={1}>
                  {trip.driverName}
                </Text>
                <View style={styles.driverMetaRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.driverMeta} numberOfLines={2}>
                    {trip.driverMeta}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>{TRIP_COMPLETED_SCREEN.amountLabel}</Text>
              <Text
                style={styles.amountValue}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {payableLabel}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.mapCard}>
          {isGoogleMapsBypassed() ? (
            <MapBypassSurface
              style={styles.map}
              title="Trip route"
              points={[
                { ...trip.pickup, label: 'Pickup' },
                { ...trip.dropoff, label: 'Drop-off' },
              ]}
            />
          ) : (
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={initialRegion}
              onMapReady={fitRoute}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
              showsCompass={false}
              liteMode={Platform.OS === 'android'}
              pointerEvents="none"
            >
              <Marker coordinate={trip.pickup} pinColor={colors.primary} tracksViewChanges={false} />
              <Marker coordinate={trip.dropoff} pinColor="#585E72" tracksViewChanges={false} />
              <Polyline coordinates={polyline} strokeColor="#374BB1" strokeWidth={4} />
            </MapView>
          )}
          <View style={styles.mapTint} pointerEvents="none" />
          <View style={styles.distanceBadge}>
            <Ionicons name="navigate-outline" size={18} color={colors.primary} />
            <Text style={styles.distanceText}>{trip.distanceLabel}</Text>
          </View>
        </View>

        {isSuccess ? (
          <View style={styles.card}>
            <View style={styles.successIconWrap}>
              <Ionicons name="checkmark-circle" size={56} color="#059669" />
            </View>
            <Text style={styles.successTitle}>
              {isCashSuccess
                ? TRIP_COMPLETED_SCREEN.paidCashTitle
                : TRIP_COMPLETED_SCREEN.paidTitle}
            </Text>
            <Text style={styles.successAmount}>{successAmountLabel}</Text>
            <Text style={styles.successMessage}>
              {isCashSuccess
                ? TRIP_COMPLETED_SCREEN.paidCashMessage
                : `${successAmountLabel} ${TRIP_COMPLETED_SCREEN.paidWalletMessage}`}
            </Text>
            {!isCashSuccess && paymentResult?.transactionId ? (
              <View style={styles.paymentIdBlock}>
                <Text style={styles.paymentIdLabel}>{TRIP_COMPLETED_SCREEN.paymentIdLabel}</Text>
                <Text style={styles.paymentIdValue}>{paymentResult.transactionId}</Text>
              </View>
            ) : null}
            <Text style={styles.successFootnote}>{TRIP_COMPLETED_SCREEN.paidFareMessage}</Text>
            <Pressable
              style={({ pressed }) => [
                styles.payButton,
                pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handlePrimaryAction}
              accessibilityRole="button"
              accessibilityLabel={TRIP_COMPLETED_SCREEN.doneCta}
            >
              <Text style={styles.payLabel}>{TRIP_COMPLETED_SCREEN.doneCta}</Text>
            </Pressable>
          </View>
        ) : showPaymentUi ? (
          <View style={styles.card}>
            {settlement?.isAssured ? (
              <View style={styles.assuredFareBlock}>
                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>{TRIP_COMPLETED_SCREEN.rideFareLabel}</Text>
                  <Text style={styles.fareValue}>{settlement.fareLabel}</Text>
                </View>
                {settlement.securityDepositLabel ? (
                  <View style={styles.assuredDepositRow}>
                    <View>
                      <Text style={styles.fareLabel}>{TRIP_COMPLETED_SCREEN.assuredDepositLabel}</Text>
                      <Text style={styles.assuredDepositNote}>
                        {TRIP_COMPLETED_SCREEN.assuredDepositNote}
                      </Text>
                    </View>
                    <Text style={styles.fareValue}>{settlement.securityDepositLabel}</Text>
                  </View>
                ) : null}
              </View>
            ) : null}

            <Text style={styles.paymentTitle}>{TRIP_COMPLETED_SCREEN.paymentTitle}</Text>
            <View style={styles.paymentList}>
              {paymentOptions.map((option) => {
                const selected = selectedPaymentId === option.id;
                return (
                  <Pressable
                    key={option.id}
                    style={[
                      styles.paymentOption,
                      selected && styles.paymentOptionActive,
                      isProcessing && styles.paymentOptionDisabled,
                    ]}
                    onPress={() => selectPayment(option.id)}
                    disabled={isProcessing}
                    accessibilityRole="radio"
                    accessibilityState={{ selected, disabled: isProcessing }}
                    accessibilityLabel={option.label}
                  >
                    <View style={styles.paymentLeft}>
                      <View style={[styles.paymentIcon, paymentIconStyle(option.id)]}>
                        <Ionicons
                          name={paymentIconName(option.id)}
                          size={20}
                          color={paymentIconColor(option.id)}
                        />
                      </View>
                      <View>
                        <Text style={styles.paymentLabel}>{option.label}</Text>
                        <Text style={styles.paymentSubtitle}>{option.subtitle}</Text>
                      </View>
                    </View>
                    <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {insufficientBalance ? (
              <View style={styles.insufficientCard}>
                <Text style={styles.insufficientTitle}>
                  {TRIP_COMPLETED_SCREEN.insufficientTitle}
                </Text>
                <Text style={styles.insufficientMessage}>
                  {insufficientBalance.requiredLabel && insufficientBalance.availableLabel
                    ? `You need ${insufficientBalance.requiredLabel} to pay for this ride, but your available BhaiWay Wallet balance is ${insufficientBalance.availableLabel}.`
                    : insufficientBalance.message}
                </Text>
                <View style={styles.insufficientActions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryActionButton,
                      pressed && { opacity: 0.9 },
                    ]}
                    onPress={openAddMoney}
                    accessibilityRole="button"
                    accessibilityLabel={TRIP_COMPLETED_SCREEN.insufficientAddMoneyCta}
                  >
                    <Text style={styles.secondaryActionLabel}>
                      {TRIP_COMPLETED_SCREEN.insufficientAddMoneyCta}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [
                      styles.secondaryActionButton,
                      pressed && { opacity: 0.9 },
                    ]}
                    onPress={chooseCashAfterInsufficient}
                    accessibilityRole="button"
                    accessibilityLabel={TRIP_COMPLETED_SCREEN.insufficientPayCashCta}
                  >
                    <Text style={styles.secondaryActionLabel}>
                      {TRIP_COMPLETED_SCREEN.insufficientPayCashCta}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {paymentError ? <Text style={styles.paymentError}>{paymentError}</Text> : null}

            <View style={styles.dashedDivider} />

            <View style={styles.fareList}>
              {trip.fareLines.map((line) => (
                <View key={line.label} style={styles.fareRow}>
                  <Text style={styles.fareLabel}>{line.label}</Text>
                  <Text style={styles.fareValue}>{line.amountLabel}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Amount to pay</Text>
                <Text style={styles.totalValue}>{payableLabel}</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.payButton,
                payDisabled && styles.payButtonDisabled,
                pressed && !payDisabled && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handlePrimaryAction}
              disabled={payDisabled}
              accessibilityRole="button"
              accessibilityLabel={payButtonLabel}
              accessibilityState={{ disabled: payDisabled }}
            >
              {isProcessing || bookingLoading ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.payLabel}>{payButtonLabel}</Text>
              )}
            </Pressable>

            <View style={styles.secureRow}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#434655" />
              <Text style={styles.secureText}>{TRIP_COMPLETED_SCREEN.secureNote}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.paymentTitle}>
              {settlement?.paymentStatus === 'PAID'
                ? TRIP_COMPLETED_SCREEN.alreadyPaidTitle
                : TRIP_COMPLETED_SCREEN.paymentTitle}
            </Text>
            <Text style={styles.alreadyPaidMessage}>
              {settlement?.paymentStatus === 'PAID'
                ? TRIP_COMPLETED_SCREEN.alreadyPaidMessage
                : TRIP_COMPLETED_SCREEN.paidFareMessage}
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.payButton,
                pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handlePrimaryAction}
              accessibilityRole="button"
              accessibilityLabel={TRIP_COMPLETED_SCREEN.continueToRatingCta}
            >
              <Text style={styles.payLabel}>{TRIP_COMPLETED_SCREEN.continueToRatingCta}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
