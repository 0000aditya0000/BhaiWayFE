import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';

import { AppText as Text } from '@/shared/components';
import { fetchDrivingRoute } from '@/features/ride-search/services';
import type { MapCoordinate } from '@/features/ride-search/types';
import { isGoogleMapsBypassed, MapBypassSurface } from '@/shared/maps';
import { colors, spacing } from '@/shared/theme';
import { styles } from './MyRidesRouteMap.styles';
import type { MyRidesRouteMapProps } from './MyRidesRouteMap.types';

const EDGE_PADDING = {
  top: spacing.lg,
  right: spacing.lg,
  bottom: spacing.xxl,
  left: spacing.lg,
};

const buildRegion = (coordinates: MapCoordinate[]): Region => {
  const lats = coordinates.map((c) => c.latitude);
  const lngs = coordinates.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.7, 0.04),
    longitudeDelta: Math.max((maxLng - minLng) * 1.7, 0.04),
  };
};

export const MyRidesRouteMap = React.memo(
  ({
    pickup,
    dropoff,
    pickupLabel,
    dropoffLabel,
    onExpandPress,
    height = 160,
  }: MyRidesRouteMapProps) => {
    const mapRef = useRef<MapView>(null);
    const fittedKeyRef = useRef('');
    const [routeCoordinates, setRouteCoordinates] = useState<MapCoordinate[]>([
      pickup,
      dropoff,
    ]);
    const [routeMeta, setRouteMeta] = useState({ distanceLabel: '', durationLabel: '' });

    useEffect(() => {
      let cancelled = false;
      const origin = { latitude: pickup.latitude, longitude: pickup.longitude };
      const destination = { latitude: dropoff.latitude, longitude: dropoff.longitude };

      const load = async () => {
        try {
          const route = await fetchDrivingRoute(origin, destination);
          if (cancelled) {
            return;
          }
          setRouteCoordinates(
            route.coordinates.length >= 2 ? route.coordinates : [origin, destination],
          );
          setRouteMeta({
            distanceLabel: route.distanceLabel,
            durationLabel: route.durationLabel,
          });
        } catch {
          if (!cancelled) {
            setRouteCoordinates([origin, destination]);
            setRouteMeta({ distanceLabel: '', durationLabel: '' });
          }
        }
      };

      void load();
      return () => {
        cancelled = true;
      };
    }, [dropoff.latitude, dropoff.longitude, pickup.latitude, pickup.longitude]);

    const polyline = useMemo(() => {
      if (routeCoordinates.length >= 2) {
        return routeCoordinates;
      }
      return [pickup, dropoff];
    }, [dropoff, pickup, routeCoordinates]);

    const initialRegion = useMemo(() => buildRegion(polyline), [polyline]);

    const fitKey = useMemo(
      () =>
        `${polyline.length}:${polyline[0]?.latitude}:${polyline[polyline.length - 1]?.longitude}`,
      [polyline],
    );

    const fitRoute = useCallback(() => {
      if (fittedKeyRef.current === fitKey) {
        return;
      }
      fittedKeyRef.current = fitKey;
      mapRef.current?.fitToCoordinates(polyline, {
        edgePadding: EDGE_PADDING,
        animated: false,
      });
    }, [fitKey, polyline]);

    useEffect(() => {
      fitRoute();
    }, [fitRoute]);

    const accessibilityLabel = [
      pickupLabel ? `From ${pickupLabel}` : 'Pickup',
      dropoffLabel ? `to ${dropoffLabel}` : 'drop-off',
      routeMeta.distanceLabel,
      routeMeta.durationLabel,
    ]
      .filter(Boolean)
      .join(', ');

    if (isGoogleMapsBypassed()) {
      return (
        <View style={[styles.container, { height }]} accessibilityLabel={accessibilityLabel}>
          <MapBypassSurface
            style={styles.map}
            title="Route map"
            points={[
              { ...pickup, label: pickupLabel || 'Pickup' },
              { ...dropoff, label: dropoffLabel || 'Drop-off' },
            ]}
          />
          {routeMeta.distanceLabel ? (
            <View style={styles.badge} pointerEvents="none">
              <Text style={styles.badgeText}>
                {routeMeta.distanceLabel}
                {routeMeta.durationLabel ? ` • ${routeMeta.durationLabel}` : ''}
              </Text>
            </View>
          ) : null}
          {onExpandPress ? (
            <Pressable
              style={({ pressed }) => [styles.expandBtn, pressed && { transform: [{ scale: 0.94 }] }]}
              onPress={onExpandPress}
              accessibilityRole="button"
              accessibilityLabel="Open live map"
            >
              <Ionicons name="expand-outline" size={16} color="#374BB1" />
            </Pressable>
          ) : null}
        </View>
      );
    }

    return (
      <View style={[styles.container, { height }]} accessibilityLabel={accessibilityLabel}>
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
          <Marker
            coordinate={pickup}
            pinColor={colors.primary}
            tracksViewChanges={false}
            title={pickupLabel}
          />
          <Marker
            coordinate={dropoff}
            pinColor="#585E72"
            tracksViewChanges={false}
            title={dropoffLabel}
          />
          <Polyline coordinates={polyline} strokeColor="#374BB1" strokeWidth={4} />
        </MapView>

        {routeMeta.distanceLabel ? (
          <View style={styles.badge} pointerEvents="none">
            <Text style={styles.badgeText}>
              {routeMeta.distanceLabel}
              {routeMeta.durationLabel ? ` • ${routeMeta.durationLabel}` : ''}
            </Text>
          </View>
        ) : null}

        {onExpandPress ? (
          <Pressable
            style={({ pressed }) => [styles.expandBtn, pressed && { transform: [{ scale: 0.94 }] }]}
            onPress={onExpandPress}
            accessibilityRole="button"
            accessibilityLabel="Open live map"
          >
            <Ionicons name="expand-outline" size={16} color="#374BB1" />
          </Pressable>
        ) : null}
      </View>
    );
  },
);

MyRidesRouteMap.displayName = 'MyRidesRouteMap';
