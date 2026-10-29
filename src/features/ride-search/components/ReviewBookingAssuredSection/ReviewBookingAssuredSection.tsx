import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/shared/theme';
import { formatBookingAmount, REVIEW_BOOKING_SCREEN } from '../../constants';
import { AssuredDepositPenaltyNotice } from '../AssuredDepositPenaltyNotice';
import { styles } from './ReviewBookingAssuredSection.styles';
import { AppText as Text } from '@/shared/components';

export interface ReviewBookingAssuredSectionProps {
  fee: number;
  /** Backend deposit percentage when deposit is percentage-derived (e.g. 5 or 10). */
  percentage?: number | null;
  /** Elevated deposit after a prior Assured passenger cancellation. */
  showPreviousCancellationNotice?: boolean;
  penaltyPercentage?: number | null;
}

export const ReviewBookingAssuredSection = React.memo(
  ({
    fee,
    percentage,
    showPreviousCancellationNotice = false,
    penaltyPercentage,
  }: ReviewBookingAssuredSectionProps) => (
    <>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.meta}>
          <Text style={styles.title}>
            {showPreviousCancellationNotice
              ? REVIEW_BOOKING_SCREEN.assuredFeeLabel
              : REVIEW_BOOKING_SCREEN.assuredTitle}
          </Text>
          <Text style={styles.subtitle}>{REVIEW_BOOKING_SCREEN.assuredSubtitle}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{formatBookingAmount(fee)}</Text>
          {percentage != null && percentage > 0 ? (
            <Text style={styles.percentage}>{`${Math.round(percentage)}%`}</Text>
          ) : null}
          <Text style={styles.selected}>{REVIEW_BOOKING_SCREEN.assuredSelected}</Text>
        </View>
      </View>
      {showPreviousCancellationNotice && penaltyPercentage != null ? (
        <AssuredDepositPenaltyNotice percentage={penaltyPercentage} variant="review" />
      ) : (
        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.noteText}>{REVIEW_BOOKING_SCREEN.assuredNote}</Text>
        </View>
      )}
    </>
  ),
);

ReviewBookingAssuredSection.displayName = 'ReviewBookingAssuredSection';
