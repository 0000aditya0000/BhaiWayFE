import React, { useCallback } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { HOME_FOOTER, HOME_HIGHLIGHTS } from '../../constants';
import { styles } from './HomeFooter.styles';
import type { HomeFooterProps } from './HomeFooter.types';

export const HomeFooter = React.memo(({ bottomInset = 0 }: HomeFooterProps) => {
  const handleOpenWebsite = useCallback(() => {
    triggerLightHaptic();
    Linking.openURL(HOME_FOOTER.websiteUrl).catch(() => undefined);
  }, []);

  return (
    <View style={[styles.container, bottomInset > 0 && { paddingBottom: bottomInset }]}>
      <View style={styles.highlights}>
        {HOME_HIGHLIGHTS.map((item) => (
          <View key={item.id} style={styles.highlightChip}>
            <Ionicons name={item.icon as never} size={14} color={colors.primary} />
            <Text style={styles.highlightLabel} numberOfLines={1}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.creditRow} accessibilityRole="text">
        <Text style={styles.creditText}>{HOME_FOOTER.madeWithPrefix} </Text>
        <Ionicons name="heart" size={14} color="#E53935" accessibilityLabel="love" />
        <Text style={styles.creditText}> {HOME_FOOTER.atPrefix} </Text>
        <Pressable
          onPress={handleOpenWebsite}
          accessibilityRole="link"
          accessibilityLabel={`Open ${HOME_FOOTER.brand} website`}
          hitSlop={8}
        >
          <Text style={styles.creditBrand}>{HOME_FOOTER.brand}</Text>
        </Pressable>
      </View>
    </View>
  );
});

HomeFooter.displayName = 'HomeFooter';
