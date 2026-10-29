import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { styles } from './RatingStars.styles';

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

export interface RatingStarsProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
}

export const RatingStars = ({
  value,
  onChange,
  size = 32,
  activeColor = '#374BB1',
  inactiveColor = '#C4C5D7',
  accessibilityLabel = 'Rating',
  disabled = false,
}: RatingStarsProps) => (
  <View style={styles.row} accessibilityLabel={accessibilityLabel}>
    {STAR_VALUES.map((star) => {
      const filled = star <= value;
      return (
        <Pressable
          key={star}
          style={({ pressed }) => [
            styles.starButton,
            pressed && !disabled && { transform: [{ scale: 1.12 }] },
          ]}
          onPress={() => onChange(star)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
          accessibilityState={{ selected: filled, disabled }}
        >
          <Ionicons
            name={filled ? 'star' : 'star-outline'}
            size={size}
            color={filled ? activeColor : inactiveColor}
          />
        </Pressable>
      );
    })}
  </View>
);
