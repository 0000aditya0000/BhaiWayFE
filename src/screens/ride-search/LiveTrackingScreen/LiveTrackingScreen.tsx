import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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

import { AppFooter, Avatar, IconButton, AppText as Text } from '@/shared/components';
import { isGoogleMapsBypassed, MapBypassSurface } from '@/shared/maps';
import { spacing } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { LIVE_TRACKING_SCREEN } from '@/features/ride-search/constants';
import { useLiveTracking } from '@/features/ride-search/hooks';
import type { MapCoordinate, RideType } from '@/features/ride-search/types';
import { liveTrackingTokens, styles } from './LiveTrackingScreen.styles';

const isRideType = (value: string): value is RideType =>
  value === 'regular' || value === 'assured';

const EDGE_PADDING = {
  top: spacing.xl,
  right: 48,
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

const midpoint = (a: MapCoordinate, b: MapCoordinate): MapCoordinate => ({
  latitude: (a.latitude + b.latitude) / 2,
  longitude: (a.longitude + b.longitude) / 2,
});

export const LiveTrackingScreen = () => {
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
    tracking,
    routeCoordinates,
    otpDigits,
    isRideStarted,
    goBack,
    openNotifications,
    shareTrip,
    explainOtp,
    openOngoingTrip,
    callDriver,
    chatDriver,
    openSupport,
  } = useLiveTracking({
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
  const etaPulse = useSharedValue(1);
  const carPulse = useSharedValue(1);

  useEffect(() => {
    etaPulse.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 700, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    carPulse.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 900, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 900, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [carPulse, etaPulse]);

  const etaDotStyle = useAnimatedStyle(() => ({
    opacity: etaPulse.value,
  }));

  const carPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: carPulse.value }],
    opacity: 1.35 - (carPulse.value - 1) * 0.9,
  }));

  const polyline = useMemo(() => {
    if (routeCoordinates.length >= 2) {
      return routeCoordinates;
    }
    return [tracking.pickup, tracking.dropoff];
  }, [routeCoordinates, tracking.dropoff, tracking.pickup]);

  const driverPosition = useMemo(() => {
    if (polyline.length >= 3) {
      return polyline[Math.floor(polyline.length / 2)]!;
    }
    return midpoint(tracking.pickup, tracking.dropoff);
  }, [polyline, tracking.dropoff, tracking.pickup]);

  const initialRegion = useMemo(() => buildRegion(polyline), [polyline]);

  const fitRoute = useCallback(() => {
    mapRef.current?.fitToCoordinates(polyline, {
      edgePadding: {
        top: EDGE_PADDING.top,
        right: EDGE_PADDING.right,
        bottom: EDGE_PADDING.bottom + 40,
        left: EDGE_PADDING.left,
      },
      animated: false,
    });
  }, [polyline]);

  useEffect(() => {
    if (!isRideStarted) {
      return;
    }
    fitRoute();
  }, [fitRoute, isRideStarted]);

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleZoom = useCallback(async (delta: number) => {
    const camera = await mapRef.current?.getCamera();
    if (!camera) {
      return;
    }
    const nextZoom = Math.max(3, Math.min(20, (camera.zoom ?? 14) + delta));
    mapRef.current?.animateCamera({ ...camera, zoom: nextZoom }, { duration: 220 });
  }, []);

  const handleLocate = useCallback(() => {
    triggerLightHaptic();
    fitRoute();
  }, [fitRoute]);

  const vehicleLine = `${tracking.driver.vehicleLabel} • ${tracking.driver.plateNumber}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <IconButton
            icon="arrow-back"
            onPress={handleBack}
            color={liveTrackingTokens.PRIMARY}
            accessibilityLabel="Go back"
          />
        </View>
        <Text style={styles.headerTitle}>{LIVE_TRACKING_SCREEN.title}</Text>

        <IconButton
          icon="notifications-outline"
          onPress={openNotifications}
          color={liveTrackingTokens.ON_SURFACE_VARIANT}
          accessibilityLabel="Open notifications"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapSection}>
          {isRideStarted ? (
            <>
              {isGoogleMapsBypassed() ? (
                <MapBypassSurface
                  style={styles.map}
                  title="Live tracking"
                  points={[
                    { ...driverPosition, label: 'Driver' },
                    { ...tracking.dropoff, label: 'Drop-off' },
                  ]}
                />
              ) : (
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={initialRegion}
                  onMapReady={fitRoute}
                  scrollEnabled
                  zoomEnabled
                  rotateEnabled={false}
                  pitchEnabled={false}
                  toolbarEnabled={false}
                  showsCompass={false}
                >
                  <Polyline
                    coordinates={polyline}
                    strokeColor="rgba(55, 75, 177, 0.2)"
                    strokeWidth={6}
                  />
                  <Polyline coordinates={polyline} strokeColor="#374BB1" strokeWidth={4} />

                  <Marker
                    coordinate={tracking.dropoff}
                    tracksViewChanges={false}
                    anchor={{ x: 0.5, y: 1 }}
                  >
                    <View style={styles.destinationMarker}>
                      <View style={styles.destinationPin}>
                        <Ionicons name="location" size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.destinationDot} />
                    </View>
                  </Marker>

                  <Marker
                    coordinate={driverPosition}
                    tracksViewChanges={false}
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <View style={styles.carMarkerWrap}>
                      <Animated.View style={[styles.carPulse, carPulseStyle]} />
                      <View style={styles.carMarker}>
                        <Ionicons name="car" size={22} color="#374BB1" />
                      </View>
                    </View>
                  </Marker>
                </MapView>
              )}

              <Pressable
                style={({ pressed }) => [styles.etaPill, pressed && { opacity: 0.92 }]}
                onPress={() => {
                  triggerLightHaptic();
                  openOngoingTrip();
                }}
                accessibilityRole="button"
                accessibilityLabel="Open ongoing trip"
              >
                <Animated.View style={[styles.etaDot, etaDotStyle]} />
                <View style={styles.etaCopy}>
                  <Text style={styles.etaLabel}>{LIVE_TRACKING_SCREEN.etaLabel}</Text>
                  <Text style={styles.etaValue}>
                    {LIVE_TRACKING_SCREEN.etaAwayLabel(tracking.etaMinutes)}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.mapControls}>
                <Pressable
                  style={({ pressed }) => [styles.mapControlBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => {
                    triggerLightHaptic();
                    void handleZoom(1);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Zoom in"
                >
                  <Ionicons name="add" size={22} color="#434655" />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.mapControlBtn, pressed && { opacity: 0.85 }]}
                  onPress={() => {
                    triggerLightHaptic();
                    void handleZoom(-1);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Zoom out"
                >
                  <Ionicons name="remove" size={22} color="#434655" />
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.mapControlBtn,
                    styles.mapControlBtnPrimary,
                    pressed && { opacity: 0.9 },
                  ]}
                  onPress={handleLocate}
                  accessibilityRole="button"
                  accessibilityLabel="Recenter map"
                >
                  <Ionicons name="locate" size={20} color="#FFFFFF" />
                </Pressable>
              </View>
            </>
          ) : (
            <View style={styles.waitingMap} accessibilityRole="text">
              <View style={styles.waitingIconWrap}>
                <Ionicons name="map-outline" size={36} color="#374BB1" />
              </View>
              <View style={styles.waitingBadge}>
                <Text style={styles.waitingBadgeText}>{LIVE_TRACKING_SCREEN.waitingBadge}</Text>
              </View>
              <Text style={styles.waitingTitle}>{LIVE_TRACKING_SCREEN.waitingTitle}</Text>
              <Text style={styles.waitingMessage}>{LIVE_TRACKING_SCREEN.waitingMessage}</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.driverCard}>
            <View style={styles.driverInfo}>
              <View style={styles.avatar}>
                <Avatar
                  size={60}
                  uri={tracking.driver.avatarUri}
                  accessibilityLabel={`${tracking.driver.name} photo`}
                />
              </View>
              <View style={styles.driverMeta}>
                <View style={styles.driverNameRow}>
                  <Text style={styles.driverName}>{tracking.driver.name}</Text>
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={14} color="#585E72" />
                    <Text style={styles.ratingText}>{tracking.driver.rating.toFixed(1)}</Text>
                  </View>
                </View>
                <Text style={styles.vehicleText}>{vehicleLine}</Text>
              </View>
            </View>

            <View style={styles.contactRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.chatButton,
                  pressed && { backgroundColor: '#E7E8E9' },
                ]}
                onPress={() => {
                  triggerLightHaptic();
                  chatDriver();
                }}
                accessibilityRole="button"
                accessibilityLabel="Chat with driver"
              >
                <Ionicons name="chatbubble-outline" size={18} color="#191C1D" />
                <Text style={styles.chatLabel}>{LIVE_TRACKING_SCREEN.chatLabel}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.callButton, pressed && { opacity: 0.9 }]}
                onPress={() => {
                  triggerLightHaptic();
                  callDriver();
                }}
                accessibilityRole="button"
                accessibilityLabel="Call driver"
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
                <Text style={styles.callLabel}>{LIVE_TRACKING_SCREEN.callLabel}</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.otpCard}>
            <Text style={styles.otpHint}>{LIVE_TRACKING_SCREEN.otpHint}</Text>
            <View style={styles.otpRow}>
              {otpDigits.map((digit, index) => (
                <View key={`${digit}-${index}`} style={styles.otpDigit}>
                  <Text style={styles.otpDigitText}>{digit}</Text>
                </View>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [styles.whyOtpBtn, pressed && { opacity: 0.7 }]}
              onPress={() => {
                triggerLightHaptic();
                explainOtp();
              }}
              accessibilityRole="button"
              accessibilityLabel={LIVE_TRACKING_SCREEN.whyOtpLabel}
            >
              <Ionicons name="information-circle-outline" size={14} color="#374BB1" />
              <Text style={styles.whyOtpLabel}>{LIVE_TRACKING_SCREEN.whyOtpLabel}</Text>
            </Pressable>
          </View>

          <View style={styles.quickActions}>
            <Pressable
              style={({ pressed }) => [
                styles.quickAction,
                pressed && { backgroundColor: '#E7E8E9' },
              ]}
              onPress={() => {
                triggerLightHaptic();
                shareTrip();
              }}
              accessibilityRole="button"
              accessibilityLabel={LIVE_TRACKING_SCREEN.shareTripLabel}
            >
              <View style={[styles.quickActionIcon, styles.shareIcon]}>
                <Ionicons name="share-social" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.quickActionTitle}>{LIVE_TRACKING_SCREEN.shareTripLabel}</Text>
                <Text style={styles.quickActionHint}>{LIVE_TRACKING_SCREEN.shareTripHint}</Text>
              </View>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.quickAction,
                pressed && { backgroundColor: '#E7E8E9' },
              ]}
              onPress={() => {
                triggerLightHaptic();
                openSupport();
              }}
              accessibilityRole="button"
              accessibilityLabel={LIVE_TRACKING_SCREEN.supportLabel}
            >
              <View style={[styles.quickActionIcon, styles.supportIcon]}>
                <Ionicons name="headset" size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.quickActionTitle}>{LIVE_TRACKING_SCREEN.supportLabel}</Text>
                <Text style={styles.quickActionHint}>{LIVE_TRACKING_SCREEN.supportHint}</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
