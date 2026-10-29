import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, Button, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { formatDistanceLabel } from '../../utils/route';
import {
  formatRidePrice,
  getSeatUrgency,
  RIDE_RESULT_SCREEN,
} from '../../constants';
import { DriverRecentRidesStatus } from '../DriverRecentRidesStatus';
import { styles } from './RideResultCard.styles';
import type { RideResultCardProps } from './RideResultCard.types';

export const RideResultCard = React.memo(
  ({ ride, onBookPress }: RideResultCardProps) => {
    const urgency = useMemo(() => getSeatUrgency(ride.seatsLeft), [ride.seatsLeft]);
    const isUrgent = urgency === 'last';
    const seatSuffix = ride.seatsLeft === 1 ? 'seat left' : 'seats left';
    const distanceLabel = useMemo(
      () => formatDistanceLabel(ride.distanceKm),
      [ride.distanceKm],
    );
    const isWomenOnly =
      Boolean(ride.womenOnly) ||
      ride.features.some((feature) => feature.id === 'women-only');

    const handleBook = useCallback(() => onBookPress(ride), [onBookPress, ride]);

    return (
      <View
        style={styles.card}
        accessibilityLabel={`Ride with ${ride.driver.name}, ${formatRidePrice(ride.price)}, ${distanceLabel}, ${ride.durationLabel}`}
      >
        <View style={styles.header}>
          <View style={styles.driverRow}>
            <Avatar
              uri={ride.driver.avatarUri}
              size={48}
              accessibilityLabel={`${ride.driver.name} profile photo`}
            />
            <View style={styles.driverMeta}>
              <Text style={styles.driverName} numberOfLines={1}>
                {ride.driver.name}
              </Text>
              <View style={styles.driverSubRow}>
                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={12} color="#4B61C4" />
                  <Text style={styles.ratingText}>{ride.driver.rating.toFixed(1)}</Text>
                  {ride.driver.totalRatings > 0 ? (
                    <Text style={styles.ratingCount}>
                      ({ride.driver.totalRatings})
                    </Text>
                  ) : null}
                </View>
                {isWomenOnly ? (
                  <View style={styles.womenOnlyBadge} accessibilityLabel="Women Only ride">
                    <Ionicons name="woman-outline" size={12} color="#9D174D" />
                    <Text style={styles.womenOnlyBadgeText}>WOMEN ONLY</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          <View style={styles.priceCol}>
            <Text style={styles.price}>{formatRidePrice(ride.price)}</Text>
            {ride.originalPrice ? (
              <Text style={styles.originalPrice}>
                {formatRidePrice(ride.originalPrice)}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Departure</Text>
            <Text style={styles.infoValue}>{ride.departureTime}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Car</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {[ride.vehicle?.color, ride.vehicle?.label || ride.carModel]
                .filter(Boolean)
                .join(' ') || 'Car'}
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Date</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {ride.durationLabel || '—'}
            </Text>
          </View>
        </View>

        <View style={styles.midRow}>
          <DriverRecentRidesStatus
            items={ride.driver.recentRides ?? []}
            variant="compact"
          />
          {distanceLabel && distanceLabel !== '—' ? (
            <View style={styles.statChip}>
              <Ionicons name="navigate-outline" size={13} color={colors.primary} />
              <Text style={styles.statText}>{distanceLabel}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.seatsRow}>
            {isUrgent ? (
              <Ionicons name="warning" size={16} color="#D97706" />
            ) : (
              <Ionicons name="car-outline" size={16} color={colors.textSecondary} />
            )}
            <Text style={[styles.seatsText, isUrgent && styles.seatsTextUrgent]}>
              <Text style={[styles.seatsCount, isUrgent && styles.seatsCountUrgent]}>
                {ride.seatsLeft}
              </Text>
              {` ${seatSuffix}`}
            </Text>
          </View>
          <Button
            label={RIDE_RESULT_SCREEN.bookLabel}
            onPress={handleBook}
            fullWidth={false}
            style={styles.bookButton}
            accessibilityLabel={`View details and book ride with ${ride.driver.name}`}
          />
        </View>
      </View>
    );
  },
);

RideResultCard.displayName = 'RideResultCard';
