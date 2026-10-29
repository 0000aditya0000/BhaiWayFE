import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { colors } from '@/shared/theme';
import { AppText as Text } from '@/shared/components';
import {
  COMMUTE_MATCH_FILTERS,
  COMMUTE_RESULT_SORT_OPTIONS,
  COMMUTE_RIDE_RESULT_SCREEN,
} from '../../constants/commute-ride-result.constants';
import type { CommuteMatchFilterId } from '../../types/commute-ride-result.types';
import { styles } from './CommuteRideResultFilters.styles';
import type { CommuteRideResultFiltersProps } from './CommuteRideResultFilters.types';

const TIER_DOT_COLORS: Record<Exclude<CommuteMatchFilterId, 'all'>, string> = {
  high: colors.success,
  medium: colors.warning,
  low: colors.error,
};

export const CommuteRideResultFilters = React.memo(
  ({
    matchFilterId,
    sortId,
    onMatchFilterChange,
    onSortChange,
  }: CommuteRideResultFiltersProps) => (
    <View style={styles.wrap}>
      <Text style={styles.rowLabel}>{COMMUTE_RIDE_RESULT_SCREEN.filtersTitle}</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        accessibilityRole="tablist"
        accessibilityLabel="Filter rides by route match"
      >
        {COMMUTE_MATCH_FILTERS.map((option) => {
          const selected = option.id === matchFilterId;
          const tierColor =
            option.id !== 'all' ? TIER_DOT_COLORS[option.id] : undefined;
          return (
            <Pressable
              key={option.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onMatchFilterChange(option.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={option.hint ? `${option.label}, ${option.hint}` : option.label}
            >
              {tierColor ? <View style={[styles.tierDot, { backgroundColor: tierColor }]} /> : null}
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        accessibilityRole="tablist"
        accessibilityLabel="Sort commute rides"
      >
        {COMMUTE_RESULT_SORT_OPTIONS.map((option) => {
          const selected = option.id === sortId;
          return (
            <Pressable
              key={option.id}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onSortChange(option.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`Sort by ${option.label}`}
            >
              <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  ),
);

CommuteRideResultFilters.displayName = 'CommuteRideResultFilters';
