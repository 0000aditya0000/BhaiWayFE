import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatRidePrice, getSeatUrgency } from '@/features/ride-search/constants';
import { COMMUTE_RIDE_RESULT_SCREEN } from '../../constants/commute-ride-result.constants';
import { styles } from './CommuteRideResultCard.styles';
import type { CommuteRideResultCardProps } from './CommuteRideResultCard.types';
import { AppText as Text } from '@/shared/components';

export const CommuteRideResultCard = React.memo(
  ({ ride, requestState = 'idle', onPress, onRequestPress }: CommuteRideResultCardProps) => {
    const urgency = useMemo(() => getSeatUrgency(ride.seatsLeft), [ride.seatsLeft]);
    const isUrgent = urgency === 'last' || urgency === 'limited';
    const seatSuffix = ride.seatsLeft === 1 ? 'seat left' : 'seats left';
    const verified = ride.driver.verified;

    const handlePress = useCallback(() => onPress(ride), [onPress, ride]);
    const handleRequest = useCallback(() => onRequestPress(ride), [onRequestPress, ride]);

    const requestLabel =
      requestState === 'requesting'
        ? COMMUTE_RIDE_RESULT_SCREEN.requestingLabel
        : requestState === 'requested'
          ? COMMUTE_RIDE_RESULT_SCREEN.requestedLabel
          : COMMUTE_RIDE_RESULT_SCREEN.bookLabel;

    return (
      <Pressable
        style={[styles.card, verified && styles.cardVerified]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Ride with ${ride.driver.name}, ${formatRidePrice(ride.price)}`}
        android_ripple={{ color: 'rgba(11, 28, 48, 0.06)' }}
      >
        <View style={styles.body}>
          <View style={styles.header}>
            <View style={styles.driverRow}>
              {ride.driver.avatarUri ? (
                <Image
                  source={{ uri: ride.driver.avatarUri }}
                  style={styles.avatar}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="person" size={22} color="#7C839B" />
                </View>
              )}
              <View style={styles.driverMeta}>
                <View style={styles.nameRow}>
                  <Text style={styles.driverName} numberOfLines={1}>
                    {ride.driver.name}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#4B61C4" />
                    <Text style={styles.ratingText}>{ride.driver.rating.toFixed(1)}</Text>
                  </View>
                </View>
                <Text style={styles.vehicle} numberOfLines={1}>
                  {ride.carModel} • {ride.vehicleColor}
                </Text>
              </View>
            </View>

            <View style={styles.priceCol}>
              <Text style={styles.price}>{formatRidePrice(ride.price)}</Text>
              <Text style={styles.priceCaption}>{COMMUTE_RIDE_RESULT_SCREEN.priceCaption}</Text>
            </View>
          </View>

          <View style={styles.detailsRow}>
            <View style={styles.departureCol}>
              <Text style={styles.departureTime}>{ride.departureTime}</Text>
              <Text style={styles.departureLabel}>
                {COMMUTE_RIDE_RESULT_SCREEN.departureLabel}
              </Text>
            </View>
            <View style={styles.seatsCol}>
              <Text style={[styles.seatsLeft, isUrgent && styles.seatsLeftUrgent]}>
                {ride.seatsLeft} {seatSuffix}
              </Text>
              <Text style={styles.seatsNote}>{ride.seatsNote}</Text>
            </View>
          </View>

          <View style={styles.badges}>
            {verified ? (
              <View style={styles.badgeVerified}>
                <Ionicons name="shield-checkmark" size={14} color="#374BB1" />
                <Text style={styles.badgeVerifiedText}>
                  {COMMUTE_RIDE_RESULT_SCREEN.verifiedBadge}
                </Text>
              </View>
            ) : (
              <View style={styles.badgeUnverified}>
                <Ionicons name="car-outline" size={14} color="#626567" />
                <Text style={styles.badgeUnverifiedText}>
                  {COMMUTE_RIDE_RESULT_SCREEN.unverifiedBadge}
                </Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={handleRequest}
            disabled={requestState !== 'idle'}
            style={({ pressed }) => [
              styles.requestButton,
              requestState === 'requesting' && styles.requestButtonBusy,
              requestState === 'requested' && styles.requestButtonDone,
              pressed && requestState === 'idle' && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel={requestLabel}
            accessibilityState={{ disabled: requestState !== 'idle', busy: requestState === 'requesting' }}
          >
            {requestState === 'requesting' ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.requestLabel}>{requestLabel}</Text>
            )}
          </Pressable>
        </View>
      </Pressable>
    );
  },
);

CommuteRideResultCard.displayName = 'CommuteRideResultCard';
