import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { RIDE_DETAILS_SCREEN } from '../../constants';
import type { RideDetailsDriver } from '../../types';
import { styles } from './RideDetailsDriverCard.styles';

export interface RideDetailsDriverCardProps {
  driver: RideDetailsDriver;
}

export const RideDetailsDriverCard = React.memo(({ driver }: RideDetailsDriverCardProps) => {
  const vehiclePrimary = useMemo(() => {
    const parts = [driver.vehicleColor, driver.vehicleModel].map((part) => part?.trim()).filter(Boolean);
    return parts.join(' ') || 'Car';
  }, [driver.vehicleColor, driver.vehicleModel]);

  const vehicleSecondary = useMemo(() => {
    const parts: string[] = [];
    if (driver.vehicleType?.trim()) {
      parts.push(driver.vehicleType.trim());
    }
    if (driver.seatingCapacity > 0) {
      parts.push(RIDE_DETAILS_SCREEN.seatsCapacityLabel(driver.seatingCapacity));
    }
    if (driver.plateNumber?.trim()) {
      parts.push(driver.plateNumber.trim());
    }
    return parts.join(' · ');
  }, [driver.plateNumber, driver.seatingCapacity, driver.vehicleType]);

  const ratingsLabel =
    driver.totalRatings > 0
      ? RIDE_DETAILS_SCREEN.ratingsCountLabel(driver.totalRatings)
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.photo}>
        <Avatar size={64} uri={driver.avatarUri} accessibilityLabel={`${driver.name} photo`} />
      </View>
      <View style={styles.body}>
        <View style={styles.topRow}>
          <View style={styles.meta}>
            <Text style={styles.name}>{driver.name}</Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.rating}>{driver.rating.toFixed(1)}</Text>
              {ratingsLabel ? (
                <>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.ratingsCount}>{ratingsLabel}</Text>
                </>
              ) : null}
              {driver.company?.trim() ? (
                <>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.company}>{driver.company}</Text>
                </>
              ) : null}
            </View>
          </View>
          {driver.verified ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          ) : null}
        </View>
        <View style={styles.vehicleRow}>
          <Ionicons name="car-outline" size={18} color="#434655" />
          <Text style={styles.vehicleText}>
            {vehiclePrimary}
            {vehicleSecondary ? (
              <>
                <Text style={styles.vehicleDivider}> | </Text>
                {vehicleSecondary}
              </>
            ) : null}
          </Text>
        </View>
      </View>
    </View>
  );
});

RideDetailsDriverCard.displayName = 'RideDetailsDriverCard';
