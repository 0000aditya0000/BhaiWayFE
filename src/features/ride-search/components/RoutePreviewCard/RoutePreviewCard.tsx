import React, { useCallback, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/shared/components';
import { isGoogleMapsBypassed, isValidMapCoordinate, MapBypassSurface } from '@/shared/maps';
import { colors, spacing } from '@/shared/theme';
import { styles } from './RoutePreviewCard.styles';
import type { RoutePreviewCardProps } from './RoutePreviewCard.types';

const EDGE_PADDING = {
  top: spacing.xxl,
  right: spacing.xxl,
  bottom: spacing.xxl,
  left: spacing.xxl,
};

const buildInitialRegion = (
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
): Region => {
  const latitude = (origin.latitude + destination.latitude) / 2;
  const longitude = (origin.longitude + destination.longitude) / 2;
  const latitudeDelta = Math.max(Math.abs(origin.latitude - destination.latitude) * 1.8, 0.04);
  const longitudeDelta = Math.max(
    Math.abs(origin.longitude - destination.longitude) * 1.8,
    0.04,
  );

  return { latitude, longitude, latitudeDelta, longitudeDelta };
};

export const RoutePreviewCard = React.memo(
  ({ origin, destination, routeInfo }: RoutePreviewCardProps) => {
    const mapRef = useRef<MapView>(null);
    const hasFittedRef = useRef(false);

    const coordinates = useMemo(
      () => [
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
      ],
      [origin.latitude, origin.longitude, destination.latitude, destination.longitude],
    );

    const initialRegion = useMemo(
      () => buildInitialRegion(origin, destination),
      [destination, origin],
    );

    const fitRoute = useCallback(() => {
      if (hasFittedRef.current) {
        return;
      }
      hasFittedRef.current = true;
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: EDGE_PADDING,
        animated: false,
      });
    }, [coordinates]);

    if (isGoogleMapsBypassed()) {
      return (
        <View
          style={styles.card}
          accessibilityLabel={`Route preview: ${routeInfo.distanceLabel}, about ${routeInfo.durationLabel}`}
        >
          <MapBypassSurface
            style={styles.map}
            title="Route preview"
            points={[
              { ...coordinates[0], label: 'Pickup' },
              { ...coordinates[1], label: 'Drop-off' },
            ]}
          />
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="navigate-outline" size={18} color={colors.primary} />
              <View style={styles.statTextCol}>
                <Text style={styles.statText}>{routeInfo.distanceLabel}</Text>
                <Text style={styles.statCaption}>Distance</Text>
              </View>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <View style={styles.statTextCol}>
                <Text style={styles.statText}>~ {routeInfo.durationLabel}</Text>
                <Text style={styles.statCaption}>Est. travel time</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View
        style={styles.card}
        accessibilityLabel={`Route preview: ${routeInfo.distanceLabel}, about ${routeInfo.durationLabel}`}
      >
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
          onMapReady={fitRoute}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          showsCompass={false}
          liteMode={Platform.OS === 'android'}
          pointerEvents="none"
        >
          {coordinates[0] && isValidMapCoordinate(coordinates[0]) ? (
            <Marker
              key="route-preview-start"
              coordinate={coordinates[0]}
              anchor={{ x: 0.5, y: 0.5 }}
              pinColor={colors.primary}
              tracksViewChanges={false}
            />
          ) : null}
          {coordinates[1] && isValidMapCoordinate(coordinates[1]) ? (
            <Marker
              key="route-preview-end"
              coordinate={coordinates[1]}
              pinColor={colors.primary}
              tracksViewChanges={false}
            />
          ) : null}
          {coordinates.length >= 2 ? (
            <Polyline
              key="route-preview-polyline"
              coordinates={coordinates}
              strokeColor={colors.primary}
              strokeWidth={3}
              lineDashPattern={[10, 6]}
            />
          ) : null}
        </MapView>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="navigate-outline" size={18} color={colors.primary} />
            <View style={styles.statTextCol}>
              <Text style={styles.statText}>{routeInfo.distanceLabel}</Text>
              <Text style={styles.statCaption}>Distance</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <View style={styles.statTextCol}>
              <Text style={styles.statText}>~ {routeInfo.durationLabel}</Text>
              <Text style={styles.statCaption}>Est. travel time</Text>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

RoutePreviewCard.displayName = 'RoutePreviewCard';
