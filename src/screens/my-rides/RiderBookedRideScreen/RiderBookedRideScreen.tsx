import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, ScreenHeader, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { getSearchParam, triggerLightHaptic } from '@/shared/utils';
import { useLocalSearchParams } from 'expo-router';
import {
  ConfirmedPassengerCard,
  MyRidesRouteMap,
  RiderCoPassengerRow,
} from '@/features/my-rides/components';
import {
  DRIVER_TRACK_RIDE_SCREEN,
  RIDER_BOOKED_RIDE_SCREEN,
} from '@/features/my-rides/constants';
import { useRiderBookedRide } from '@/features/my-rides/hooks';
import { NoShowClaimPanel, useNoShowClaim } from '@/features/no-show';
import { styles } from '../DriverTrackRideScreen/DriverTrackRideScreen.styles';
import { riderStyles } from './RiderBookedRideScreen.styles';

export const RiderBookedRideScreen = () => {
  const params = useLocalSearchParams<{ claimId?: string }>();
  const {
    ride,
    driver,
    coPassengers,
    loading,
    refreshing,
    errorMessage,
    refresh,
    goBack,
    callDriver,
    chatDriver,
    openCancelRide,
  } = useRiderBookedRide();

  const noShow = useNoShowClaim({
    role: 'passenger',
    rideId: ride?.rideId,
    bookingId: ride?.bookingId,
    claimId: getSearchParam(params.claimId),
    bookingStatus: ride?.bookingStatus,
    rideStatus: ride?.rideStatus,
    pickupStatus: ride?.pickupStatus,
    isRideOwner: false,
    enabled: Boolean(ride),
  });

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  const handleRetry = useCallback(() => {
    triggerLightHaptic();
    void refresh();
  }, [refresh]);

  const handleCancelRide = useCallback(() => {
    openCancelRide();
  }, [openCancelRide]);

  if (!ride && loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.headerWrap}>
          <ScreenHeader title={RIDER_BOOKED_RIDE_SCREEN.title} onBack={handleBack} />
        </View>
        <View style={styles.stateBlock}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.stateText}>{RIDER_BOOKED_RIDE_SCREEN.loadingLabel}</Text>
        </View>
        <AppFooter activeTab="rides" />
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.headerWrap}>
          <ScreenHeader title={RIDER_BOOKED_RIDE_SCREEN.title} onBack={handleBack} />
        </View>
        <View style={styles.stateBlock}>
          <Text style={styles.stateTitle}>{RIDER_BOOKED_RIDE_SCREEN.errorTitle}</Text>
          <Text style={styles.stateText}>
            {errorMessage || RIDER_BOOKED_RIDE_SCREEN.missingBookingMessage}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.9 }]}
            onPress={handleRetry}
            accessibilityRole="button"
            accessibilityLabel={RIDER_BOOKED_RIDE_SCREEN.errorRetryLabel}
          >
            <Text style={styles.retryLabel}>{RIDER_BOOKED_RIDE_SCREEN.errorRetryLabel}</Text>
          </Pressable>
        </View>
        <AppFooter activeTab="rides" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerWrap}>
        <ScreenHeader title={RIDER_BOOKED_RIDE_SCREEN.title} onBack={handleBack} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refresh()} />
        }
      >
        <View style={styles.heroCard}>
          <MyRidesRouteMap
            pickup={ride.pickup}
            dropoff={ride.dropoff}
            pickupLabel={ride.source}
            dropoffLabel={ride.destination}
            height={220}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.heroTopRow}>
              <View style={styles.livePill}>
                <View style={styles.liveDot} />
                <Text style={styles.livePillText}>{RIDER_BOOKED_RIDE_SCREEN.activeLabel}</Text>
              </View>
              <View style={styles.idChip}>
                <Text style={styles.idChipText}>ID {ride.listingId}</Text>
              </View>
            </View>
            <Text style={styles.heroRoute}>{ride.routeTitle}</Text>
            <View style={styles.heroMetaRow}>
              <Ionicons name="calendar-outline" size={14} color={colors.textInverse} />
              <Text style={styles.heroMetaText}>{ride.dateLabel}</Text>
            </View>
          </View>
        </View>

        <View style={styles.routeCard}>
          <Text style={styles.sectionEyebrow}>{DRIVER_TRACK_RIDE_SCREEN.routeOverviewLabel}</Text>
          <View style={riderStyles.routeCardBody}>
            <View style={riderStyles.routeTimelineWrap}>
              <View style={styles.timeline}>
                <View style={styles.timelineRail}>
                  <View style={styles.timelineDotStart} />
                  <View style={styles.timelineLine} />
                  <View style={styles.timelineDotEnd} />
                </View>
                <View style={styles.timelineCopy}>
                  <View style={styles.timelineStop}>
                    <Text style={styles.timelineLabel}>{DRIVER_TRACK_RIDE_SCREEN.sourceLabel}</Text>
                    <Text style={styles.timelineValue}>{ride.source}</Text>
                  </View>
                  <View style={styles.timelineStop}>
                    <Text style={styles.timelineLabel}>
                      {DRIVER_TRACK_RIDE_SCREEN.destinationLabel}
                    </Text>
                    <Text style={styles.timelineValue}>{ride.destination}</Text>
                  </View>
                </View>
              </View>
            </View>

            {ride.pickupOtp ? (
              <View
                style={riderStyles.routeOtpBlock}
                accessibilityRole="text"
                accessibilityLabel={`${RIDER_BOOKED_RIDE_SCREEN.otpLabel}: ${ride.pickupOtp}`}
              >
                <Text style={riderStyles.routeOtpLabel}>{RIDER_BOOKED_RIDE_SCREEN.otpLabel}</Text>
                <Text style={riderStyles.routeOtpValue}>{ride.pickupOtp}</Text>
                <Text style={riderStyles.routeOtpHint}>{RIDER_BOOKED_RIDE_SCREEN.otpHint}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionEyebrow}>{DRIVER_TRACK_RIDE_SCREEN.tripStatsLabel}</Text>
          <View style={styles.statsGrid}>
            <StatTile
              icon={ride.rideType === 'assured' ? 'checkmark-circle-outline' : 'car-outline'}
              label={DRIVER_TRACK_RIDE_SCREEN.rideTypeLabel}
              value={
                ride.rideType === 'assured'
                  ? DRIVER_TRACK_RIDE_SCREEN.assuredLabel
                  : DRIVER_TRACK_RIDE_SCREEN.regularLabel
              }
            />
            <StatTile
              icon="time-outline"
              label={DRIVER_TRACK_RIDE_SCREEN.departureLabel}
              value={ride.departureTimeLabel || '—'}
            />
            <StatTile
              icon="person-outline"
              label={DRIVER_TRACK_RIDE_SCREEN.bookedSeatsLabel}
              value={String(ride.seatsBooked)}
            />
            <StatTile
              icon="wallet-outline"
              label={DRIVER_TRACK_RIDE_SCREEN.fareLabel}
              value={ride.fareTotal > 0 ? `₹${ride.fareTotal}` : '—'}
            />
            {ride.paymentStatus ? (
              <StatTile
                icon="card-outline"
                label={DRIVER_TRACK_RIDE_SCREEN.paymentLabel}
                value={ride.paymentStatus}
              />
            ) : null}
            {ride.securityDepositLabel ? (
              <StatTile
                icon="shield-checkmark-outline"
                label={RIDER_BOOKED_RIDE_SCREEN.depositLabel}
                value={ride.securityDepositLabel}
              />
            ) : null}
          </View>

          {ride.vehicleLabel ? (
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleIcon}>
                <Ionicons name="car-sport-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.vehicleCopy}>
                <Text style={styles.timelineLabel}>{DRIVER_TRACK_RIDE_SCREEN.vehicleLabel}</Text>
                <Text style={styles.vehicleValue}>{ride.vehicleLabel}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitle}>{RIDER_BOOKED_RIDE_SCREEN.preferencesLabel}</Text>
              <Text style={styles.sectionSubtitle}>
                {RIDER_BOOKED_RIDE_SCREEN.preferencesSubtitle}
              </Text>
            </View>
          </View>
          <View style={riderStyles.preferencesCard}>
            {ride.womenOnly ? (
              <View style={riderStyles.womenOnlyChip} accessibilityLabel="Women Only">
                <Ionicons name="woman-outline" size={14} color="#9D174D" />
                <Text style={riderStyles.womenOnlyChipText}>
                  {RIDER_BOOKED_RIDE_SCREEN.womenOnlyLabel}
                </Text>
              </View>
            ) : null}
            {ride.preferences.length === 0 && !ride.womenOnly ? (
              <Text style={riderStyles.preferencesEmpty}>
                {RIDER_BOOKED_RIDE_SCREEN.preferencesEmptyLabel}
              </Text>
            ) : (
              <View style={riderStyles.preferencesList}>
                {ride.preferences.map((preference) => (
                  <View key={preference.id} style={riderStyles.preferenceRow}>
                    <View style={riderStyles.preferenceIcon}>
                      <Ionicons
                        name={preferenceIcon(preference.icon)}
                        size={16}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={riderStyles.preferenceLabel}>{preference.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitle}>{RIDER_BOOKED_RIDE_SCREEN.driverSectionLabel}</Text>
              <Text style={styles.sectionSubtitle}>
                {RIDER_BOOKED_RIDE_SCREEN.driverSectionSubtitle}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.stateBlock}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.stateText}>{RIDER_BOOKED_RIDE_SCREEN.loadingLabel}</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateBlock}>
              <Text style={styles.stateTitle}>{RIDER_BOOKED_RIDE_SCREEN.errorTitle}</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <Pressable
                style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.9 }]}
                onPress={handleRetry}
                accessibilityRole="button"
                accessibilityLabel={RIDER_BOOKED_RIDE_SCREEN.errorRetryLabel}
              >
                <Text style={styles.retryLabel}>{RIDER_BOOKED_RIDE_SCREEN.errorRetryLabel}</Text>
              </Pressable>
            </View>
          ) : driver ? (
            <View style={styles.list}>
              <ConfirmedPassengerCard
                passenger={driver}
                onCall={callDriver}
                onChat={chatDriver}
              />
            </View>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitle}>{RIDER_BOOKED_RIDE_SCREEN.coPassengersLabel}</Text>
              <Text style={styles.sectionSubtitle}>
                {coPassengers.length > 0
                  ? RIDER_BOOKED_RIDE_SCREEN.coPassengersSummary(coPassengers.length)
                  : RIDER_BOOKED_RIDE_SCREEN.coPassengersSubtitle}
              </Text>
            </View>
            <View style={styles.fillBadge}>
              <Text style={styles.fillBadgeText}>
                {ride.seatsAvailable}{' '}
                {ride.seatsAvailable === 1 ? 'seat left' : 'seats left'}
              </Text>
            </View>
          </View>

          {coPassengers.length === 0 ? (
            <View style={styles.stateBlock}>
              <Text style={styles.stateTitle}>
                {RIDER_BOOKED_RIDE_SCREEN.emptyCoPassengersTitle}
              </Text>
              <Text style={styles.stateText}>
                {RIDER_BOOKED_RIDE_SCREEN.emptyCoPassengersSubtitle}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {coPassengers.map((passenger) => (
                <RiderCoPassengerRow key={passenger.id} passenger={passenger} />
              ))}
            </View>
          )}
        </View>

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

        <Pressable
          style={({ pressed }) => [
            styles.cancelRideBtn,
            pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
          ]}
          onPress={handleCancelRide}
          accessibilityRole="button"
          accessibilityLabel={RIDER_BOOKED_RIDE_SCREEN.cancelRideLabel}
        >
          <Ionicons name="close-circle-outline" size={18} color={colors.error} />
          <Text style={styles.cancelRideLabel}>{RIDER_BOOKED_RIDE_SCREEN.cancelRideLabel}</Text>
        </Pressable>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};

const StatTile = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) => (
  <View style={styles.statTile}>
    <View style={styles.statIcon}>
      <Ionicons name={icon} size={16} color={colors.primary} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const preferenceIcon = (
  icon: 'ban' | 'snow' | 'time' | 'bag' | 'people' | 'musical-notes' | 'paw' | 'checkmark-circle',
): keyof typeof Ionicons.glyphMap => {
  switch (icon) {
    case 'ban':
      return 'ban-outline';
    case 'paw':
      return 'paw-outline';
    case 'bag':
      return 'briefcase-outline';
    case 'people':
      return 'people-outline';
    case 'musical-notes':
      return 'musical-notes-outline';
    case 'snow':
      return 'snow-outline';
    case 'time':
      return 'time-outline';
    case 'checkmark-circle':
      return 'checkmark-circle-outline';
    default:
      return 'information-circle-outline';
  }
};
