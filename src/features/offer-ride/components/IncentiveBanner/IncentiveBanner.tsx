import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { styles } from './IncentiveBanner.styles';
import type { IncentiveBannerProps } from './IncentiveBanner.types';

export const IncentiveBanner = React.memo(({ message }: IncentiveBannerProps) => (
  <View style={styles.outer}>
    <LinearGradient
      colors={['#4B61C4', '#374BB1']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.banner}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="flash" size={14} color={colors.textInverse} />
      </View>
      <Text style={styles.text} numberOfLines={2}>
        {message}
      </Text>
      <Ionicons name="trending-up" size={16} color="rgba(255,255,255,0.85)" />
    </LinearGradient>
  </View>
));

IncentiveBanner.displayName = 'IncentiveBanner';
