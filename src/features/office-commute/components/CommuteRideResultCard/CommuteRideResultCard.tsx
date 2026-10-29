import React, { useCallback, useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { formatRidePrice } from '@/features/ride-search/constants';
import { colors } from '@/shared/theme';
import { COMMUTE_RIDE_RESULT_SCREEN } from '../../constants/commute-ride-result.constants';
import { getRouteMatchVisual } from '../../utils/routeMatchVisual';
import { styles } from './CommuteRideResultCard.styles';
import type { CommuteRideResultCardProps } from './CommuteRideResultCard.types';
import { AppText as Text } from '@/shared/components';

export const CommuteRideResultCard = React.memo(
  ({ ride, requestState = 'idle', onPress, onRequestPress }: CommuteRideResultCardProps) => {
    const verified = ride.driver.verified;
    const showRating = ride.driverRating != null && ride.driverRating > 0;

    const seatsAvailableLabel = useMemo(
      () => COMMUTE_RIDE_RESULT_SCREEN.seatsAvailable(ride.seatsLeft),
      [ride.seatsLeft],
    );

    const handlePress = useCallback(() => onPress(ride), [onPress, ride]);
    const handleRequest = useCallback(() => onRequestPress(ride), [onRequestPress, ride]);

    const requestLabel =
      requestState === 'requesting'
        ? COMMUTE_RIDE_RESULT_SCREEN.requestingLabel
        : requestState === 'requested'
          ? COMMUTE_RIDE_RESULT_SCREEN.requestedLabel
          : COMMUTE_RIDE_RESULT_SCREEN.bookLabel;

    const matchVisual =
      ride.matchPercent != null ? getRouteMatchVisual(ride.matchPercent) : null;

    return (
      <Pressable
        style={[styles.card, verified && styles.cardVerified]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Ride with ${ride.driver.name}, ${formatRidePrice(ride.price)}`}
        android_ripple={{ color: 'rgba(55, 75, 177, 0.08)' }}
      >
        <View style={styles.body}>
          <View style={styles.header}>
            <View style={styles.driverRow}>
              {ride.driver.avatarUri ? (
                <Image
                  source={{ uri: ride.driver.avatarUri }}
                  style={styles.avatar}
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={22} color={colors.textMuted} />
                </View>
              )}

              <View style={styles.driverMeta}>
                <View style={styles.nameRow}>
                  <Text style={styles.driverName} numberOfLines={1}>
                    {ride.driver.name}
                  </Text>
                  {showRating ? (
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color={colors.secondary} />
                      <Text style={styles.ratingText}>{ride.driverRating!.toFixed(1)}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.vehicle} numberOfLines={1}>
                  {ride.carModel} • {ride.vehicleColor}
                </Text>

                {verified ? (
                  <View style={styles.badgeVerified}>
                    <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
                    <Text style={styles.badgeVerifiedText}>
                      {COMMUTE_RIDE_RESULT_SCREEN.verifiedBadge}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.badgeUnverified}>
                    <Ionicons name="car-outline" size={14} color={colors.textMuted} />
                    <Text style={styles.badgeUnverifiedText}>
                      {COMMUTE_RIDE_RESULT_SCREEN.unverifiedBadge}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.priceCol}>
              <Text style={styles.price}>{formatRidePrice(ride.price)}</Text>
              <Text style={styles.priceCaption}>{COMMUTE_RIDE_RESULT_SCREEN.priceCaption}</Text>
            </View>
          </View>

          <View style={styles.detailsPanel}>
            {matchVisual ? (
              <View
                style={[
                  styles.matchBanner,
                  {
                    backgroundColor: matchVisual.backgroundColor,
                  },
                ]}
              >
                <Ionicons name="navigate" size={16} color={matchVisual.iconColor} />
                <Text style={[styles.matchBannerText, { color: matchVisual.textColor }]}>
                  {COMMUTE_RIDE_RESULT_SCREEN.routeMatchLabel(ride.matchPercent!)}
                </Text>
              </View>
            ) : null}

            <View style={styles.detailsRow}>
            <View style={styles.departureCol}>
              <Text style={styles.departureTime}>{ride.departureTime}</Text>
              <Text style={styles.departureLabel}>
                {COMMUTE_RIDE_RESULT_SCREEN.departureLabel}
              </Text>
            </View>

            <View style={styles.columnDivider} />

            <View style={styles.routeCol}>
              <View style={styles.routeGraphic}>
                <View style={styles.routeDotPickup} />
                <View style={styles.routeLine} />
                <View style={styles.routeDotDropoff} />
              </View>
              <View style={styles.routeLabels}>
                <Text style={styles.routeLabel} numberOfLines={2}>
                  {ride.pickupLabel}
                </Text>
                <Text style={styles.routeLabel} numberOfLines={2}>
                  {ride.dropoffLabel}
                </Text>
              </View>
            </View>

            <View style={styles.columnDivider} />

            <View style={styles.seatsCol}>
              <Ionicons name="people-outline" size={18} color={colors.primary} />
              <Text style={styles.seatsNote} numberOfLines={2}>
                {ride.seatsNote}
              </Text>
              <Text style={styles.seatsAvailable}>{seatsAvailableLabel}</Text>
            </View>
            </View>
          </View>

          <Pressable
            onPress={handleRequest}
            disabled={requestState !== 'idle'}
            style={({ pressed }) => [
              styles.requestButton,
              requestState === 'requesting' && styles.requestButtonBusy,
              requestState === 'requested' && styles.requestButtonDone,
              pressed && requestState === 'idle' && { opacity: 0.92, transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel={requestLabel}
            accessibilityState={{ disabled: requestState !== 'idle', busy: requestState === 'requesting' }}
          >
            {requestState === 'requesting' ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.requestLabel}>{requestLabel}</Text>
            )}
          </Pressable>
        </View>
      </Pressable>
    );
  },
);

CommuteRideResultCard.displayName = 'CommuteRideResultCard';
