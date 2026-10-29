import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/shared/theme';
import { AppText as Text } from '../AppText';
import { styles } from './IconButton.styles';
import type { IconButtonProps } from './IconButton.types';

const formatBadgeCount = (count: number): string => {
  if (count > 99) {
    return '99+';
  }
  return String(Math.max(0, Math.floor(count)));
};

export const IconButton = React.memo(
  ({
    icon,
    onPress,
    size = 24,
    color = colors.primary,
    accessibilityLabel,
    style,
    showBadge = false,
    badgeCount = null,
  }: IconButtonProps) => {
    const numericCount =
      typeof badgeCount === 'number' && Number.isFinite(badgeCount)
        ? Math.max(0, Math.floor(badgeCount))
        : 0;
    const countLabel = useMemo(
      () => (numericCount > 0 ? formatBadgeCount(numericCount) : null),
      [numericCount],
    );

    return (
      <Pressable
        onPress={onPress}
        style={[styles.button, style]}
        accessibilityRole="button"
        accessibilityLabel={
          countLabel
            ? `${accessibilityLabel}, ${numericCount} unread`
            : accessibilityLabel
        }
        hitSlop={8}
        android_ripple={{ color: 'rgba(29, 78, 216, 0.08)', borderless: true }}
      >
        <Ionicons name={icon} size={size} color={color} />
        {countLabel ? (
          <View
            style={[styles.countBadge, numericCount > 9 && styles.countBadgeWide]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            <Text style={styles.countBadgeLabel}>{countLabel}</Text>
          </View>
        ) : showBadge ? (
          <View style={styles.badge} />
        ) : null}
      </Pressable>
    );
  },
);

IconButton.displayName = 'IconButton';
