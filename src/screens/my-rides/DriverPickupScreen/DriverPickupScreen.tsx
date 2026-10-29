import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, BrandTopBar, IconButton, AppText as Text } from '@/shared/components';
import {
  isGoogleMapsBypassed,
  isValidMapCoordinate,
  MapBypassSurface,
  type MapLatLng,
} from '@/shared/maps';
import { spacing } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { ArrivalConfirmedModal, PickupOtpModal, SwipeToComplete } from '@/features/my-rides/components';
import { DRIVER_PICKUP_MAP_DELTA, DRIVER_PICKUP_SCREEN } from '@/features/my-rides/constants';
import {
  DRIVER_PICKUP_OTP_SWIPE_THRESHOLD,
  useDriverPickup,
} from '@/features/my-rides/hooks';
import {
  NoShowClaimPanel,
  resolvePassengerNoShowBookingId,
  useNoShowClaim,
} from '@/features/no-show';
import { useLocalSearchParams } from 'expo-router';
import { styles } from './DriverPickupScreen.styles';

const EDGE_PADDING = {
  top: spacing.xl,
  right: 48,
  bottom: spacing.xl + 40,
  left: spacing.xl,
};

const toRegion = (latitude: number, longitude: number): Region => ({
  latitude,
  longitude,
  ...DRIVER_PICKUP_MAP_DELTA,
});

export const DriverPickupScreen = () => {
  const mapRef = useRef<MapView>(null);
  const params = useLocalSearchParams<{ rideId?: string; claimId?: string }>();
  const {
    stop,
    stopTitle,
    confirming,
    requiresOtp,
    otpVisible,
    otpValue,
    otpError,
    otpVerifying,
    confirmedVisible,
    isLastStop,
    swipeResetKey,
    driverCoordinate,
    routeCoordinates,
    etaLabel,
    distanceLabel,
    requestRiderOtp,
    setOtpValue,
    verifyOtp,
    closeOtp,
    continueAfterConfirmed,
    goBack,
    openNotifications,
    openGoogleMaps,
  } = useDriverPickup();

  const currentBookingId = resolvePassengerNoShowBookingId(stop.id);
  const noShow = useNoShowClaim({
    role: 'driver',
    rideId: getSearchParam(params.rideId),
    bookingId: currentBookingId,
    claimId: getSearchParam(params.claimId),
    bookingStatus: currentBookingId ? 'CONFIRMED' : undefined,
    isRideOwner: true,
    enabled: Boolean(currentBookingId),
  });

  const hasDriver = isValidMapCoordinate(driverCoordinate);
  const hasPickup = isValidMapCoordinate(stop.coordinate);

  const fitCoordinates = useMemo(() => {
    const points: MapLatLng[] = [];
    if (hasDriver && driverCoordinate) {
      points.push(driverCoordinate);
    }
    if (hasPickup) {
      points.push(stop.coordinate);
    }
    return points;
  }, [driverCoordinate, hasDriver, hasPickup, stop.coordinate]);

  const polyline = useMemo(() => {
    if (routeCoordinates.length >= 2) {
      return routeCoordinates;
    }
    if (hasDriver && driverCoordinate && hasPickup) {
      return [driverCoordinate, stop.coordinate];
    }
    return [];
  }, [
    driverCoordinate,
    hasDriver,
    hasPickup,
    routeCoordinates,
    stop.coordinate,
  ]);

  const initialRegionRef = useRef(
    toRegion(stop.coordinate.latitude, stop.coordinate.longitude),
  );

  const fitRoute = useCallback(() => {
    if (isGoogleMapsBypassed()) {
      return;
    }
    const valid = fitCoordinates.filter(isValidMapCoordinate);
    if (valid.length >= 2) {
      mapRef.current?.fitToCoordinates(valid, {
        edgePadding: EDGE_PADDING,
        animated: true,
      });
      return;
    }
    if (valid.length === 1) {
      mapRef.current?.animateToRegion(toRegion(valid[0].latitude, valid[0].longitude), 450);
    }
  }, [fitCoordinates]);

  useEffect(() => {
    fitRoute();
  }, [fitRoute, stop.id]);

  const handleThresholdReach = useCallback(() => {
    triggerLightHaptic();
    requestRiderOtp();
  }, [requestRiderOtp]);

  const handleVerify = useCallback(() => {
    triggerLightHaptic();
    verifyOtp();
  }, [verifyOtp]);

  const handleCloseOtp = useCallback(() => {
    triggerLightHaptic();
    closeOtp();
  }, [closeOtp]);

  const handleContinueConfirmed = useCallback(() => {
    triggerLightHaptic();
    continueAfterConfirmed();
  }, [continueAfterConfirmed]);

  const handleMenu = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleNotifications = useCallback(() => {
    triggerLightHaptic();
    openNotifications();
  }, [openNotifications]);

  const handleOpenMaps = useCallback(() => {
    triggerLightHaptic();
    openGoogleMaps();
  }, [openGoogleMaps]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <BrandTopBar
        onMenuPress={handleMenu}
        right={
          <IconButton
            icon="notifications-outline"
            onPress={handleNotifications}
            color="#4B61C4"
            accessibilityLabel="Notifications"
          />
        }
      />

      <View style={styles.mapLayer}>
        {isGoogleMapsBypassed() ? (
          <MapBypassSurface
            style={styles.map}
            title={stopTitle}
            subtitle={stop.locationLabel}
            points={[
              { ...stop.coordinate, label: 'Pickup' },
              ...(hasDriver && driverCoordinate
                ? [{ ...driverCoordinate, label: 'You' }]
                : []),
            ]}
          />
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegionRef.current}
            onMapReady={fitRoute}
            showsCompass={false}
            toolbarEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            showsUserLocation={false}
            showsMyLocationButton={false}
          >
            {polyline.length >= 2 ? (
              <>
                <Polyline
                  coordinates={polyline}
                  strokeColor="rgba(75, 97, 196, 0.25)"
                  strokeWidth={6}
                />
                <Polyline coordinates={polyline} strokeColor="#4B61C4" strokeWidth={4} />
              </>
            ) : null}

            {hasPickup ? (
              <Marker
                coordinate={stop.coordinate}
                tracksViewChanges={false}
                anchor={{ x: 0.5, y: 1 }}
                title={stop.passengerName}
                description={stop.locationLabel}
              >
                <View style={styles.pickupMarker}>
                  <View style={styles.pickupBadge}>
                    <Text style={styles.pickupBadgeText}>Pickup</Text>
                  </View>
                  <Ionicons name="location" size={40} color="#4B61C4" />
                </View>
              </Marker>
            ) : null}

            {hasDriver && driverCoordinate ? (
              <Marker
                coordinate={driverCoordinate}
                tracksViewChanges={false}
                anchor={{ x: 0.5, y: 0.5 }}
                title="You"
              >
                <View style={styles.carMarker}>
                  <Ionicons name="car" size={16} color="#4B61C4" />
                </View>
              </Marker>
            ) : null}
          </MapView>
        )}
        <LinearGradient
          colors={[
            'rgba(248,249,250,1)',
            'rgba(248,249,250,0)',
            'rgba(248,249,250,0)',
            'rgba(248,249,250,1)',
          ]}
          locations={[0, 0.15, 0.85, 1]}
          style={styles.mapGradient}
          pointerEvents="none"
        />
      </View>

      <View style={styles.content} pointerEvents="box-none">
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.nextStopLabel}>{DRIVER_PICKUP_SCREEN.nextStopLabel}</Text>
              <Text style={styles.pickupTitle}>{stopTitle}</Text>
            </View>
            <View style={styles.passengerBadge}>
              <Ionicons name="people" size={16} color="#FFFFFF" />
              <Text style={styles.passengerName}>{stop.passengerName}</Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <View style={styles.locationIcon}>
              <Ionicons name="location" size={22} color="#4B61C4" />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationLabel} numberOfLines={2}>
                {stop.locationLabel}
              </Text>
              <Text style={styles.etaLabel}>{stop.etaLabel}</Text>
            </View>
          </View>

          <View style={styles.etaRow}>
            <View style={styles.etaChip}>
              <Text style={styles.etaChipLabel}>{DRIVER_PICKUP_SCREEN.etaHeading}</Text>
              <Text style={styles.etaChipValue}>{etaLabel}</Text>
            </View>
            <View style={styles.etaChip}>
              <Text style={styles.etaChipLabel}>Distance</Text>
              <Text style={styles.etaChipValue}>{distanceLabel}</Text>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.mapsButton, pressed && { opacity: 0.9 }]}
            onPress={handleOpenMaps}
            accessibilityRole="button"
            accessibilityLabel={DRIVER_PICKUP_SCREEN.navigateMapsLabel}
          >
            <Ionicons name="navigate" size={18} color="#374BB1" />
            <Text style={styles.mapsButtonLabel}>
              {DRIVER_PICKUP_SCREEN.navigateMapsLabel}
            </Text>
          </Pressable>

          {noShow.claim ? (
            <View style={{ marginTop: spacing.md }}>
              <NoShowClaimPanel
                reportLabel={noShow.reportLabel}
                pendingBody={noShow.pendingBody}
                canReport={false}
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
            </View>
          ) : null}

          <SwipeToComplete
            key={swipeResetKey}
            label={DRIVER_PICKUP_SCREEN.swipeLabel}
            completedLabel={DRIVER_PICKUP_SCREEN.completedLabel}
            completed={confirming}
            threshold={DRIVER_PICKUP_OTP_SWIPE_THRESHOLD}
            holdAtThreshold={otpVisible}
            onThresholdReach={handleThresholdReach}
            onComplete={handleThresholdReach}
          />
        </View>
      </View>

      {requiresOtp ? (
        <PickupOtpModal
          visible={otpVisible}
          passengerName={stop.passengerName}
          otpLength={DRIVER_PICKUP_SCREEN.otpLength}
          value={otpValue}
          error={otpError}
          verifying={otpVerifying}
          hintOtp={requiresOtp && stop.otp ? stop.otp : undefined}
          onChange={setOtpValue}
          onVerify={handleVerify}
          onClose={handleCloseOtp}
          footerExtra={
            noShow.canReport || noShow.claim ? (
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
                compact
                onReport={noShow.report}
                onApprove={noShow.approve}
                onReject={noShow.reject}
                onOpenSupport={noShow.openSupport}
              />
            ) : null
          }
        />
      ) : null}

      <ArrivalConfirmedModal
        visible={confirmedVisible}
        passengerName={stop.passengerName}
        isLastStop={isLastStop}
        onContinue={handleContinueConfirmed}
      />

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
