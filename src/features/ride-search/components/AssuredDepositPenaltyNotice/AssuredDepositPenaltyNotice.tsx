import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { PAYMENT_SCREEN, REVIEW_BOOKING_SCREEN } from '../../constants';
import { styles } from './AssuredDepositPenaltyNotice.styles';

export interface AssuredDepositPenaltyNoticeProps {
  percentage: number;
  /** Defaults to review-booking copy; payment screen can override via context. */
  variant?: 'review' | 'payment';
}

export const AssuredDepositPenaltyNotice = React.memo(
  ({ percentage, variant = 'review' }: AssuredDepositPenaltyNoticeProps) => {
    const copy =
      variant === 'payment'
        ? PAYMENT_SCREEN
        : REVIEW_BOOKING_SCREEN;

    return (
      <View style={styles.wrap}>
        <Ionicons name="warning-outline" size={18} color="#B45309" />
        <View style={styles.copy}>
          <Text style={styles.message}>
            {copy.assuredPenaltyPreviousCancellationMessage(Math.round(percentage))}
          </Text>
          <Text style={styles.scope}>{copy.assuredPenaltyNextBookingOnly}</Text>
        </View>
      </View>
    );
  },
);

AssuredDepositPenaltyNotice.displayName = 'AssuredDepositPenaltyNotice';
