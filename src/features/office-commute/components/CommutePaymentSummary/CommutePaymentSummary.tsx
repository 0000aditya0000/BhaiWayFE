import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/shared/theme';
import {
  COMMUTE_REVIEW_BOOKING_SCREEN,
  formatCommuteAmount,
} from '../../constants/commute-review-booking.constants';
import { styles } from './CommutePaymentSummary.styles';
import type { CommutePaymentSummaryProps } from './CommutePaymentSummary.types';
import { AppText as Text } from '@/shared/components';

export const CommutePaymentSummary = React.memo(
  ({
    fare,
    selectedSeats,
    maxSeats,
    promoDiscount = 0,
    payableTotal,
    onDecrementSeats,
    onIncrementSeats,
  }: CommutePaymentSummaryProps) => {
    const discount = Math.max(0, Math.round(promoDiscount));
    const total = payableTotal != null ? payableTotal : fare.total;

    return (
      <View style={styles.card}>
        <View style={styles.accent} />
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Ionicons name="wallet-outline" size={20} color={colors.primary} />
            <Text style={styles.title}>{COMMUTE_REVIEW_BOOKING_SCREEN.paymentTitle}</Text>
          </View>

          <View style={styles.seatRow}>
            <Text style={styles.seatLabel}>{COMMUTE_REVIEW_BOOKING_SCREEN.seatsLabel}</Text>
            <View style={styles.seatControls}>
              <Pressable
                style={({ pressed }) => [styles.seatButton, pressed && { opacity: 0.85 }]}
                onPress={onDecrementSeats}
                accessibilityRole="button"
                accessibilityLabel="Decrease seats"
              >
                <Text style={styles.seatButtonLabel}>−</Text>
              </Pressable>
              <Text style={styles.seatValue}>{selectedSeats}</Text>
              <Pressable
                style={({ pressed }) => [styles.seatButton, pressed && { opacity: 0.85 }]}
                onPress={onIncrementSeats}
                accessibilityRole="button"
                accessibilityLabel="Increase seats"
              >
                <Text style={styles.seatButtonLabel}>+</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.seatHint}>
            {COMMUTE_REVIEW_BOOKING_SCREEN.seatsAvailableHint(maxSeats)}
          </Text>

          <View style={styles.fareCard}>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>{COMMUTE_REVIEW_BOOKING_SCREEN.perSeatLabel}</Text>
              <Text style={styles.fareValue}>{formatCommuteAmount(fare.riderPricePerSeat)}</Text>
            </View>
            <View style={styles.fareRow}>
              <Text style={styles.fareLabel}>{COMMUTE_REVIEW_BOOKING_SCREEN.seatsLabel}</Text>
              <Text style={styles.fareValue}>{fare.seats}</Text>
            </View>
            {discount > 0 ? (
              <View style={styles.fareRow}>
                <Text style={styles.fareLabel}>Promo discount</Text>
                <Text style={[styles.fareValue, { color: colors.primary }]}>
                  - {formatCommuteAmount(discount)}
                </Text>
              </View>
            ) : null}

            <View style={styles.divider} />

            <View style={styles.fareRow}>
              <Text style={styles.totalLabel}>{COMMUTE_REVIEW_BOOKING_SCREEN.totalLabel}</Text>
              <Text style={styles.totalValue}>{formatCommuteAmount(total)}</Text>
            </View>
          </View>

          <Text style={styles.payNowNote}>{COMMUTE_REVIEW_BOOKING_SCREEN.payNowNote}</Text>
        </View>
      </View>
    );
  },
);

CommutePaymentSummary.displayName = 'CommutePaymentSummary';
