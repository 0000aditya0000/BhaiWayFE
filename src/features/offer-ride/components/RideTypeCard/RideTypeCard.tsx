import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText as Text } from '@/shared/components';
import { colors } from '@/shared/theme';
import { triggerLightHaptic } from '@/shared/utils';
import { styles } from './RideTypeCard.styles';
import type { RideTypeCardProps } from './RideTypeCard.types';

export const RideTypeCard = React.memo(
  ({
    title,
    icon,
    description,
    buttonLabel,
    highlighted = false,
    badge,
    note,
    perks = [],
    onSelect,
  }: RideTypeCardProps) => {
    const featured = Boolean(highlighted);

    return (
      <Pressable
        onPress={() => {
          triggerLightHaptic();
          onSelect();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${buttonLabel}`}
        style={({ pressed }) => [
          styles.card,
          featured && styles.cardFeatured,
          pressed && styles.cardPressed,
        ]}
      >
        {featured ? (
          <>
            <LinearGradient
              colors={['#5B6FD4', '#374BB1', '#24328A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientFill}
            />
            <View style={styles.glow} pointerEvents="none" />
          </>
        ) : null}

        <View style={styles.topRow}>
          <View
            style={[
              styles.iconRing,
              featured ? styles.iconRingFeatured : styles.iconRingLight,
            ]}
          >
            <Ionicons
              name={icon as never}
              size={22}
              color={featured ? colors.textInverse : colors.primary}
            />
          </View>

          <View style={styles.titleBlock}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, featured ? styles.titleFeatured : styles.titleLight]}>
                {title}
              </Text>
              {badge ? (
                <View style={[styles.badge, featured ? styles.badgeFeatured : styles.badgeLight]}>
                  <Ionicons
                    name="sparkles"
                    size={11}
                    color={featured ? colors.textInverse : colors.primary}
                  />
                  <Text
                    style={[
                      styles.badgeText,
                      { color: featured ? colors.textInverse : colors.primary },
                    ]}
                  >
                    {badge}
                  </Text>
                </View>
              ) : null}
            </View>
            <Text
              style={[
                styles.description,
                featured ? styles.descriptionFeatured : styles.descriptionLight,
              ]}
            >
              {description}
            </Text>
          </View>
        </View>

        {perks.length > 0 ? (
          <View style={styles.perkList}>
            {perks.map((perk) => (
              <View key={perk} style={styles.perkRow}>
                <View
                  style={[
                    styles.perkDot,
                    {
                      backgroundColor: featured
                        ? 'rgba(255,255,255,0.2)'
                        : colors.accentLight,
                    },
                  ]}
                >
                  <Ionicons
                    name="checkmark"
                    size={12}
                    color={featured ? colors.textInverse : colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.perkText,
                    {
                      color: featured ? 'rgba(255,255,255,0.92)' : colors.textSecondary,
                    },
                  ]}
                >
                  {perk}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {note ? (
          <Text style={[styles.note, featured ? styles.noteFeatured : styles.noteLight]}>
            {note}
          </Text>
        ) : null}

        <View
          style={[
            styles.ctaRow,
            featured ? styles.ctaBorderFeatured : styles.ctaBorderLight,
          ]}
        >
          <Text
            style={[
              styles.ctaLabel,
              { color: featured ? colors.textInverse : colors.primary },
            ]}
          >
            {buttonLabel}
          </Text>
          <View
            style={[
              styles.ctaArrow,
              {
                backgroundColor: featured
                  ? 'rgba(255,255,255,0.2)'
                  : colors.accentLight,
              },
            ]}
          >
            <Ionicons
              name="arrow-forward"
              size={16}
              color={featured ? colors.textInverse : colors.primary}
            />
          </View>
        </View>
      </Pressable>
    );
  },
);

RideTypeCard.displayName = 'RideTypeCard';
