import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { DRIVER_TRACK_RIDE_SCREEN } from '../../constants';
import { styles } from './ConfirmedPassengerCard.styles';
import type { ConfirmedPassengerCardProps } from './ConfirmedPassengerCard.types';

export const ConfirmedPassengerCard = ({
  passenger,
  onCall,
  onChat,
  onPressProfile,
}: ConfirmedPassengerCardProps) => {
  const callEnabled = passenger.callAvailable === true;
  const chatEnabled = passenger.chatAvailable === true;

  return (
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
                {DRIVER_TRACK_RIDE_SCREEN.seatsBookedShort(passenger.seatsBooked)}
              </Text>
            </View>
          </View>

          {passenger.bookingStatus ? (
            <Text style={styles.detailLine}>
              {DRIVER_TRACK_RIDE_SCREEN.statusLabel}: {passenger.bookingStatus}
            </Text>
          ) : null}
          {passenger.paymentStatus ? (
            <Text style={styles.detailLine}>
              {DRIVER_TRACK_RIDE_SCREEN.paymentLabel}: {passenger.paymentStatus}
            </Text>
          ) : null}
          {passenger.paymentMethodLabel ? (
            <Text style={styles.detailLine}>
              {DRIVER_TRACK_RIDE_SCREEN.paymentMethodLabel}: {passenger.paymentMethodLabel}
            </Text>
          ) : null}
          {passenger.bookedAtLabel ? (
            <Text style={styles.detailLine}>
              {DRIVER_TRACK_RIDE_SCREEN.bookedAtLabel}: {passenger.bookedAtLabel}
            </Text>
          ) : null}
          {passenger.fareTotal != null && passenger.fareTotal > 0 ? (
            <Text style={styles.detailLine}>
              {DRIVER_TRACK_RIDE_SCREEN.fareLabel}: ₹{passenger.fareTotal}
            </Text>
          ) : null}
          {!passenger.bookingStatus && passenger.subtitle ? (
            <Text style={styles.subtitle}>{passenger.subtitle}</Text>
          ) : null}
        </View>
      </Pressable>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [
            styles.iconBtn,
            !callEnabled && styles.iconBtnDisabled,
            pressed && callEnabled && { opacity: 0.85 },
          ]}
          onPress={onCall}
          accessibilityRole="button"
          accessibilityState={{ disabled: !callEnabled }}
          accessibilityLabel={
            callEnabled
              ? `Call ${passenger.name}`
              : DRIVER_TRACK_RIDE_SCREEN.callUnavailableLabel
          }
        >
          <Ionicons
            name="call"
            size={20}
            color={callEnabled ? colors.primary : colors.textMuted}
          />
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.iconBtn,
            !chatEnabled && styles.iconBtnDisabled,
            pressed && chatEnabled && { opacity: 0.85 },
          ]}
          onPress={onChat}
          accessibilityRole="button"
          accessibilityState={{ disabled: !chatEnabled }}
          accessibilityLabel={
            chatEnabled
              ? `Chat with ${passenger.name}`
              : DRIVER_TRACK_RIDE_SCREEN.chatUnavailableLabel
          }
        >
          <Ionicons
            name="chatbubble"
            size={20}
            color={chatEnabled ? colors.primary : colors.textMuted}
          />
        </Pressable>
      </View>
    </View>
  );
};
