import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';

import { AppText as Text } from '@/shared/components';
import { isGoogleMapsBypassed, isValidMapCoordinate, MapBypassSurface } from '@/shared/maps';
import { colors, spacing } from '@/shared/theme';
import type { BookingLocation, MapCoordinate } from '../../types';
import { styles } from './ReviewBookingMapPreview.styles';

export interface ReviewBookingMapPreviewProps {
  pickup: BookingLocation;
  dropoff: BookingLocation;
  routeCoordinates: MapCoordinate[];
  distanceLabel: string;
  durationLabel: string;
}

const EDGE_PADDING = {
  top: spacing.xxl,
  right: spacing.xxl,
  bottom: spacing.xxxl,
  left: spacing.xxl,
};

const buildInitialRegion = (coordinates: MapCoordinate[]): Region => {
  const latitudes = coordinates.map((point) => point.latitude);
  const longitudes = coordinates.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.6, 0.04),
    longitudeDelta: Math.max((maxLng - minLng) * 1.6, 0.04),
  };
};

export const ReviewBookingMapPreview = React.memo(
  ({
    pickup,
    dropoff,
    routeCoordinates,
    distanceLabel,
    durationLabel,
  }: ReviewBookingMapPreviewProps) => {
    const mapRef = useRef<MapView>(null);
    const fittedKeyRef = useRef<string>('');

    const polylineCoordinates = useMemo(() => {
      if (routeCoordinates.length >= 2) {
        return routeCoordinates;
      }
      return [
        { latitude: pickup.latitude, longitude: pickup.longitude },
        { latitude: dropoff.latitude, longitude: dropoff.longitude },
      ];
    }, [dropoff.latitude, dropoff.longitude, pickup.latitude, pickup.longitude, routeCoordinates]);

    const initialRegion = useMemo(
      () => buildInitialRegion(polylineCoordinates),
      [polylineCoordinates],
    );

    const fitKey = useMemo(
      () =>
        `${polylineCoordinates.length}:${polylineCoordinates[0]?.latitude}:${polylineCoordinates[polylineCoordinates.length - 1]?.longitude}`,
      [polylineCoordinates],
    );

    const fitRoute = useCallback(() => {
      if (fittedKeyRef.current === fitKey) {
        return;
      }
      fittedKeyRef.current = fitKey;
      mapRef.current?.fitToCoordinates(polylineCoordinates, {
        edgePadding: EDGE_PADDING,
        animated: false,
      });
    }, [fitKey, polylineCoordinates]);

    useEffect(() => {
      fitRoute();
    }, [fitRoute]);

    return (
      <View
        style={styles.container}
        accessibilityLabel={`Route ${distanceLabel}, ${durationLabel}`}
      >
        {isGoogleMapsBypassed() ? (
          <MapBypassSurface
            style={styles.map}
            title="Route preview"
            points={[
              { latitude: pickup.latitude, longitude: pickup.longitude, label: 'Pickup' },
              { latitude: dropoff.latitude, longitude: dropoff.longitude, label: 'Drop-off' },
            ]}
          />
        ) : (
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
            {isValidMapCoordinate(pickup) ? (
              <Marker
                key="review-booking-pickup"
                coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
                pinColor={colors.primary}
                tracksViewChanges={false}
              />
            ) : null}
            {isValidMapCoordinate(dropoff) ? (
              <Marker
                key="review-booking-dropoff"
                coordinate={{ latitude: dropoff.latitude, longitude: dropoff.longitude }}
                pinColor={colors.error}
                tracksViewChanges={false}
              />
            ) : null}
            {polylineCoordinates.length >= 2 ? (
              <Polyline
                key="review-booking-polyline"
                coordinates={polylineCoordinates}
                strokeColor={colors.primary}
                strokeWidth={4}
              />
            ) : null}
          </MapView>
        )}

        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>
            {distanceLabel} • {durationLabel}
          </Text>
        </View>
      </View>
    );
  },
);

ReviewBookingMapPreview.displayName = 'ReviewBookingMapPreview';
