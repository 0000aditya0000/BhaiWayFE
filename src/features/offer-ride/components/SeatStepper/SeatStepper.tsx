import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/shared/theme';
import { styles } from './SeatStepper.styles';
import type { SeatStepperProps } from './SeatStepper.types';
import { AppText as Text } from '@/shared/components';

export const SeatStepper = ({ value, min = 1, max = 8, onChange }: SeatStepperProps) => {
  const decrement = useCallback(() => {
    if (value > min) {
      onChange(value - 1);
    }
  }, [min, onChange, value]);

  const increment = useCallback(() => {
    if (value < max) {
      onChange(value + 1);
    }
  }, [max, onChange, value]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Available Seats</Text>
      <Text style={styles.subLabel}>Number of passengers</Text>
      <View style={styles.control}>
        <Pressable
          onPress={decrement}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel="Decrease seats"
          android_ripple={{ color: 'rgba(29, 78, 216, 0.08)' }}
        >
          <Ionicons name="remove" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable
          onPress={increment}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel="Increase seats"
          android_ripple={{ color: 'rgba(29, 78, 216, 0.08)' }}
        >
          <Ionicons name="add" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
};
