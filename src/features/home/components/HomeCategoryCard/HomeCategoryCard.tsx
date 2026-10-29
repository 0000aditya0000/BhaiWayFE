import React, { useCallback } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { HOME_CATEGORY_THEMES } from '../../constants/home.cardThemes';
import type { HomeAction } from '../../types';
import { styles } from './HomeCategoryCard.styles';
import type { HomeCategoryCardProps } from './HomeCategoryCard.types';

const ENTRANCE_BASE_DELAY = 90;

const isPublishAction = (actionId: string): boolean => actionId.endsWith('-publish');

export const HomeCategoryCard = React.memo(
  ({ category, index, onActionPress }: HomeCategoryCardProps) => {
    const theme = HOME_CATEGORY_THEMES[category.id];

    const handleAction = useCallback(
      (action: HomeAction) => {
        if (!category.enabled) {
          return;
        }
        triggerLightHaptic();
        onActionPress(action, category);
      },
      [category, onActionPress],
    );

    return (
      <Animated.View
        entering={FadeInDown.delay(index * ENTRANCE_BASE_DELAY).duration(420)}
        style={styles.outer}
      >
        <LinearGradient
          colors={[...theme.gradient] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.canvas}
        >
          <View style={[styles.orbOne, { backgroundColor: theme.orb }]} pointerEvents="none" />
          <View style={[styles.orbTwo, { backgroundColor: theme.orb }]} pointerEvents="none" />

          <View style={styles.headerCopy}>
            <View style={styles.badge}>
              <Ionicons
                name={category.badgeIcon as never}
                size={13}
                color={colors.textInverse}
              />
              <Text style={styles.badgeText}>{category.badge}</Text>
            </View>
            <Text style={styles.title}>{category.title}</Text>
            <Text style={styles.subtitle}>{category.subtitle}</Text>
          </View>

          <View style={styles.actionsRow}>
            {category.actions.map((action) => {
              const publish = isPublishAction(action.id);
              const tint = publish ? theme.publishTint : theme.bookTint;
              const accent = publish ? theme.publishAccent : theme.bookAccent;

              return (
                <Pressable
                  key={action.id}
                  onPress={() => handleAction(action)}
                  disabled={!category.enabled}
                  accessibilityRole="button"
                  accessibilityLabel={`${category.title}: ${action.title}. ${action.subtitle}`}
                  accessibilityState={{ disabled: !category.enabled }}
                  style={({ pressed }) => [
                    styles.actionCard,
                    pressed && category.enabled && styles.actionCardPressed,
                  ]}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: tint }]}>
                    <Ionicons name={action.icon as never} size={20} color={accent} />
                  </View>
                  <View>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionSubtitle} numberOfLines={2}>
                      {action.subtitle}
                    </Text>
                  </View>
                  <View style={styles.actionFooter}>
                    <Text style={[styles.actionCta, { color: accent }]}>{action.cta}</Text>
                    <View style={[styles.actionArrow, { backgroundColor: tint }]}>
                      <Ionicons name="arrow-forward" size={13} color={accent} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  },
);

HomeCategoryCard.displayName = 'HomeCategoryCard';
