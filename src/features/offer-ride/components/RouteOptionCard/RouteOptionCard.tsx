import React from 'react';
import { Pressable, View } from 'react-native';

import { AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';

import { styles } from './RouteOptionCard.styles';
import type { RouteOptionCardProps } from './RouteOptionCard.types';

export const RouteOptionCard = ({
  title,
  distanceLabel,
  durationLabel,
  selected,
  onPress,
  disabled = false,
}: RouteOptionCardProps) => {
  const meta = [distanceLabel, durationLabel].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${title}${meta ? `, ${meta}` : ''}`}
      accessibilityState={{ selected, disabled }}
      accessibilityHint={selected ? 'Selected driving route' : 'Tap to select this driving route'}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.cardSelected : null,
        pressed && !disabled ? { opacity: 0.92 } : null,
      ]}
      android_ripple={{ color: 'rgba(55, 75, 177, 0.08)' }}
    >
      <View
        style={[styles.radio, selected ? styles.radioSelected : null]}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {meta ? (
          <Text style={styles.meta} accessibilityLabel={meta}>
            {meta}
          </Text>
        ) : null}
      </View>
      {selected ? (
        <Text style={[styles.meta, { color: colors.primary, fontWeight: '600' }]}>Selected</Text>
      ) : null}
    </Pressable>
  );
};
