import React, { useCallback, useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, Button, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { formatDistanceLabel } from '../../utils/route';
import {
  formatRidePrice,
  getSeatUrgency,
  RIDE_RESULT_SCREEN,
} from '../../constants';
import { styles } from './RideResultCard.styles';
import type { RideResultCardProps } from './RideResultCard.types';

export const RideResultCard = React.memo(
  ({ ride, onPress, onBookPress }: RideResultCardProps) => {
    const urgency = useMemo(() => getSeatUrgency(ride.seatsLeft), [ride.seatsLeft]);
    const isUrgent = urgency === 'last';
    const seatSuffix = ride.seatsLeft === 1 ? 'seat left' : 'seats left';
    const distanceLabel = useMemo(
      () => formatDistanceLabel(ride.distanceKm),
      [ride.distanceKm],
    );

    const handlePress = useCallback(() => onPress(ride), [onPress, ride]);
    const handleBook = useCallback(() => onBookPress(ride), [onBookPress, ride]);

    return (
      <Pressable
        style={styles.card}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Ride with ${ride.driver.name}, ${formatRidePrice(ride.price)}, ${distanceLabel}, ${ride.durationLabel}`}
        android_ripple={{ color: 'rgba(29, 78, 216, 0.08)' }}
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
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#4B61C4" />
                <Text style={styles.ratingText}>{ride.driver.rating.toFixed(1)}</Text>
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
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Car Model</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {ride.carModel}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Ionicons name="navigate-outline" size={14} color={colors.primary} />
            <Text style={styles.statText}>{distanceLabel}</Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text style={styles.statText}>{ride.durationLabel}</Text>
          </View>
        </View>

        <View style={styles.footerDivider} />

        <View style={styles.footer}>
          <View style={styles.seatsRow}>
            {isUrgent ? (
              <Ionicons name="warning" size={18} color="#D97706" />
            ) : (
              <Ionicons name="car-outline" size={18} color={colors.textSecondary} />
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
            accessibilityLabel={`Book ride with ${ride.driver.name}`}
          />
        </View>
      </Pressable>
    );
  },
);

RideResultCard.displayName = 'RideResultCard';
