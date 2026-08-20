import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/shared/theme';
import { RIDE_DETAILS_SCREEN } from '../../constants';
import type { CoPassenger } from '../../types';
import { styles } from './RideDetailsCoPassengers.styles';
import { AppText as Text } from '@/shared/components';

export interface RideDetailsCoPassengersProps {
  passengers: CoPassenger[];
  maxPassengers: number;
  seatsLeft: number;
  onChat: (name: string) => void;
}

const initialsFor = (name: string): string => {
  const parts = name.replace(/\./g, '').trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
};

const AVATAR_TONES = [
  { backgroundColor: '#DADFF7', color: '#5C6276' },
  { backgroundColor: '#4B61C4', color: '#EAEBFF' },
] as const;

export const RideDetailsCoPassengers = React.memo(
  ({ passengers, maxPassengers, seatsLeft, onChat }: RideDetailsCoPassengersProps) => {
    const seatsLabel = useMemo(() => {
      const unit =
        seatsLeft === 1
          ? RIDE_DETAILS_SCREEN.seatsLeftLabel
          : RIDE_DETAILS_SCREEN.seatsLeftPluralLabel;
      return `${seatsLeft} ${unit}`;
    }, [seatsLeft]);

    return (
      <View style={styles.section}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {RIDE_DETAILS_SCREEN.coPassengersLabel} ({passengers.length}/{maxPassengers})
          </Text>
          <Text style={styles.seatsLeft}>{seatsLabel}</Text>
        </View>

        <View style={styles.list}>
          {passengers.map((passenger, index) => {
            const tone = AVATAR_TONES[index % AVATAR_TONES.length];
            return (
              <View key={passenger.id} style={styles.card}>
                <View style={styles.left}>
                  <View style={[styles.avatar, { backgroundColor: tone.backgroundColor }]}>
                    <Text style={[styles.avatarText, { color: tone.color }]}>
                      {initialsFor(passenger.name)}
                    </Text>
                  </View>
                  <View style={styles.meta}>
                    <Text style={styles.name}>{passenger.name}</Text>
                    <View style={styles.verifiedRow}>
                      <Text style={styles.verifiedText}>
                        {RIDE_DETAILS_SCREEN.verifiedAtPrefix} {passenger.company}
                      </Text>
                      {passenger.verified ? (
                        <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
                      ) : null}
                    </View>
                  </View>
                </View>
                <Pressable
                  style={({ pressed }) => [styles.chatBtn, pressed && { transform: [{ scale: 0.95 }] }]}
                  onPress={() => onChat(passenger.name)}
                  accessibilityRole="button"
                  accessibilityLabel={`Chat with ${passenger.name}`}
                >
                  <Ionicons name="chatbubble" size={18} color="#434655" />
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
    );
  },
);

RideDetailsCoPassengers.displayName = 'RideDetailsCoPassengers';
