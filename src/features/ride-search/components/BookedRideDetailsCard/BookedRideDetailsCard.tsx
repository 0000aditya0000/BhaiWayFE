import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/shared/components';
import { formatBhaiWayCoins } from '@/shared/utils';
import { BOOKED_SCREEN } from '../../constants';
import type { BookedRideDetails } from '../../types';
import {
  formatPassengerPaymentStatusLabel,
  formatRegularRidePaymentMethodLabel,
} from '../../utils/regularRidePayment.utils';
import { styles } from './BookedRideDetailsCard.styles';

export interface BookedRideDetailsCardProps {
  details: BookedRideDetails;
}

const paymentMethodLabel = (value?: string): string => {
  if (!value) {
    return BOOKED_SCREEN.payAfterRideLabel;
  }
  return formatRegularRidePaymentMethodLabel(value) || BOOKED_SCREEN.payAfterRideLabel;
};

const paymentStatusLabel = (details: BookedRideDetails): string =>
  formatPassengerPaymentStatusLabel({
    paymentMethod: details.paymentMethod,
    paymentStatus: details.paymentStatus,
    bookingStatus: details.bookingStatus,
  }) || BOOKED_SCREEN.unpaidLabel;

const depositStatusLabel = (value?: string): string => {
  const normalized = String(value ?? '').toUpperCase();
  if (normalized === 'HELD') {
    return BOOKED_SCREEN.heldLabel;
  }
  if (normalized === 'NONE' || !normalized) {
    return '—';
  }
  return normalized.replace(/_/g, ' ');
};

const fareStatusLabel = (details: BookedRideDetails): string => {
  const status = String(details.farePaymentStatus ?? details.paymentStatus ?? '').toUpperCase();
  const timing = String(details.farePayment ?? '').toUpperCase();
  if (status === 'PAID') {
    return BOOKED_SCREEN.paidLabel;
  }
  if (timing === 'PAY_LATER' || status === 'UNPAID') {
    return BOOKED_SCREEN.payAfterRideLabel;
  }
  return paymentStatusLabel(status);
};

export const BookedRideDetailsCard = React.memo(({ details }: BookedRideDetailsCardProps) => {
  const vehicleLine = details.plateNumber
    ? `${details.vehicle} (${details.plateNumber})`
    : details.vehicle;
  const isAssured = details.rideType === 'assured';
  const fareDisplay =
    details.fareAmount != null
      ? details.fareAmount
      : details.fareTotal != null
        ? details.fareTotal
        : null;

  return (
    <View style={styles.card}>
      <View style={styles.decorCircle} pointerEvents="none" />

      <Text style={styles.sectionLabel}>{BOOKED_SCREEN.rideDetailsLabel}</Text>

      <View style={styles.routeRow}>
        <View style={styles.indicator}>
          <View style={styles.pickupDot} />
          <View style={styles.routeLine} />
          <View style={styles.dropDot} />
        </View>
        <View style={styles.routeText}>
          <View style={styles.locationBlock}>
            <Text style={styles.locationLabel}>{BOOKED_SCREEN.pickupLabel}</Text>
            <Text style={styles.locationValue}>{details.pickup}</Text>
          </View>
          <View style={styles.locationBlock}>
            <Text style={styles.locationLabel}>{BOOKED_SCREEN.dropLabel}</Text>
            <Text style={styles.locationValue}>{details.dropoff}</Text>
          </View>
        </View>
      </View>

      <View style={styles.metaBlock}>
        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="car-outline" size={22} color="#45464D" />
          </View>
          <View style={styles.infoMeta}>
            <Text style={styles.infoLabel}>{BOOKED_SCREEN.vehicleLabel}</Text>
            <Text style={styles.infoValue}>{vehicleLine}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIcon}>
            <Ionicons name="calendar-outline" size={22} color="#45464D" />
          </View>
          <View style={styles.infoMeta}>
            <Text style={styles.infoLabel}>{BOOKED_SCREEN.dateTimeLabel}</Text>
            <Text style={styles.infoValue}>{details.dateTimeLabel}</Text>
          </View>
        </View>

        {details.seats != null ? (
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="people-outline" size={22} color="#45464D" />
            </View>
            <View style={styles.infoMeta}>
              <Text style={styles.infoLabel}>{BOOKED_SCREEN.seatsLabel}</Text>
              <Text style={styles.infoValue}>{details.seats}</Text>
            </View>
          </View>
        ) : null}

        {isAssured && details.securityDepositAmount != null ? (
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#45464D" />
            </View>
            <View style={styles.infoMeta}>
              <Text style={styles.infoLabel}>{BOOKED_SCREEN.securityDepositLabel}</Text>
              <Text style={styles.infoValue}>
                {formatBhaiWayCoins(details.securityDepositAmount, { spaced: false })}
                {' · '}
                {depositStatusLabel(details.securityDepositStatus)}
              </Text>
            </View>
          </View>
        ) : null}

        {fareDisplay != null ? (
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="pricetag-outline" size={22} color="#45464D" />
            </View>
            <View style={styles.infoMeta}>
              <Text style={styles.infoLabel}>{BOOKED_SCREEN.fareLabel}</Text>
              <Text style={styles.infoValue}>
                {formatBhaiWayCoins(fareDisplay, { spaced: false })}
                {isAssured ? ` · ${fareStatusLabel(details)}` : ''}
              </Text>
            </View>
          </View>
        ) : null}

        {isAssured ? (
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="wallet-outline" size={22} color="#45464D" />
            </View>
            <View style={styles.infoMeta}>
              <Text style={styles.infoLabel}>{BOOKED_SCREEN.farePaymentLabel}</Text>
              <Text style={styles.infoValue}>{fareStatusLabel(details)}</Text>
            </View>
          </View>
        ) : null}

        {details.rideType === 'regular' ? (
          <>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="repeat-outline" size={22} color="#45464D" />
              </View>
              <View style={styles.infoMeta}>
                <Text style={styles.infoLabel}>{BOOKED_SCREEN.paymentMethodLabel}</Text>
                <Text style={styles.infoValue}>
                  {paymentMethodLabel(details.paymentMethod)}
                </Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="wallet-outline" size={22} color="#45464D" />
              </View>
              <View style={styles.infoMeta}>
                <Text style={styles.infoLabel}>{BOOKED_SCREEN.paymentStatusLabel}</Text>
                <Text style={styles.infoValue}>
                  {paymentStatusLabel(details)}
                </Text>
              </View>
            </View>
          </>
        ) : null}
      </View>
    </View>
  );
});

BookedRideDetailsCard.displayName = 'BookedRideDetailsCard';
