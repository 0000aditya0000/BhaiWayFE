import React, { useMemo } from 'react';
import {
  ImageBackground,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText as Text } from '@/shared/components/AppText';
import { colors, spacing } from '@/shared/theme';

const MAP_PLACEHOLDER = require('../../../assets/images/offer-ride/map-placeholder.png');

export interface MapBypassPoint {
  latitude: number;
  longitude: number;
  label?: string;
}

export interface MapBypassSurfaceProps {
  style?: StyleProp<ViewStyle>;
  /** Optional center label (e.g. selected place). */
  title?: string;
  subtitle?: string;
  points?: MapBypassPoint[];
  children?: React.ReactNode;
}

/**
 * Non-Google map stand-in for testing when Maps SDK / API keys are unavailable.
 * Keeps layout slots filled so ride flows remain usable with OSM place search.
 */
export const MapBypassSurface = ({
  style,
  title = 'Map preview',
  subtitle = 'Google Maps bypassed for testing',
  points,
  children,
}: MapBypassSurfaceProps) => {
  const pointSummary = useMemo(() => {
    if (!points?.length) {
      return null;
    }
    return points
      .map((point) => {
        const coords = `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}`;
        return point.label ? `${point.label}: ${coords}` : coords;
      })
      .join('\n');
  }, [points]);

  return (
    <View style={[styles.root, style]}>
      <ImageBackground source={MAP_PLACEHOLDER} style={styles.bg} imageStyle={styles.bgImage}>
        <View style={styles.scrim} />
        <View style={styles.copy}>
          <Text style={styles.badge}>TEST MODE</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          {pointSummary ? <Text style={styles.points}>{pointSummary}</Text> : null}
        </View>
        {children}
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  bg: {
    flex: 1,
    justifyContent: 'center',
  },
  bgImage: {
    resizeMode: 'cover',
    opacity: 0.55,
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(239, 244, 255, 0.78)',
  },
  copy: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    zIndex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primary,
    color: colors.textInverse,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  points: {
    marginTop: spacing.sm,
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
});
