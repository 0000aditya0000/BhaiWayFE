import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/shared/components';
import { MY_RIDES_SCREEN } from '../../constants';
import type { HistoryRideItem } from '../../types';
import { styles } from './PastRideCard.styles';

export interface PastRideCardProps {
  ride: HistoryRideItem;
  onOpenDetails: () => void;
}

export const PastRideCard = React.memo(({ ride, onOpenDetails }: PastRideCardProps) => {
  const isCancelled = ride.statusLabel === 'Cancelled';
  const metaParts = [
    ride.timeLabel,
    ride.passengerCount != null ? `${ride.passengerCount} passenger${ride.passengerCount === 1 ? '' : 's'}` : null,
    ride.vehicleLabel,
    ride.earningsLabel ? ride.earningsLabel : null,
  ].filter(Boolean);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Text style={styles.dateLabel}>{ride.dateLabel}</Text>
          <Text style={styles.routeLabel}>{ride.routeLabel}</Text>
        </View>
        <View style={[styles.statusBadge, isCancelled && styles.statusBadgeCancelled]}>
          <Text style={[styles.statusText, isCancelled && styles.statusTextCancelled]}>
            {ride.statusLabel}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View
          style={[
            styles.typeBadge,
            ride.commute
              ? styles.regularBadge
              : ride.assured
                ? styles.assuredBadge
                : styles.regularBadge,
          ]}
        >
          <Ionicons
            name={
              ride.commute
                ? 'briefcase-outline'
                : ride.assured
                  ? 'checkmark-circle'
                  : 'car-outline'
            }
            size={12}
            color={ride.assured && !ride.commute ? '#374BB1' : '#434655'}
          />
          <Text
            style={[
              styles.typeText,
              ride.assured && !ride.commute ? styles.assuredText : styles.regularText,
            ]}
          >
            {ride.commute
              ? ride.direction === 'RETURN'
                ? `${MY_RIDES_SCREEN.commuteLabel} · Return`
                : ride.direction === 'OUTBOUND'
                  ? `${MY_RIDES_SCREEN.commuteLabel} · Outbound`
                  : MY_RIDES_SCREEN.commuteLabel
              : ride.assured
                ? MY_RIDES_SCREEN.assuredLabel
                : MY_RIDES_SCREEN.regularLabel}
          </Text>
        </View>
        {ride.cancelledAtLabel ? (
          <Text style={styles.cancelledAt}>Cancelled {ride.cancelledAtLabel}</Text>
        ) : null}
      </View>

      {metaParts.length > 0 ? (
        <Text style={styles.metaLine} numberOfLines={2}>
          {metaParts.join(' · ')}
        </Text>
      ) : null}

      <View style={styles.routeDetailRow}>
        <View style={styles.routeStop}>
          <Text style={styles.stopCaption}>{MY_RIDES_SCREEN.pickupLabel}</Text>
          <Text style={styles.stopValue} numberOfLines={1}>
            {ride.pickupLabel}
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={16} color="#747686" />
        <View style={styles.routeStop}>
          <Text style={styles.stopCaption}>{MY_RIDES_SCREEN.dropoffLabel}</Text>
          <Text style={styles.stopValue} numberOfLines={1}>
            {ride.dropoffLabel}
          </Text>
        </View>
      </View>

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
    </View>
  );
});

PastRideCard.displayName = 'PastRideCard';
