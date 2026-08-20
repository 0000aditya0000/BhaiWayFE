import React, { useCallback } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppFooter, ScreenHeader, AppText as Text } from '@/shared/components';
import { triggerLightHaptic } from '@/shared/utils';
import {
  ConfirmedPassengerCard,
  PendingRequestCard,
} from '@/features/my-rides/components';
import { DRIVER_TRACK_RIDE_SCREEN } from '@/features/my-rides/constants';
import { useDriverTrackRide } from '@/features/my-rides/hooks';
import { styles } from './DriverTrackRideScreen.styles';

export const DriverTrackRideScreen = () => {
  const {
    ride,
    confirmed,
    pending,
    fillPercent,
    goBack,
    callPassenger,
    chatPassenger,
    openRiderProfile,
    acceptRequest,
    declineRequest,
  } = useDriverTrackRide();

  const handleBack = useCallback(() => {
    triggerLightHaptic();
    goBack();
  }, [goBack]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.headerWrap}>
        <ScreenHeader title={DRIVER_TRACK_RIDE_SCREEN.title} onBack={handleBack} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.activeCard}>
          <Text style={styles.activeLabel}>{DRIVER_TRACK_RIDE_SCREEN.activeLabel}</Text>
          <View style={styles.activeRow}>
            <View style={styles.activeMeta}>
              <Text style={styles.routeTitle}>{ride.routeTitle}</Text>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={16} color="rgba(234, 235, 255, 0.9)" />
                <Text style={styles.dateLabel}>{ride.dateLabel}</Text>
              </View>
            </View>
            <View style={styles.idBadge}>
              <Text style={styles.idBadgeText}>ID: {ride.listingId}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {DRIVER_TRACK_RIDE_SCREEN.confirmedTitle(
                ride.seatsConfirmed,
                ride.seatsTotal,
              )}
            </Text>
            <View style={styles.fillBadge}>
              <Text style={styles.fillBadgeText}>
                {DRIVER_TRACK_RIDE_SCREEN.fullPercentLabel(fillPercent)}
              </Text>
            </View>
          </View>
          <View style={styles.list}>
            {confirmed.map((passenger) => (
              <ConfirmedPassengerCard
                key={passenger.id}
                passenger={passenger}
                onCall={() => callPassenger(passenger.name)}
                onChat={() =>
                  chatPassenger({
                    id: passenger.id,
                    name: passenger.name,
                    avatarUri: passenger.avatarUri,
                  })
                }
                onPressProfile={() =>
                  openRiderProfile({
                    id: passenger.id,
                    name: passenger.name,
                    subtitle: passenger.subtitle,
                    avatarUri: passenger.avatarUri,
                    seatsBooked: passenger.seatsBooked,
                    verified: passenger.verified,
                  })
                }
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {DRIVER_TRACK_RIDE_SCREEN.pendingTitle(pending.length)}
          </Text>
          <View style={styles.list}>
            {pending.map((request) => (
              <PendingRequestCard
                key={request.id}
                request={request}
                onAccept={() => acceptRequest(request.id)}
                onDecline={() => declineRequest(request.id)}
                onPressProfile={() =>
                  openRiderProfile({
                    id: request.id,
                    name: request.name,
                    subtitle: request.subtitle,
                    avatarUri: request.avatarUri,
                    rating: request.rating,
                    ridesCount: request.ridesCount,
                    seatsBooked: request.seatsBooked,
                    verified: request.idVerified,
                  })
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>

      <AppFooter activeTab="rides" />
    </SafeAreaView>
  );
};
