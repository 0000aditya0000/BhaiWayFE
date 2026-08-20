import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';

import { APP_CONFIG } from '@/config';
import { AppFooter, Avatar, IconButton, AppText as Text } from '@/shared/components';
import { isGoogleMapsBypassed, MapBypassSurface } from '@/shared/maps';
import { colors, spacing } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
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

const paymentIconName = (id: TripCompletedPaymentId) => {
  if (id === 'wallet') {
    return 'wallet' as const;
  }
  if (id === 'upi') {
    return 'business-outline' as const;
  }
  return 'cash-outline' as const;
};

const paymentIconStyle = (id: TripCompletedPaymentId) => {
  if (id === 'wallet') {
    return styles.paymentIconWallet;
  }
  if (id === 'upi') {
    return styles.paymentIconUpi;
  }
  return styles.paymentIconCash;
};

const paymentIconColor = (id: TripCompletedPaymentId) => {
  if (id === 'wallet') {
    return '#4B61C4';
  }
  if (id === 'upi') {
    return '#585E72';
  }
  return '#434655';
};

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
    paymentOptions,
    selectedPaymentId,
    selectPayment,
    payNow,
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
  });

  const mapRef = useRef<MapView>(null);

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

  const handlePay = useCallback(() => {
    triggerLightHaptic();
    payNow();
  }, [payNow]);

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
            <View>
              <Text style={styles.summaryLabel}>{TRIP_COMPLETED_SCREEN.summaryLabel}</Text>
              <Text style={styles.summaryDate}>{trip.dateLabel}</Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{trip.statusLabel}</Text>
            </View>
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
              <View>
                <Text style={styles.driverLabel}>{TRIP_COMPLETED_SCREEN.driverLabel}</Text>
                <Text style={styles.driverName}>{trip.driverName}</Text>
                <View style={styles.driverMetaRow}>
                  <Ionicons name="star" size={14} color="#F59E0B" />
                  <Text style={styles.driverMeta}>{trip.driverMeta}</Text>
                </View>
              </View>
            </View>
            <View style={styles.amountBlock}>
              <Text style={styles.amountLabel}>{TRIP_COMPLETED_SCREEN.amountLabel}</Text>
              <Text style={styles.amountValue}>{trip.amountLabel}</Text>
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

        <View style={styles.card}>
          <Text style={styles.paymentTitle}>{TRIP_COMPLETED_SCREEN.paymentTitle}</Text>
          <View style={styles.paymentList}>
            {paymentOptions.map((option) => {
              const selected = selectedPaymentId === option.id;
              return (
                <Pressable
                  key={option.id}
                  style={[styles.paymentOption, selected && styles.paymentOptionActive]}
                  onPress={() => selectPayment(option.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
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

          <View style={styles.dashedDivider} />

          <View style={styles.fareList}>
            {trip.fareLines.map((line) => (
              <View key={line.label} style={styles.fareRow}>
                <Text style={styles.fareLabel}>{line.label}</Text>
                <Text style={styles.fareValue}>{line.amountLabel}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalValue}>{trip.amountLabel}</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.payButton,
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handlePay}
            accessibilityRole="button"
            accessibilityLabel="Pay now and rate driver"
          >
            <Text style={styles.payLabel}>{TRIP_COMPLETED_SCREEN.payCta}</Text>
          </Pressable>

          <View style={styles.secureRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#434655" />
            <Text style={styles.secureText}>{TRIP_COMPLETED_SCREEN.secureNote}</Text>
          </View>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
