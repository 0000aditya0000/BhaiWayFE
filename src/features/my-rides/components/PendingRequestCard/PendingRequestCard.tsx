import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
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
  acceptLoading = false,
  declineLoading = false,
  disabled = false,
}: PendingRequestCardProps) => {
  const busy = acceptLoading || declineLoading || disabled;

  return (
    <View style={styles.card}>
      <Pressable
        style={styles.top}
        onPress={onPressProfile}
        disabled={!onPressProfile || busy}
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
            {request.rating != null && Number.isFinite(request.rating) ? (
              <View style={styles.ratingBadge}>
                <Ionicons name="star" size={14} color="#FFB800" />
                <Text style={styles.ratingText}>{request.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>

          {request.routeLabel || request.dateTimeLabel ? (
            <View style={styles.detailBlock}>
              {request.routeLabel ? (
                <Text style={styles.detailLine}>{request.routeLabel}</Text>
              ) : null}
              {request.dateTimeLabel ? (
                <Text style={styles.detailMuted}>{request.dateTimeLabel}</Text>
              ) : null}
              {request.pickupLabel ? (
                <Text style={styles.detailMuted}>
                  {DRIVER_TRACK_RIDE_SCREEN.sourceLabel}: {request.pickupLabel}
                </Text>
              ) : null}
              {request.dropoffLabel ? (
                <Text style={styles.detailMuted}>
                  {DRIVER_TRACK_RIDE_SCREEN.destinationLabel}: {request.dropoffLabel}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.badges}>
            <View style={styles.badge}>
              <Ionicons name="people-outline" size={14} color={colors.primary} />
              <Text style={styles.badgePrimary}>
                {DRIVER_TRACK_RIDE_SCREEN.seatsAppliedLabel(request.seatsBooked)}
              </Text>
            </View>
            {request.fareLabel ? (
              <View style={styles.badge}>
                <Ionicons name="cash-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.badgeMuted}>{request.fareLabel}</Text>
              </View>
            ) : null}
            {request.ridesCount != null && request.ridesCount > 0 ? (
              <View style={styles.badge}>
                <Ionicons name="car-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.badgeMuted}>
                  {DRIVER_TRACK_RIDE_SCREEN.ridesLabel(request.ridesCount)}
                </Text>
              </View>
            ) : null}
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
          style={({ pressed }) => [
            styles.declineBtn,
            busy && styles.actionDisabled,
            pressed && !busy && { opacity: 0.9 },
          ]}
          onPress={onDecline}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={DRIVER_TRACK_RIDE_SCREEN.declineLabel}
          accessibilityState={{ disabled: busy }}
        >
          {declineLoading ? (
            <ActivityIndicator color={colors.textSecondary} />
          ) : (
            <Text style={styles.declineLabel}>{DRIVER_TRACK_RIDE_SCREEN.declineLabel}</Text>
          )}
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.acceptBtn,
            busy && styles.actionDisabled,
            pressed && !busy && { opacity: 0.92 },
          ]}
          onPress={onAccept}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel={DRIVER_TRACK_RIDE_SCREEN.acceptLabel}
          accessibilityState={{ disabled: busy }}
        >
          {acceptLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.acceptLabel}>{DRIVER_TRACK_RIDE_SCREEN.acceptLabel}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};
