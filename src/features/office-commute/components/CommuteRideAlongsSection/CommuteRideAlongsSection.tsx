import React from 'react';
import { Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { COMMUTE_REVIEW_BOOKING_SCREEN } from '../../constants/commute-review-booking.constants';
import { styles } from './CommuteRideAlongsSection.styles';
import type { CommuteRideAlongsSectionProps } from './CommuteRideAlongsSection.types';
import { AppText as Text } from '@/shared/components';

export const CommuteRideAlongsSection = React.memo(
  ({ passengers }: CommuteRideAlongsSectionProps) => (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{COMMUTE_REVIEW_BOOKING_SCREEN.rideAlongsTitle}</Text>
        <Text style={styles.count}>
          {COMMUTE_REVIEW_BOOKING_SCREEN.rideAlongsCount(passengers.length)}
        </Text>
      </View>

      <View style={styles.list}>
        {passengers.map((passenger) => (
          <View key={passenger.id} style={styles.card}>
            {passenger.avatarUri ? (
              <Image
                source={{ uri: passenger.avatarUri }}
                style={styles.avatar}
                accessibilityIgnoresInvertColors
              />
            ) : (
              <View style={[styles.avatar, { alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="person" size={22} color="#7C839B" />
              </View>
            )}
            <View style={styles.meta}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{passenger.name}</Text>
                {passenger.verified ? (
                  <Ionicons name="checkmark-circle" size={16} color="#191C1D" />
                ) : null}
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#4B61C4" />
                <Text style={styles.ratingText}>
                  {passenger.rating.toFixed(1)} • {passenger.verificationLabel}
                </Text>
              </View>
            </View>
            <View style={styles.seatBadge}>
              <Text style={styles.seatLabel}>{passenger.seatLabel}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  ),
);

CommuteRideAlongsSection.displayName = 'CommuteRideAlongsSection';
