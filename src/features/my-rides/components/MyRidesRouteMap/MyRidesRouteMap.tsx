import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/shared/components';
import { fetchDrivingRoute } from '@/features/ride-search/services';
import {
  BhaiWayMap,
  isValidMapCoordinate,
  type BhaiWayMapMarker,
  type MapLatLng,
} from '@/shared/maps';
import { styles } from './MyRidesRouteMap.styles';
import type { MyRidesRouteMapProps } from './MyRidesRouteMap.types';

export const MyRidesRouteMap = React.memo(
  ({
    pickup,
    dropoff,
    pickupLabel,
    dropoffLabel,
    onExpandPress,
    height = 160,
  }: MyRidesRouteMapProps) => {
    const hasPickup = isValidMapCoordinate(pickup);
    const hasDropoff = isValidMapCoordinate(dropoff);

    const [routeCoordinates, setRouteCoordinates] = useState<MapLatLng[]>([]);
    const [routeMeta, setRouteMeta] = useState({ distanceLabel: '', durationLabel: '' });

    useEffect(() => {
      if (!hasPickup || !hasDropoff) {
        setRouteCoordinates([]);
        setRouteMeta({ distanceLabel: '', durationLabel: '' });
        return;
      }

      let cancelled = false;
      const origin = { latitude: pickup!.latitude, longitude: pickup!.longitude };
      const destination = { latitude: dropoff!.latitude, longitude: dropoff!.longitude };

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
    }, [dropoff, hasDropoff, hasPickup, pickup]);

    const markers = useMemo((): BhaiWayMapMarker[] => {
      const next: BhaiWayMapMarker[] = [];
      if (hasPickup) {
        next.push({
          id: 'pickup',
          coordinate: pickup!,
          kind: 'source',
          title: pickupLabel || 'Pickup',
        });
      }
      if (hasDropoff) {
        next.push({
          id: 'dropoff',
          coordinate: dropoff!,
          kind: 'destination',
          title: dropoffLabel || 'Drop-off',
        });
      }
      return next;
    }, [dropoff, dropoffLabel, hasDropoff, hasPickup, pickup, pickupLabel]);

    const accessibilityLabel = [
      pickupLabel ? `From ${pickupLabel}` : 'Pickup',
      dropoffLabel ? `to ${dropoffLabel}` : 'drop-off',
      routeMeta.distanceLabel,
      routeMeta.durationLabel,
    ]
      .filter(Boolean)
      .join(', ');

    if (!hasPickup || !hasDropoff) {
      return (
        <View style={[styles.container, { height }]} accessibilityLabel={accessibilityLabel}>
          <View style={[styles.map, styles.missingCoords]}>
            <Text style={styles.missingCoordsTitle}>Map unavailable</Text>
            <Text style={styles.missingCoordsBody}>
              We could not locate this route yet. Pickup and drop-off names still show next to
              the map.
            </Text>
          </View>
          {onExpandPress ? (
            <Pressable
              style={({ pressed }) => [
                styles.expandBtn,
                pressed && { transform: [{ scale: 0.94 }] },
              ]}
              onPress={onExpandPress}
              accessibilityRole="button"
              accessibilityLabel="Open ride details"
            >
              <Ionicons name="expand-outline" size={16} color="#374BB1" />
            </Pressable>
          ) : null}
        </View>
      );
    }

    return (
      <View style={[styles.container, { height }]} accessibilityLabel={accessibilityLabel}>
        <BhaiWayMap
          style={styles.map}
          markers={markers}
          routeCoordinates={routeCoordinates}
          autoFit
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          liteMode
          bypassTitle="Route map"
          bypassSubtitle="Add a Google Maps API key to show the live map"
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
            style={({ pressed }) => [
              styles.expandBtn,
              pressed && { transform: [{ scale: 0.94 }] },
            ]}
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
