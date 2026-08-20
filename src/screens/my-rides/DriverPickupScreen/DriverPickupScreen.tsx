import React, { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, BrandTopBar, IconButton, AppText as Text } from '@/shared/components';
import { isGoogleMapsBypassed, MapBypassSurface } from '@/shared/maps';
import { triggerLightHaptic } from '@/shared/utils';
import { ArrivalConfirmedModal, PickupOtpModal, SwipeToComplete } from '@/features/my-rides/components';
import { DRIVER_PICKUP_MAP_DELTA, DRIVER_PICKUP_SCREEN } from '@/features/my-rides/constants';
import {
  DRIVER_PICKUP_OTP_SWIPE_THRESHOLD,
  useDriverPickup,
} from '@/features/my-rides/hooks';
import { styles } from './DriverPickupScreen.styles';

const toRegion = (latitude: number, longitude: number): Region => ({
  latitude,
  longitude,
  ...DRIVER_PICKUP_MAP_DELTA,
});

export const DriverPickupScreen = () => {
  const mapRef = useRef<MapView>(null);
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
    requestRiderOtp,
    setOtpValue,
    verifyOtp,
    closeOtp,
    continueAfterConfirmed,
    goBack,
    openNotifications,
  } = useDriverPickup();

  const initialRegionRef = useRef(
    toRegion(stop.coordinate.latitude, stop.coordinate.longitude),
  );

  useEffect(() => {
    if (isGoogleMapsBypassed()) {
      return;
    }
    mapRef.current?.animateToRegion(
      toRegion(stop.coordinate.latitude, stop.coordinate.longitude),
      450,
    );
  }, [stop.coordinate.latitude, stop.coordinate.longitude, stop.id]);

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
            points={[{ ...stop.coordinate, label: stop.passengerName || 'Pickup' }]}
          />
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={initialRegionRef.current}
            showsCompass={false}
            toolbarEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
            showsUserLocation
            showsMyLocationButton={false}
          >
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
              <Text style={styles.locationLabel}>{stop.locationLabel}</Text>
              <Text style={styles.etaLabel}>{stop.etaLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} pointerEvents="none" />

        <View style={styles.swipeWrap}>
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
          hintOtp={stop.otp}
          onChange={setOtpValue}
          onVerify={handleVerify}
          onClose={handleCloseOtp}
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
