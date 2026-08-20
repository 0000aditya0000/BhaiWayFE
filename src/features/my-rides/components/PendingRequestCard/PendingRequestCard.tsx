import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { DRIVER_TRACK_RIDE_SCREEN } from '../../constants';
import { styles } from './PendingRequestCard.styles';
import type { PendingRequestCardProps } from './PendingRequestCard.types';

export const PendingRequestCard = ({
  request,
  onAccept,
  onDecline,
  onPressProfile,
}: PendingRequestCardProps) => (
  <View style={styles.card}>
    <Pressable
      style={styles.top}
      onPress={onPressProfile}
      disabled={!onPressProfile}
      accessibilityRole={onPressProfile ? 'button' : undefined}
      accessibilityLabel={onPressProfile ? `View ${request.name} profile` : undefined}
    >
      <Avatar
        size={64}
        uri={request.avatarUri}
        accessibilityLabel={`${request.name} photo`}
        style={styles.avatar}
      />
      <View style={styles.meta}>
        <View style={styles.metaTop}>
          <View style={styles.metaText}>
            <Text style={styles.name}>{request.name}</Text>
            <Text style={styles.subtitle}>{request.subtitle}</Text>
          </View>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#FFB800" />
            <Text style={styles.ratingText}>{request.rating.toFixed(1)}</Text>
          </View>
        </View>
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Ionicons name="people-outline" size={14} color={colors.primary} />
            <Text style={styles.badgePrimary}>
              {DRIVER_TRACK_RIDE_SCREEN.seatsAppliedLabel(request.seatsBooked)}
            </Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="car-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.badgeMuted}>
              {DRIVER_TRACK_RIDE_SCREEN.ridesLabel(request.ridesCount)}
            </Text>
          </View>
          {request.idVerified ? (
            <View style={styles.badge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
              <Text style={styles.badgePrimary}>
                {DRIVER_TRACK_RIDE_SCREEN.idVerifiedLabel}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>

    <View style={styles.actions}>
      <Pressable
        style={({ pressed }) => [styles.declineBtn, pressed && { opacity: 0.9 }]}
        onPress={onDecline}
        accessibilityRole="button"
        accessibilityLabel={DRIVER_TRACK_RIDE_SCREEN.declineLabel}
      >
        <Text style={styles.declineLabel}>{DRIVER_TRACK_RIDE_SCREEN.declineLabel}</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [styles.acceptBtn, pressed && { opacity: 0.92 }]}
        onPress={onAccept}
        accessibilityRole="button"
        accessibilityLabel={DRIVER_TRACK_RIDE_SCREEN.acceptLabel}
      >
        <Text style={styles.acceptLabel}>{DRIVER_TRACK_RIDE_SCREEN.acceptLabel}</Text>
      </Pressable>
    </View>
  </View>
);
