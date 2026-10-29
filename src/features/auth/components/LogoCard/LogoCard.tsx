import React from 'react';
import { Image } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { styles } from './LogoCard.styles';
import type { LogoCardProps } from './LogoCard.types';

const logoSource = require('../../../../../assets/brand-logo.png');

export const LogoCard = ({ scale }: LogoCardProps) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.card, animatedStyle]}
      accessibilityLabel="BhaiWay logo"
      accessibilityRole="image"
    >
      <Image
        source={logoSource}
        style={styles.logo}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
};
