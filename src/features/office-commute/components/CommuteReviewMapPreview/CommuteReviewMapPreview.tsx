import React, { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText as Text } from '@/shared/components';
import {
  BhaiWayMap,
  isValidMapCoordinate,
  type BhaiWayMapMarker,
  type MapLatLng,
} from '@/shared/maps';
import { styles } from './CommuteReviewMapPreview.styles';
import type { CommuteReviewMapPreviewProps } from './CommuteReviewMapPreview.types';

const toValidCoordinate = (value?: MapLatLng | null): MapLatLng | null =>
  isValidMapCoordinate(value) ? value : null;

export const CommuteReviewMapPreview = ({
  pickup,
  dropoff,
  pickupLabel = 'Pickup',
  dropoffLabel = 'Drop-off',
  routeCoordinates,
  distanceLabel,
  durationLabel,
  distanceCaption,
  loading = false,
}: CommuteReviewMapPreviewProps) => {
  const source = toValidCoordinate(pickup);
  const destination = toValidCoordinate(dropoff);

  const markers = useMemo((): BhaiWayMapMarker[] => {
    const next: BhaiWayMapMarker[] = [];
    if (source) {
      next.push({
        id: 'commute-review-source',
        coordinate: source,
        kind: 'source',
        title: pickupLabel,
        pinColor: '#4B61C4',
      });
    }
    if (destination) {
      next.push({
        id: 'commute-review-destination',
        coordinate: destination,
        kind: 'destination',
        title: dropoffLabel,
        pinColor: '#BA1A1A',
      });
    }
    return next;
  }, [destination, dropoffLabel, pickupLabel, source]);

  const polylineCoordinates = useMemo(() => {
    const decoded = routeCoordinates.filter(isValidMapCoordinate);
    if (decoded.length >= 2) {
      const withEndpoints = [...decoded];
      if (source) {
        const first = withEndpoints[0];
        if (first.latitude !== source.latitude || first.longitude !== source.longitude) {
          withEndpoints.unshift(source);
        }
      }
      if (destination) {
        const last = withEndpoints[withEndpoints.length - 1];
        if (last.latitude !== destination.latitude || last.longitude !== destination.longitude) {
          withEndpoints.push(destination);
        }
      }
      return withEndpoints;
    }
    if (source && destination) {
      return [source, destination];
    }
    return decoded;
  }, [destination, routeCoordinates, source]);

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Selected route from ${pickupLabel} to ${dropoffLabel}, ${distanceLabel}, ${durationLabel}`}
    >
      <BhaiWayMap
        style={styles.map}
        markers={markers}
        routeCoordinates={polylineCoordinates}
        autoFit
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        loading={loading}
        bypassTitle="Commute route"
        bypassSubtitle="Your selected driving route from pickup to drop-off will appear here."
      />

      <LinearGradient
        colors={['rgba(248,249,255,0)', 'rgba(248,249,255,1)']}
        style={styles.gradient}
        pointerEvents="none"
      />

      <View style={styles.distanceBadge} pointerEvents="none">
        <Ionicons name="navigate" size={20} color="#4B61C4" />
        <View>
          <Text style={styles.distanceCaption}>{distanceCaption}</Text>
          {loading ? (
            <ActivityIndicator size="small" color="#4B61C4" style={{ alignSelf: 'flex-start' }} />
          ) : (
            <Text style={styles.distanceValue}>
              {distanceLabel}
              {durationLabel ? ` • ${durationLabel}` : ''}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
};
