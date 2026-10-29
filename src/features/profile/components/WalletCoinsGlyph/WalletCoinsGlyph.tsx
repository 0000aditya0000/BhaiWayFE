import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface WalletCoinsGlyphProps {
  size?: number;
  color?: string;
}

/** Compact coins indicator — replaces brand coin SVG in wallet UI. */
export const WalletCoinsGlyph = ({
  size = 18,
  color = '#C9A227',
}: WalletCoinsGlyphProps) => (
  <View
    style={{
      width: size + 4,
      height: size + 4,
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Ionicons name="cash" size={size} color={color} />
  </View>
);
