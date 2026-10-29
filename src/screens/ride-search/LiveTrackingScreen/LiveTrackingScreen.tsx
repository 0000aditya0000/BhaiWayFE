import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import {
  isGoogleMapsBypassed,
  isValidMapCoordinate,
  MapBypassSurface,
  useInterpolatedCoordinate,
} from '@/shared/maps';
import { spacing } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { LIVE_TRACKING_SCREEN } from '@/features/ride-search/constants';
import { formatLastLocationReceivedAt } from '@/features/ride-search/utils/liveTrackingFreshness';
import { useLiveTracking } from '@/features/ride-search/hooks';
import { NoShowClaimPanel, useNoShowClaim } from '@/features/no-show';
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

export const LiveTrackingScreen = () => {
  const params = useLocalSearchParams<{
    rideId?: string;
    rideType?: string;
    origin?: string;
    destination?: string;
    driverName?: string;
    carModel?: string;
    plateNumber?: string;
    price?: string;
    originLat?: string;
    originLng?: string;
    destinationLat?: string;
    destinationLng?: string;
    bookingId?: string;
    claimId?: string;
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
    driverCoordinate,
    driverHeading,
    riderCoordinate,
    connectionStatus,
    locationFreshness,
    lastLocationUpdatedAt,
    trackingError,
    otpDigits,
    isRideStarted,
    isPickupVerified,
    showPickupOtp,
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
    plateNumber: getSearchParam(params.plateNumber),
    price: Number.isFinite(priceParam) ? priceParam : undefined,
    originLat: Number.isFinite(originLat) ? originLat : undefined,
    originLng: Number.isFinite(originLng) ? originLng : undefined,
    destinationLat: Number.isFinite(destinationLat) ? destinationLat : undefined,
    destinationLng: Number.isFinite(destinationLng) ? destinationLng : undefined,
    bookingId: getSearchParam(params.bookingId) || undefined,
  });

  const noShow = useNoShowClaim({
    role: 'passenger',
    rideId: getSearchParam(params.rideId),
    bookingId: getSearchParam(params.bookingId),
    claimId: getSearchParam(params.claimId),
    bookingStatus: getSearchParam(params.bookingId) ? 'CONFIRMED' : undefined,
    rideStatus: isRideStarted ? 'IN_PROGRESS' : undefined,
    pickupStatus: isPickupVerified ? 'PICKED_UP' : undefined,
    isRideOwner: false,
    enabled: Boolean(getSearchParam(params.bookingId)),
  });

  const { animatedCoordinate: smoothDriverCoordinate, heading: smoothHeading } =
    useInterpolatedCoordinate(driverCoordinate, driverHeading, {
      enabled: isRideStarted,
      durationMs: 900,
    });

  const mapRef = useRef<MapView>(null);
  const etaPulse = useSharedValue(1);
  const carPulse = useSharedValue(1);
  const [followDriver, setFollowDriver] = useState(true);
  const didInitialFitRef = useRef(false);
  const lastCameraFollowAtRef = useRef(0);

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
    if (!isPickupVerified && smoothDriverCoordinate) {
      const dest = isValidMapCoordinate(tracking.pickup)
        ? tracking.pickup
        : riderCoordinate;
      if (dest) {
        return [smoothDriverCoordinate, dest];
      }
    }
    if (isPickupVerified && smoothDriverCoordinate && isValidMapCoordinate(tracking.dropoff)) {
      return [smoothDriverCoordinate, tracking.dropoff];
    }
    return [];
  }, [
    isPickupVerified,
    riderCoordinate,
    routeCoordinates,
    smoothDriverCoordinate,
    tracking.dropoff,
    tracking.pickup,
  ]);

  /** Only real driver GPS — never fake a car on the route midpoint. */
  const hasLiveDriver = Boolean(smoothDriverCoordinate ?? driverCoordinate);
  const driverPosition = smoothDriverCoordinate ?? driverCoordinate;
  const hasRiderPin = Boolean(riderCoordinate);

  const fitCoordinates = useMemo(() => {
    const points: MapCoordinate[] = [];
    if (hasLiveDriver && driverPosition) {
      points.push(driverPosition);
    }
    if (hasRiderPin && riderCoordinate && !isPickupVerified) {
      points.push(riderCoordinate);
    }
    if (
      !isPickupVerified &&
      isValidMapCoordinate(tracking.pickup)
    ) {
      points.push(tracking.pickup);
    }
    if (isPickupVerified) {
      if (isValidMapCoordinate(tracking.dropoff)) {
        points.push(tracking.dropoff);
      }
      if (!(hasLiveDriver && driverPosition) && isValidMapCoordinate(tracking.pickup)) {
        points.push(tracking.pickup);
      }
    }
    if (points.length >= 2) {
      return points;
    }
    if (points.length === 1) {
      return points;
    }
    if (
      !isPickupVerified &&
      isValidMapCoordinate(tracking.pickup) &&
      isValidMapCoordinate(tracking.dropoff)
    ) {
      return [tracking.pickup, tracking.dropoff];
    }
    return polyline.length >= 2 ? polyline : [tracking.pickup];
  }, [
    driverPosition,
    hasLiveDriver,
    hasRiderPin,
    isPickupVerified,
    polyline,
    riderCoordinate,
    tracking.dropoff,
    tracking.pickup,
  ]);

  const initialRegion = useMemo(() => {
    const valid = fitCoordinates.filter((point) => isValidMapCoordinate(point));
    if (valid.length === 0) {
      return buildRegion([{ latitude: 28.6315, longitude: 77.2167 }]);
    }
    return buildRegion(valid);
  }, [fitCoordinates]);

  const fitRoute = useCallback(() => {
    const valid = fitCoordinates.filter((point) => isValidMapCoordinate(point));
    if (valid.length === 0) {
      return;
    }
    mapRef.current?.fitToCoordinates(valid, {
      edgePadding: {
        top: EDGE_PADDING.top,
        right: EDGE_PADDING.right,
        bottom: EDGE_PADDING.bottom + 40,
        left: EDGE_PADDING.left,
      },
      animated: true,
    });
  }, [fitCoordinates]);

  /** Initial camera once when live tracking begins — then allow manual pan/zoom. */
  useEffect(() => {
    if (!isRideStarted || didInitialFitRef.current) {
      return;
    }
    if (fitCoordinates.length < 1) {
      return;
    }
    didInitialFitRef.current = true;
    fitRoute();
  }, [fitCoordinates.length, fitRoute, isRideStarted]);

  /** Soft follow only when follow mode is on; throttled to avoid camera jitter. */
  useEffect(() => {
    if (!isRideStarted || !followDriver || !driverPosition) {
      return;
    }
    const now = Date.now();
    if (now - lastCameraFollowAtRef.current < 1800) {
      return;
    }
    lastCameraFollowAtRef.current = now;
    if (riderCoordinate && !isPickupVerified) {
      fitRoute();
      return;
    }
    mapRef.current?.animateCamera(
      {
        center: {
          latitude: driverPosition.latitude,
          longitude: driverPosition.longitude,
        },
      },
      { duration: 700 },
    );
  }, [
    driverPosition,
    fitRoute,
    followDriver,
    isPickupVerified,
    isRideStarted,
    riderCoordinate,
  ]);

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
    setFollowDriver(true);
    fitRoute();
  }, [fitRoute]);

  const connectionLabel = useMemo(() => {
    if (!isRideStarted) {
      return null;
    }
    if (locationFreshness === 'STALE' || connectionStatus === 'STALE') {
      const received = formatLastLocationReceivedAt(lastLocationUpdatedAt);
      return received
        ? `${LIVE_TRACKING_SCREEN.connectionLabels.STALE} · ${received}`
        : LIVE_TRACKING_SCREEN.connectionLabels.STALE;
    }
    if (hasLiveDriver) {
      return null;
    }
    if (locationFreshness === 'UNAVAILABLE' || trackingError) {
      return trackingError || LIVE_TRACKING_SCREEN.connectionLabels.UNAVAILABLE;
    }
    return LIVE_TRACKING_SCREEN.connectionLabels.WAITING;
  }, [
    connectionStatus,
    hasLiveDriver,
    isRideStarted,
    lastLocationUpdatedAt,
    locationFreshness,
    trackingError,
  ]);

  const vehicleLine = [tracking.driver.vehicleLabel, tracking.driver.plateNumber]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' • ');

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
                    { ...tracking.pickup, label: 'Pickup' },
                    { ...tracking.dropoff, label: 'Drop-off' },
                    ...(hasLiveDriver && driverPosition
                      ? [{ ...driverPosition, label: 'Driver' }]
                      : []),
                  ]}
                />
              ) : (
                <MapView
                  ref={mapRef}
                  style={styles.map}
                  initialRegion={initialRegion}
                  onMapReady={fitRoute}
                  onPanDrag={() => setFollowDriver(false)}
                  scrollEnabled
                  zoomEnabled
                  rotateEnabled={false}
                  pitchEnabled={false}
                  toolbarEnabled={false}
                  showsCompass={false}
                >
                  {polyline.length >= 2 ? (
                    <>
                      <Polyline
                        coordinates={polyline}
                        strokeColor="rgba(55, 75, 177, 0.2)"
                        strokeWidth={6}
                      />
                      <Polyline coordinates={polyline} strokeColor="#374BB1" strokeWidth={4} />
                    </>
                  ) : null}

                  {isValidMapCoordinate(tracking.pickup) && !isPickupVerified ? (
                    <Marker
                      coordinate={tracking.pickup}
                      tracksViewChanges={false}
                      anchor={{ x: 0.5, y: 1 }}
                    >
                      <View style={styles.pickupMarker}>
                        <View style={styles.pickupDot} />
                      </View>
                    </Marker>
                  ) : null}

                  {hasRiderPin && riderCoordinate && !isPickupVerified ? (
                    <Marker
                      coordinate={riderCoordinate}
                      tracksViewChanges={false}
                      anchor={{ x: 0.5, y: 0.5 }}
                    >
                      <View style={styles.riderMarker}>
                        <View style={styles.riderDot} />
                      </View>
                    </Marker>
                  ) : isValidMapCoordinate(tracking.pickup) && isPickupVerified ? (
                    <Marker
                      coordinate={tracking.pickup}
                      tracksViewChanges={false}
                      anchor={{ x: 0.5, y: 0.5 }}
                    >
                      <View style={styles.pickupMarker}>
                        <View style={styles.pickupDot} />
                      </View>
                    </Marker>
                  ) : null}

                  {isPickupVerified ? (
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
                  ) : null}

                  {hasLiveDriver && driverPosition ? (
                    <Marker
                      coordinate={driverPosition}
                      tracksViewChanges
                      anchor={{ x: 0.5, y: 0.5 }}
                      flat={smoothHeading != null}
                      rotation={smoothHeading ?? 0}
                    >
                      <View style={styles.carMarkerWrap}>
                        <Animated.View style={[styles.carPulse, carPulseStyle]} />
                        <View style={styles.carMarker}>
                          <Ionicons name="car" size={16} color="#374BB1" />
                        </View>
                      </View>
                    </Marker>
                  ) : null}
                </MapView>
              )}

              {connectionLabel ? (
                <View style={styles.liveLocationBadge} pointerEvents="none">
                  <Text style={styles.liveLocationBadgeText}>{connectionLabel}</Text>
                </View>
              ) : null}

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
                  <Text style={styles.etaLabel}>
                    {tracking.statusLabel || LIVE_TRACKING_SCREEN.etaLabel}
                  </Text>
                  <Text style={styles.etaValue}>
                    {LIVE_TRACKING_SCREEN.etaAwayLabelFormatted(tracking.etaLabel)}
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

          {showPickupOtp ? (
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
          ) : null}

          {isRideStarted ? (
            <View style={styles.tripDetailsCard}>
              <Text style={styles.tripDetailsTitle}>{LIVE_TRACKING_SCREEN.tripDetailsTitle}</Text>
              <View style={styles.tripDetailsRow}>
                <Text style={styles.tripDetailsLabel}>
                  {tracking.statusLabel || LIVE_TRACKING_SCREEN.etaLabel}
                </Text>
                <Text style={styles.tripDetailsValue}>{tracking.etaLabel || '—'}</Text>
              </View>
              <View style={styles.tripDetailsRow}>
                <Text style={styles.tripDetailsLabel}>{LIVE_TRACKING_SCREEN.remainingLabel}</Text>
                <Text style={styles.tripDetailsValue}>
                  {tracking.distanceRemainingLabel || '—'}
                </Text>
              </View>
              <View style={styles.tripDetailsRow}>
                <Text style={styles.tripDetailsLabel}>{LIVE_TRACKING_SCREEN.fareLabelTitle}</Text>
                <Text style={styles.tripDetailsValue}>{tracking.fareLabel || '—'}</Text>
              </View>
              <View style={styles.tripDetailsAddresses}>
                <Text style={styles.tripDetailsAddressLabel}>{tracking.pickupLabel}</Text>
                <Text style={styles.tripDetailsAddressValue} numberOfLines={2}>
                  {tracking.pickupAddress}
                </Text>
                <Text style={[styles.tripDetailsAddressLabel, { marginTop: 10 }]}>
                  {tracking.dropoffLabel}
                </Text>
                <Text style={styles.tripDetailsAddressValue} numberOfLines={2}>
                  {tracking.dropoffAddress}
                </Text>
              </View>
            </View>
          ) : null}

          <NoShowClaimPanel
            reportLabel={noShow.reportLabel}
            pendingBody={noShow.pendingBody}
            canReport={noShow.canReport}
            canRespond={noShow.canRespond}
            isClaimant={noShow.isClaimant}
            submitting={noShow.submitting}
            responding={noShow.responding}
            claim={noShow.claim}
            remainingMs={noShow.remainingMs}
            onReport={noShow.report}
            onApprove={noShow.approve}
            onReject={noShow.reject}
            onOpenSupport={noShow.openSupport}
          />

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
