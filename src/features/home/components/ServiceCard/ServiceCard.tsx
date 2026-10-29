import React, { useCallback } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { HOME_CARD_THEMES } from '../../constants';
import { styles } from './ServiceCard.styles';
import type { ServiceCardProps } from './ServiceCard.types';

const ENTRANCE_BASE_DELAY = 70;

export const ServiceCard = React.memo(
  ({ data, index, layout = 'featured', illustration, onPress }: ServiceCardProps) => {
    const theme = HOME_CARD_THEMES[data.variant];
    const isFeatured = layout === 'featured';

    const handlePress = useCallback(() => {
      if (!data.enabled) {
        return;
      }
      triggerLightHaptic();
      onPress(data);
    }, [data, onPress]);

    if (isFeatured) {
      return (
        <Animated.View
          entering={FadeInDown.delay(index * ENTRANCE_BASE_DELAY).duration(420)}
          style={styles.featuredOuter}
        >
          <Pressable
            onPress={handlePress}
            disabled={!data.enabled}
            accessibilityRole="button"
            accessibilityLabel={`${data.title}. ${data.subtitle}`}
            accessibilityState={{ disabled: !data.enabled }}
            style={({ pressed }) => [
              styles.featuredPressable,
              pressed && data.enabled && { opacity: 0.94, transform: [{ scale: 0.99 }] },
            ]}
          >
            <LinearGradient
              colors={[...theme.gradient] as [string, string, ...string[]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.featuredGlow} />

            <View style={styles.featuredBody}>
              <View style={styles.featuredBadge}>
                <Ionicons name={data.badgeIcon as never} size={13} color={colors.textInverse} />
                <Text style={styles.featuredBadgeText}>{data.badge}</Text>
              </View>

              <Text style={styles.featuredTitle}>{data.title}</Text>
              <Text style={styles.featuredSubtitle}>{data.subtitle}</Text>

              <View style={styles.featuredCtaRow}>
                <Text style={[styles.featuredCtaText, { color: theme.accent }]}>
                  {data.actionLabel}
                </Text>
                <View style={[styles.featuredCtaIcon, { backgroundColor: theme.tint }]}>
                  <Ionicons name="arrow-forward" size={18} color={theme.accent} />
                </View>
              </View>
            </View>

            {illustration ? (
              <View pointerEvents="none" style={styles.featuredIllustration}>
                <Image
                  source={illustration}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                  accessibilityLabel=""
                />
              </View>
            ) : null}

            {!data.enabled ? <View style={styles.disabledOverlay} /> : null}
          </Pressable>
        </Animated.View>
      );
    }

    const subtitle = data.compactSubtitle || data.subtitle;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * ENTRANCE_BASE_DELAY).duration(420)}
        style={styles.compactOuter}
      >
        <Pressable
          onPress={handlePress}
          disabled={!data.enabled}
          accessibilityRole="button"
          accessibilityLabel={`${data.title}. ${subtitle}`}
          accessibilityState={{ disabled: !data.enabled }}
          style={({ pressed }) => [
            styles.compactPressable,
            pressed && data.enabled && { opacity: 0.94, transform: [{ scale: 0.98 }] },
          ]}
        >
          <LinearGradient
            colors={[...theme.gradient] as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.compactAccent}
          />

          <View style={[styles.compactIconWrap, { backgroundColor: theme.tint }]}>
            <Ionicons name={data.badgeIcon as never} size={22} color={theme.iconColor} />
          </View>

          <Text style={[styles.compactBadge, { color: theme.accent }]}>{data.badge}</Text>
          <Text style={styles.compactTitle} numberOfLines={2}>
            {data.title}
          </Text>
          <Text style={styles.compactSubtitle} numberOfLines={2}>
            {subtitle}
          </Text>

          <View style={styles.compactFooter}>
            <Text style={[styles.compactAction, { color: theme.accent }]}>{data.actionLabel}</Text>
            <View style={[styles.compactArrow, { backgroundColor: theme.tint }]}>
              <Ionicons name="chevron-forward" size={18} color={theme.accent} />
            </View>
          </View>

          {!data.enabled ? <View style={styles.disabledOverlay} /> : null}
        </Pressable>
      </Animated.View>
    );
  },
);

ServiceCard.displayName = 'ServiceCard';
