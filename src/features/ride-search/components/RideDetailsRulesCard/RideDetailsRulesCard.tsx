import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/shared/theme';
import { RIDE_DETAILS_SCREEN } from '../../constants';
import type { RideRule } from '../../types';
import { styles } from './RideDetailsRulesCard.styles';
import { AppText as Text } from '@/shared/components';

export interface RideDetailsRulesCardProps {
  rules: readonly RideRule[];
}

const iconName = (icon: RideRule['icon']): keyof typeof Ionicons.glyphMap => {
  switch (icon) {
    case 'ban':
      return 'ban-outline';
    case 'snow':
      return 'snow-outline';
    case 'time':
      return 'time-outline';
    case 'bag':
      return 'briefcase-outline';
    case 'people':
      return 'people-outline';
    case 'musical-notes':
      return 'musical-notes-outline';
    case 'paw':
      return 'paw-outline';
    case 'checkmark-circle':
      return 'checkmark-circle-outline';
    default:
      return 'information-circle-outline';
  }
};

export const RideDetailsRulesCard = React.memo(({ rules }: RideDetailsRulesCardProps) => (
  <View style={styles.card} accessibilityRole="summary">
    <Text style={styles.title}>{RIDE_DETAILS_SCREEN.rulesTitle}</Text>
    <Text style={styles.subtitle}>{RIDE_DETAILS_SCREEN.rulesSubtitle}</Text>
    {rules.length === 0 ? (
      <Text style={styles.emptyLabel}>{RIDE_DETAILS_SCREEN.rulesEmptyLabel}</Text>
    ) : (
      <View style={styles.list}>
        {rules.map((rule) => (
          <View key={rule.id} style={styles.row}>
            <View style={styles.iconWrap}>
              <Ionicons name={iconName(rule.icon)} size={18} color={colors.primary} />
            </View>
            <Text style={styles.label}>{rule.label}</Text>
          </View>
        ))}
      </View>
    )}
  </View>
));

RideDetailsRulesCard.displayName = 'RideDetailsRulesCard';
