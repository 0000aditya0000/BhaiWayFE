import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { styles } from './ConfirmedPassengerCard.styles';
import type { ConfirmedPassengerCardProps } from './ConfirmedPassengerCard.types';

export const ConfirmedPassengerCard = ({
  passenger,
  onCall,
  onChat,
  onPressProfile,
}: ConfirmedPassengerCardProps) => (
  <View style={styles.card}>
    <Pressable
      style={styles.profilePress}
      onPress={onPressProfile}
      disabled={!onPressProfile}
      accessibilityRole={onPressProfile ? 'button' : undefined}
      accessibilityLabel={
        onPressProfile ? `View ${passenger.name} profile` : undefined
      }
    >
      <Avatar size={56} uri={passenger.avatarUri} accessibilityLabel={`${passenger.name} photo`} />
      <View style={styles.meta}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{passenger.name}</Text>
          {passenger.verified ? (
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          ) : null}
          <View style={styles.seatsBadge}>
            <Text style={styles.seatsBadgeText}>
              {passenger.seatsBooked === 1
                ? '+1 seat'
                : `+${passenger.seatsBooked} seats`}
            </Text>
          </View>
        </View>
        <Text style={styles.subtitle}>{passenger.subtitle}</Text>
      </View>
    </Pressable>
    <View style={styles.actions}>
      <Pressable
        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
        onPress={onCall}
        accessibilityRole="button"
        accessibilityLabel={`Call ${passenger.name}`}
      >
        <Ionicons name="call" size={20} color={colors.primary} />
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.85 }]}
        onPress={onChat}
        accessibilityRole="button"
        accessibilityLabel={`Chat with ${passenger.name}`}
      >
        <Ionicons name="chatbubble" size={20} color={colors.primary} />
      </Pressable>
    </View>
  </View>
);
