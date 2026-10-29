import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { AppFooter, Avatar, AppText as Text } from '@/shared/components';
import { isGoogleMapsBypassed, MapBypassSurface } from '@/shared/maps';
import { spacing } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { ONGOING_TRIP_SCREEN } from '@/features/ride-search/constants';
import { useOngoingTrip } from '@/features/ride-search/hooks';
import type { MapCoordinate, RideType } from '@/features/ride-search/types';
import { ongoingTripTokens, styles } from './OngoingTripScreen.styles';

const isRideType = (value: string): value is RideType =>
  value === 'regular' || value === 'assured';

const EDGE_PADDING = {
  top: spacing.xxxl * 3,
  right: spacing.xxxl * 2,
  bottom: spacing.xxxl * 8,
  left: spacing.xxl,
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
    latitudeDelta: Math.max((maxLat - minLat) * 1.8, 0.04),
    longitudeDelta: Math.max((maxLng - minLng) * 1.8, 0.04),
  };
};

export const OngoingTripScreen = () => {
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
    goBack,
    callDriver,
    chatDriver,
    openSafety,
    triggerSos,
    completeTrip,
  } = useOngoingTrip({
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
  const sosScale = useSharedValue(0.95);
  const sosRing = useSharedValue(0);

  useEffect(() => {
    sosScale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }),
        withTiming(0.95, { duration: 700, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
    sosRing.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 0 }),
      ),
      -1,
      false,
    );
  }, [sosRing, sosScale]);

  const sosAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sosScale.value }],
  }));

  const sosRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.95 + sosRing.value * 0.45 }],
    opacity: 0.7 * (1 - sosRing.value),
  }));

  const polyline = useMemo(() => {
    if (routeCoordinates.length >= 2) {
      return routeCoordinates;
    }
    return [trip.pickup, trip.dropoff];
  }, [routeCoordinates, trip.dropoff, trip.pickup]);

  const initialRegion = useMemo(() => buildRegion(polyline), [polyline]);
  const [mapRegion, setMapRegion] = useState<Region>(initialRegion);

  useEffect(() => {
    setMapRegion(initialRegion);
  }, [initialRegion]);

  const fitRoute = useCallback(() => {
    mapRef.current?.fitToCoordinates(polyline, {
      edgePadding: EDGE_PADDING,
      animated: false,
    });
  }, [polyline]);

  useEffect(() => {
    fitRoute();
  }, [fitRoute]);

  const zoomBy = useCallback((direction: 1 | -1) => {
    setMapRegion((prev) => {
      const factor = direction > 0 ? 0.65 : 1.55;
      const next: Region = {
        ...prev,
        latitudeDelta: Math.min(Math.max(prev.latitudeDelta * factor, 0.005), 0.4),
        longitudeDelta: Math.min(Math.max(prev.longitudeDelta * factor, 0.005), 0.4),
      };
      mapRef.current?.animateToRegion(next, 200);
      return next;
    });
  }, []);

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleSos = useCallback(() => {
    triggerLightHaptic();
    triggerSos();
  }, [triggerSos]);

  const handleCompleteTrip = useCallback(() => {
    triggerLightHaptic();
    completeTrip();
  }, [completeTrip]);

  const handleSafety = useCallback(() => {
    triggerLightHaptic();
    openSafety();
  }, [openSafety]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.mapLayer}>
        {isGoogleMapsBypassed() ? (
          <MapBypassSurface
            style={styles.map}
            title="Ongoing trip"
            points={[
              { ...trip.pickup, label: 'You' },
              { ...trip.dropoff, label: 'Drop-off' },
            ]}
          />
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegion}
            onMapReady={fitRoute}
            showsCompass={false}
            toolbarEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            <Marker coordinate={trip.pickup} tracksViewChanges={false} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.carMarkerWrap}>
                <View style={styles.carGlow} />
                <View style={styles.carIcon}>
                  <Ionicons name="car" size={36} color={ongoingTripTokens.PRIMARY} />
                </View>
                <View style={styles.carLiveDot} />
              </View>
            </Marker>
            <Marker coordinate={trip.dropoff} tracksViewChanges={false} anchor={{ x: 0.5, y: 1 }}>
              <View style={styles.destinationMarker}>
                <View style={styles.destinationBadge}>
                  <Text style={styles.destinationBadgeText}>
                    {ONGOING_TRIP_SCREEN.destinationBadge}
                  </Text>
                </View>
                <Ionicons name="location" size={36} color={ongoingTripTokens.ERROR} />
              </View>
            </Marker>
            <Polyline
              coordinates={polyline}
              strokeColor="#374BB1"
              strokeWidth={6}
              lineDashPattern={[1, 12]}
            />
          </MapView>
        )}
        <LinearGradient
          colors={['rgba(248,249,250,0.8)', 'rgba(248,249,250,0)']}
          style={styles.mapFade}
          pointerEvents="none"
        />
      </View>

      <View style={styles.topBar}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { transform: [{ scale: 0.94 }] }]}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={ongoingTripTokens.ON_SURFACE} />
        </Pressable>
        <View style={styles.etaPillWrap}>
          <Pressable
            style={({ pressed }) => [styles.etaPill, pressed && { opacity: 0.9 }]}
            onPress={handleCompleteTrip}
            accessibilityRole="button"
            accessibilityLabel="Complete trip"
          >
            <Text style={styles.etaTitle}>{trip.dropoffEtaLabel}</Text>
            <Text style={styles.etaSubtitle}>{trip.remainingLabel}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sideControls}>
        <View style={styles.sosWrap}>
          <Animated.View style={[styles.sosPulseRing, sosRingStyle]} />
          <Animated.View style={sosAnimatedStyle}>
            <Pressable
              style={({ pressed }) => [styles.sosButton, pressed && { transform: [{ scale: 0.9 }] }]}
              onPress={handleSos}
              accessibilityRole="button"
              accessibilityLabel="Trigger emergency SOS"
            >
              <Ionicons name="warning" size={30} color="#FFFFFF" />
            </Pressable>
          </Animated.View>
        </View>
        <View style={styles.zoomStack}>
          <Pressable
            style={({ pressed }) => [styles.zoomButton, pressed && { opacity: 0.8 }]}
            onPress={() => {
              triggerLightHaptic();
              zoomBy(1);
            }}
            accessibilityRole="button"
            accessibilityLabel="Zoom in"
          >
            <Ionicons name="add" size={22} color={ongoingTripTokens.ON_SURFACE_VARIANT} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.zoomButton, pressed && { opacity: 0.8 }]}
            onPress={() => {
              triggerLightHaptic();
              zoomBy(-1);
            }}
            accessibilityRole="button"
            accessibilityLabel="Zoom out"
          >
            <Ionicons name="remove" size={22} color={ongoingTripTokens.ON_SURFACE_VARIANT} />
          </Pressable>
        </View>
      </View>

      <View style={styles.sheetWrap}>
        <View style={styles.sheet}>
          <View style={styles.driverSection}>
            <View style={styles.driverTop}>
              <View style={styles.driverLeft}>
                <View style={styles.avatarWrap}>
                  <View style={styles.avatarRing}>
                    <Avatar
                      size={56}
                      uri={trip.driver.avatarUri}
                      accessibilityLabel={`${trip.driver.name} photo`}
                    />
                  </View>
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                </View>
                <View>
                  <Text style={styles.driverName}>{trip.driver.name}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={styles.ratingText}>
                      {trip.driver.rating.toFixed(1)} • {trip.driver.ridesCountLabel}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.contactActions}>
                <Pressable
                  style={({ pressed }) => [
                    styles.contactButton,
                    pressed && { transform: [{ scale: 0.94 }] },
                  ]}
                  onPress={() => {
                    triggerLightHaptic();
                    callDriver();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Call driver"
                >
                  <Ionicons name="call-outline" size={22} color={ongoingTripTokens.PRIMARY} />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.contactButton,
                    pressed && { transform: [{ scale: 0.94 }] },
                  ]}
                  onPress={() => {
                    triggerLightHaptic();
                    chatDriver();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Chat with driver"
                >
                  <Ionicons name="chatbubble-outline" size={22} color={ongoingTripTokens.PRIMARY} />
                </Pressable>
              </View>
            </View>

            <View style={styles.vehicleCard}>
              <View style={styles.vehicleLeft}>
                <Ionicons name="car-outline" size={22} color={ongoingTripTokens.ON_SURFACE_VARIANT} />
                <View>
                  <Text style={styles.vehicleName}>{trip.driver.vehicleLabel}</Text>
                  <Text style={styles.plateLabel}>{trip.driver.plateNumber}</Text>
                </View>
              </View>
              <View style={styles.vehicleDivider} />
              <View style={styles.fareBlock}>
                <Text style={styles.fareValue}>{trip.estimatedFareLabel}</Text>
                <Text style={styles.fareLabel}>{ONGOING_TRIP_SCREEN.estimatedFareLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <Pressable
              style={({ pressed }) => [
                styles.safetyRow,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
              onPress={handleSafety}
              accessibilityRole="button"
              accessibilityLabel="Open safety and support"
            >
              <View style={styles.safetyLeft}>
                <Ionicons name="shield-checkmark" size={22} color={ongoingTripTokens.PRIMARY} />
                <Text style={styles.safetyLabel}>{ONGOING_TRIP_SCREEN.safetyLabel}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={ongoingTripTokens.ON_SURFACE_VARIANT}
              />
            </Pressable>
          </View>
        </View>
      </View>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
