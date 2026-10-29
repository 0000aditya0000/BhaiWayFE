import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/shared/components';
import {
  DRIVER_RECENT_RIDES_UI,
  DRIVER_RECENT_RIDE_STATUS_META,
  type DriverRecentRideStatusItem,
} from '../../constants/driver-recent-rides.constants';
import { styles } from './DriverRecentRidesStatus.styles';

export interface DriverRecentRidesStatusProps {
  /** Real rides from GET /rides/search or GET /rides/public/:id. */
  items: readonly DriverRecentRideStatusItem[];
  /** Compact strip for search cards; detailed list for ride details. */
  variant?: 'compact' | 'detailed';
}

export const DriverRecentRidesStatus = React.memo(
  ({ items, variant = 'compact' }: DriverRecentRidesStatusProps) => {
    const rides = useMemo(() => (items ?? []).slice(0, 5), [items]);

    if (rides.length === 0) {
      if (variant === 'detailed') {
        return (
          <View style={styles.detailsCard} accessibilityRole="summary">
            <Text style={styles.detailsTitle}>{DRIVER_RECENT_RIDES_UI.detailsTitle}</Text>
            <Text style={styles.detailsSubtitle}>{DRIVER_RECENT_RIDES_UI.detailsSubtitle}</Text>
            <Text style={styles.emptyLabel}>{DRIVER_RECENT_RIDES_UI.emptyLabel}</Text>
          </View>
        );
      }
      return null;
    }

    if (variant === 'detailed') {
      return (
        <View style={styles.detailsCard} accessibilityRole="summary">
          <Text style={styles.detailsTitle}>{DRIVER_RECENT_RIDES_UI.detailsTitle}</Text>
          <Text style={styles.detailsSubtitle}>{DRIVER_RECENT_RIDES_UI.detailsSubtitle}</Text>
          <View style={styles.detailsList}>
            {rides.map((ride) => {
              const meta = DRIVER_RECENT_RIDE_STATUS_META[ride.status];
              return (
                <View key={ride.id} style={styles.detailsRow}>
                  <View style={[styles.detailsIcon, { backgroundColor: meta.background }]}>
                    <Ionicons
                      name={meta.icon as keyof typeof Ionicons.glyphMap}
                      size={16}
                      color={meta.color}
                    />
                  </View>
                  <View style={styles.detailsCopy}>
                    <Text style={styles.detailsRoute} numberOfLines={1}>
                      {ride.routeLabel}
                    </Text>
                    <Text style={styles.detailsDate}>{ride.dateLabel}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: meta.background }]}>
                    <Text style={[styles.statusPillText, { color: meta.color }]}>
                      {ride.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.compactWrap} accessibilityLabel={DRIVER_RECENT_RIDES_UI.cardTitle}>
        <Text style={styles.compactTitle}>{DRIVER_RECENT_RIDES_UI.cardTitle}</Text>
        <View style={styles.compactRow}>
          {rides.map((ride) => {
            const meta = DRIVER_RECENT_RIDE_STATUS_META[ride.status];
            return (
              <View
                key={ride.id}
                style={[styles.compactDot, { backgroundColor: meta.color }]}
                accessibilityLabel={`${ride.label}, ${ride.dateLabel}`}
              />
            );
          })}
        </View>
      </View>
    );
  },
);

DriverRecentRidesStatus.displayName = 'DriverRecentRidesStatus';
