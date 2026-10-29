import React from 'react';
import { View } from 'react-native';

import { formatBookingAmount, REVIEW_BOOKING_SCREEN } from '../../constants';
import type { BookingFareBreakdown } from '../../types';
import { styles } from './ReviewBookingFareCard.styles';
import { AppText as Text } from '@/shared/components';

export interface ReviewBookingFareCardProps {
  fare: BookingFareBreakdown;
  showAssuredFee: boolean;
  /** Regular rides hide the platform-fee row entirely. */
  showPlatformFee?: boolean;
}

export const ReviewBookingFareCard = React.memo(
  ({ fare, showAssuredFee, showPlatformFee = true }: ReviewBookingFareCardProps) => (
    <View style={styles.card}>
      <Text style={styles.title}>{REVIEW_BOOKING_SCREEN.fareTitle}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>{REVIEW_BOOKING_SCREEN.rideFareLabel}</Text>
        <Text style={styles.value}>{formatBookingAmount(fare.rideFare)}</Text>
      </View>
      {showPlatformFee ? (
        <View style={styles.row}>
          <Text style={styles.label}>{REVIEW_BOOKING_SCREEN.platformFeeLabel}</Text>
          <Text style={styles.value}>{formatBookingAmount(fare.platformFee)}</Text>
        </View>
      ) : null}
      {fare.promoDiscount > 0 ? (
        <View style={styles.row}>
          <Text style={styles.label}>{REVIEW_BOOKING_SCREEN.promoDiscountLabel}</Text>
          <Text style={[styles.value, styles.discount]}>
            - {formatBookingAmount(fare.promoDiscount)}
          </Text>
        </View>
      ) : null}
      {showAssuredFee && fare.assuredFee > 0 ? (
        <View style={styles.row}>
          <Text style={styles.label}>{REVIEW_BOOKING_SCREEN.assuredFeeLabel}</Text>
          <Text style={styles.value}>{formatBookingAmount(fare.assuredFee)}</Text>
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.row}>
        <Text style={styles.totalLabel}>{REVIEW_BOOKING_SCREEN.totalLabel}</Text>
        <Text style={styles.totalValue}>{formatBookingAmount(fare.total)}</Text>
      </View>
    </View>
  ),
);

ReviewBookingFareCard.displayName = 'ReviewBookingFareCard';
