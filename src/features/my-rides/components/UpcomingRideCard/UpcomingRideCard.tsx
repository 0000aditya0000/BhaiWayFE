import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, AppText as Text } from '@/shared/components';
import { MY_RIDES_SCREEN } from '../../constants';
import { canModifyRegularUpcomingRide } from '../../utils';
import { MyRidesRouteMap } from '../MyRidesRouteMap';
import { styles } from './UpcomingRideCard.styles';
import type { UpcomingRideCardProps } from './UpcomingRideCard.types';

export const UpcomingRideCard = React.memo(
  ({
    ride,
    role,
    peerLabel,
    cancelLabel,
    trackLabel,
    modifyLabel,
    onCancel,
    onTrack,
    onModify,
    onOpenDetails,
  }: UpcomingRideCardProps) => {
    const peer = ride.peer ?? ride.driver;
    const isDriver = role === 'driver';
    const showOtp = role === 'rider' && Boolean(ride.otp?.trim());
    const isDriverDriving = isDriver;
    const showRideDetails = isDriverDriving || role === 'rider';
    const isRegularDriving = isDriver && !ride.assured;
    const showModify =
      isRegularDriving && canModifyRegularUpcomingRide(ride);

    return (
      <View style={styles.rideCard}>
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.dateLabel}>{ride.dateLabel}</Text>
              <Text style={styles.rideTitle}>{ride.title}</Text>
              <View
                style={[
                  styles.rideTypeBadge,
                  ride.assured ? styles.assuredBadge : styles.regularBadge,
                ]}
              >
                <Ionicons
                  name={ride.assured ? 'checkmark-circle' : 'car-outline'}
                  size={14}
                  color={ride.assured ? '#374BB1' : '#434655'}
                />
                <Text
                  style={[
                    styles.rideTypeText,
                    ride.assured ? styles.assuredText : styles.regularText,
                  ]}
                >
                  {ride.assured
                    ? MY_RIDES_SCREEN.assuredLabel
                    : ride.commute
                      ? 'COMMUTE'
                      : MY_RIDES_SCREEN.regularLabel}
                </Text>
              </View>
              {isDriver && ride.commute && ride.seriesId ? (
                <View style={styles.seriesBadge}>
                  <Text style={styles.seriesBadgeText}>
                    {ride.direction === 'RETURN' ? 'Series · Return' : 'Series'}
                  </Text>
                </View>
              ) : null}
              {isDriver && ride.commute && (ride.pendingRequestCount ?? 0) > 0 ? (
                <View style={styles.pendingRequestsBadge}>
                  <Text style={styles.pendingRequestsBadgeText}>
                    {(ride.pendingRequestCount ?? 0) === 1
                      ? '1 request'
                      : `${ride.pendingRequestCount} requests`}
                  </Text>
                </View>
              ) : null}
            </View>
            {showModify ? (
              <Pressable
                style={({ pressed }) => [
                  styles.modifyChip,
                  pressed && { opacity: 0.9, transform: [{ scale: 0.97 }] },
                ]}
                onPress={onModify}
                accessibilityRole="button"
                accessibilityLabel={modifyLabel}
              >
                <Ionicons name="create-outline" size={14} color="#374BB1" />
                <Text style={styles.modifyChipLabel}>{modifyLabel}</Text>
              </Pressable>
            ) : showOtp ? (
              <View style={styles.otpBox}>
                <Text style={styles.otpLabel}>{MY_RIDES_SCREEN.otpLabel}</Text>
                <Text style={styles.otpValue}>{ride.otp}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.mapRouteRow}>
            <View style={styles.mapPreview}>
              <MyRidesRouteMap
                pickup={ride.pickup}
                dropoff={ride.dropoff}
                pickupLabel={ride.pickupLabel}
                dropoffLabel={ride.dropoffLabel}
                height={160}
              />
            </View>

            <View style={styles.routeBlock}>
              <View style={styles.routeLine} />
              <View style={styles.stopRow}>
                <View style={styles.stopDot}>
                  <View style={styles.stopDotInner} />
                </View>
                <Text style={styles.stopLabel}>{MY_RIDES_SCREEN.pickupLabel}</Text>
                <Text style={styles.stopValue}>{ride.pickupLabel}</Text>
              </View>
              <View style={styles.stopRow}>
                <View style={styles.stopDot}>
                  <Ionicons name="business" size={12} color="#374BB1" />
                </View>
                <Text style={styles.stopLabel}>{MY_RIDES_SCREEN.dropoffLabel}</Text>
                <Text style={styles.stopValue}>{ride.dropoffLabel}</Text>
              </View>
            </View>
          </View>

          <View style={styles.driverSection}>
            <Text style={styles.peerLabel}>{peerLabel}</Text>
            {isDriver &&
            ride.totalSeats != null &&
            ride.availableSeats != null ? (
              <Text style={styles.vehicleText}>
                {ride.vehicleLabel ? `${ride.vehicleLabel} · ` : ''}
                {MY_RIDES_SCREEN.passengersBookedSummary(
                  ride.seatsBooked ?? 0,
                  ride.availableSeats,
                )}
              </Text>
            ) : null}
            {isDriver ? (
              ride.riders && ride.riders.length > 0 ? (
                <View style={styles.ridersList}>
                  {ride.riders.map((rider) => (
                    <View key={rider.id} style={styles.driverRow}>
                      <View style={styles.driverAvatarRing}>
                        <Avatar
                          size={48}
                          uri={rider.avatarUri}
                          accessibilityLabel={`${rider.name} photo`}
                        />
                      </View>
                      <View style={styles.driverMeta}>
                        <View style={styles.driverNameRow}>
                          <Text style={styles.driverName}>{rider.name}</Text>
                          <View style={styles.seatsBadge}>
                            <Text style={styles.seatsBadgeText}>
                              {MY_RIDES_SCREEN.seatsBookedLabel(rider.seatsBooked)}
                            </Text>
                          </View>
                          {rider.verified ? (
                            <View style={styles.verifiedBadge}>
                              <Ionicons name="checkmark-circle" size={12} color="#15803D" />
                              <Text style={styles.verifiedText}>
                                {MY_RIDES_SCREEN.verifiedLabel}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        {rider.subtitle ? (
                          <Text style={styles.vehicleText}>{rider.subtitle}</Text>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyRiders}>
                  {!ride.assured ? (
                    <Text style={styles.emptyRidersHint}>
                      {MY_RIDES_SCREEN.emptyRidersRegularHint}
                    </Text>
                  ) : (
                    <Text style={styles.emptyRidersTitle}>
                      {MY_RIDES_SCREEN.emptyRidersDriving}
                    </Text>
                  )}
                </View>
              )
            ) : (
              <View style={styles.driverRow}>
                <View style={styles.driverAvatarRing}>
                  <Avatar
                    size={48}
                    uri={peer.avatarUri}
                    accessibilityLabel={`${peer.name} photo`}
                  />
                </View>
                <View style={styles.driverMeta}>
                  <View style={styles.driverNameRow}>
                    <Text style={styles.driverName}>{peer.name}</Text>
                    {peer.verified ? (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#15803D" />
                        <Text style={styles.verifiedText}>{MY_RIDES_SCREEN.verifiedLabel}</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.vehicleText}>
                    {[peer.vehicleLabel, peer.plateNumber]
                      .map((part) => part?.trim())
                      .filter(Boolean)
                      .join(' • ')}
                  </Text>
                </View>
              </View>
            )}

            {showRideDetails ? (
              <Pressable
                style={({ pressed }) => [
                  styles.detailsButton,
                  pressed && { opacity: 0.92, transform: [{ scale: 0.98 }] },
                ]}
                onPress={onOpenDetails}
                accessibilityRole="button"
                accessibilityLabel={MY_RIDES_SCREEN.rideDetailsLabel}
              >
                <Ionicons name="document-text-outline" size={16} color="#374BB1" />
                <Text style={styles.detailsLabel}>{MY_RIDES_SCREEN.rideDetailsLabel}</Text>
              </Pressable>
            ) : null}

            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && { transform: [{ scale: 0.97 }] },
                ]}
                onPress={onCancel}
                accessibilityRole="button"
                accessibilityLabel={cancelLabel}
              >
                <Text style={styles.cancelLabel}>{cancelLabel}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.trackButton,
                  pressed && { opacity: 0.92, transform: [{ scale: 0.97 }] },
                ]}
                onPress={onTrack}
                accessibilityRole="button"
                accessibilityLabel={trackLabel}
              >
                <Ionicons name="navigate" size={16} color="#FFFFFF" />
                <Text style={styles.trackLabel}>{trackLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

UpcomingRideCard.displayName = 'UpcomingRideCard';
