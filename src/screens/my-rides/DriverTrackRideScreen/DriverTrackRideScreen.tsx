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
import {
  ConfirmedPassengerCard,
  MyRidesRouteMap,
  PendingRequestCard,
} from '@/features/my-rides/components';
import { DRIVER_TRACK_RIDE_SCREEN } from '@/features/my-rides/constants';
import { useDriverTrackRide } from '@/features/my-rides/hooks';
import { NoShowClaimPanel, useNoShowClaim } from '@/features/no-show';
import { useLocalSearchParams } from 'expo-router';
import { styles } from './DriverTrackRideScreen.styles';

export const DriverTrackRideScreen = () => {
  const params = useLocalSearchParams<{ claimId?: string }>();
  const {
    ride,
    confirmed,
    pending,
    fillPercent,
    isDemoRide,
    loading,
    refreshing,
    errorMessage,
    refresh,
    goBack,
    callPassenger,
    chatPassenger,
    openRiderProfile,
    acceptRequest,
    declineRequest,
    openCancelRide,
    isAccepting,
    isRejecting,
  } = useDriverTrackRide();

  const noShow = useNoShowClaim({
    role: 'driver',
    rideId: ride.rideId,
    claimId: getSearchParam(params.claimId),
    isRideOwner: true,
    enabled: !isDemoRide,
  });

  const showPendingRequests = isDemoRide || ride.rideType === 'commute';

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

  const fillWidth = `${Math.min(100, Math.max(0, fillPercent))}%` as `${number}%`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerWrap}>
        <ScreenHeader title={DRIVER_TRACK_RIDE_SCREEN.title} onBack={handleBack} />
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
                <Text style={styles.livePillText}>{DRIVER_TRACK_RIDE_SCREEN.activeLabel}</Text>
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

        <View style={styles.statsCard}>
          <Text style={styles.sectionEyebrow}>{DRIVER_TRACK_RIDE_SCREEN.tripStatsLabel}</Text>
          <View style={styles.statsGrid}>
            <StatTile
              icon={ride.rideType === 'assured' ? 'checkmark-circle-outline' : 'car-outline'}
              label={DRIVER_TRACK_RIDE_SCREEN.rideTypeLabel}
              value={
                ride.rideType === 'assured'
                  ? DRIVER_TRACK_RIDE_SCREEN.assuredLabel
                  : ride.rideType === 'commute'
                    ? DRIVER_TRACK_RIDE_SCREEN.commuteLabel
                    : DRIVER_TRACK_RIDE_SCREEN.regularLabel
              }
            />
            <StatTile
              icon="time-outline"
              label={DRIVER_TRACK_RIDE_SCREEN.departureLabel}
              value={ride.departureTimeLabel}
            />
            <StatTile
              icon="people-outline"
              label={DRIVER_TRACK_RIDE_SCREEN.bookedSeatsLabel}
              value={`${ride.seatsConfirmed}/${ride.seatsTotal}`}
            />
            <StatTile
              icon="ellipse-outline"
              label={DRIVER_TRACK_RIDE_SCREEN.availableSeatsLabel}
              value={String(ride.seatsAvailable)}
            />
            <StatTile
              icon="speedometer-outline"
              label={DRIVER_TRACK_RIDE_SCREEN.seatsFillLabel}
              value={DRIVER_TRACK_RIDE_SCREEN.fullPercentLabel(fillPercent)}
            />
            {ride.securityDepositLabel ? (
              <StatTile
                icon="shield-checkmark-outline"
                label={DRIVER_TRACK_RIDE_SCREEN.depositLabel}
                value={ride.securityDepositLabel}
              />
            ) : null}
          </View>

          <View style={styles.fillTrack}>
            <View style={[styles.fillBar, { width: fillWidth }]} />
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
              <Text style={styles.sectionTitle}>{DRIVER_TRACK_RIDE_SCREEN.passengersLabel}</Text>
              <Text style={styles.sectionSubtitle}>
                {DRIVER_TRACK_RIDE_SCREEN.passengersSummary(
                  ride.seatsConfirmed,
                  ride.seatsAvailable,
                )}
              </Text>
            </View>
            <View style={styles.fillBadge}>
              <Text style={styles.fillBadgeText}>
                {DRIVER_TRACK_RIDE_SCREEN.fullPercentLabel(fillPercent)}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.stateBlock}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.stateText}>{DRIVER_TRACK_RIDE_SCREEN.loadingLabel}</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.stateBlock}>
              <Text style={styles.stateTitle}>{DRIVER_TRACK_RIDE_SCREEN.errorTitle}</Text>
              <Text style={styles.stateText}>{errorMessage}</Text>
              <Pressable
                style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.9 }]}
                onPress={handleRetry}
                accessibilityRole="button"
                accessibilityLabel={DRIVER_TRACK_RIDE_SCREEN.errorRetryLabel}
              >
                <Text style={styles.retryLabel}>{DRIVER_TRACK_RIDE_SCREEN.errorRetryLabel}</Text>
              </Pressable>
            </View>
          ) : confirmed.length === 0 ? (
            <View style={styles.stateBlock}>
              <Text style={styles.stateTitle}>{DRIVER_TRACK_RIDE_SCREEN.emptyPassengersTitle}</Text>
              <Text style={styles.stateText}>
                {DRIVER_TRACK_RIDE_SCREEN.emptyPassengersSubtitle}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {confirmed.map((passenger) => (
                <ConfirmedPassengerCard
                  key={passenger.id}
                  passenger={passenger}
                  onCall={() => callPassenger(passenger)}
                  onChat={() => chatPassenger(passenger)}
                  onPressProfile={() => openRiderProfile(passenger)}
                />
              ))}
            </View>
          )}
        </View>

        {showPendingRequests ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {DRIVER_TRACK_RIDE_SCREEN.pendingTitle(pending.length)}
            </Text>
            {pending.length === 0 ? (
              <View style={styles.stateBlock}>
                <Text style={styles.stateTitle}>{DRIVER_TRACK_RIDE_SCREEN.pendingEmptyTitle}</Text>
                <Text style={styles.stateText}>
                  {DRIVER_TRACK_RIDE_SCREEN.pendingEmptySubtitle}
                </Text>
              </View>
            ) : (
              <View style={styles.list}>
                {pending.map((request) => {
                  const bookingId = request.bookingId || request.id;
                  return (
                    <PendingRequestCard
                      key={request.id}
                      request={request}
                      onAccept={() => acceptRequest(request.id)}
                      onDecline={() => declineRequest(request.id)}
                      acceptLoading={isAccepting(bookingId)}
                      declineLoading={isRejecting(bookingId)}
                      disabled={isAccepting(bookingId) || isRejecting(bookingId)}
                      onPressProfile={() =>
                        openRiderProfile({
                          id: request.id,
                          name: request.name,
                          subtitle: request.subtitle,
                          verified: request.idVerified,
                          avatarUri: request.avatarUri,
                          seatsBooked: request.seatsBooked,
                          callAvailable: true,
                          chatAvailable: true,
                        })
                      }
                    />
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {!isDemoRide ? (
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
        ) : null}

        {!isDemoRide ? (
          <Pressable
            style={({ pressed }) => [
              styles.cancelRideBtn,
              pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            onPress={handleCancelRide}
            accessibilityRole="button"
            accessibilityLabel={DRIVER_TRACK_RIDE_SCREEN.cancelRideLabel}
          >
            <Ionicons name="close-circle-outline" size={18} color={colors.error} />
            <Text style={styles.cancelRideLabel}>{DRIVER_TRACK_RIDE_SCREEN.cancelRideLabel}</Text>
          </Pressable>
        ) : null}
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
