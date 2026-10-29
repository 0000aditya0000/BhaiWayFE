import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/shared/theme';
import { COMMUTE_RIDE_RESULT_SCREEN } from '../../constants/commute-ride-result.constants';
import { styles } from './CommuteSearchSummaryCard.styles';
import type { CommuteSearchSummaryCardProps } from './CommuteSearchSummaryCard.types';
import { AppText as Text } from '@/shared/components';

export const CommuteSearchSummaryCard = React.memo(
  ({
    summary,
    editLabel = COMMUTE_RIDE_RESULT_SCREEN.editLabel,
    onEdit,
  }: CommuteSearchSummaryCardProps) => (
    <View style={styles.card}>
      <View style={styles.accent} />
      <View style={styles.body}>
        <View style={styles.content}>
          <View style={styles.routeRow}>
            <Ionicons name="navigate-circle-outline" size={16} color={colors.primary} />
            <Text style={styles.routeLabel} numberOfLines={1}>
              {summary.origin}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.textMuted} />
            <Text style={styles.routeLabel} numberOfLines={1}>
              {summary.destination}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              <Text style={styles.metaText}>{summary.dateLabel}</Text>
            </View>
            {summary.timeLabel ? (
              <>
                <View style={styles.metaDot} />
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={colors.primary} />
                  <Text style={styles.metaText}>{summary.timeLabel}</Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        <Pressable
          onPress={onEdit}
          style={({ pressed }) => [styles.editButton, pressed && { opacity: 0.88 }]}
          accessibilityRole="button"
          accessibilityLabel={editLabel}
        >
          <Text style={styles.editLabel}>{editLabel}</Text>
          <Ionicons name="create-outline" size={14} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  ),
);

CommuteSearchSummaryCard.displayName = 'CommuteSearchSummaryCard';
