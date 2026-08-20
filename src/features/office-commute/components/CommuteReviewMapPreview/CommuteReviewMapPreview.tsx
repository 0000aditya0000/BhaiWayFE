import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import type { MapCoordinate } from '@/features/ride-search/types';
import { AppText as Text } from '@/shared/components';
import { isGoogleMapsBypassed, MapBypassSurface } from '@/shared/maps';
import { styles } from './CommuteReviewMapPreview.styles';
import type { CommuteReviewMapPreviewProps } from './CommuteReviewMapPreview.types';

const EDGE_PADDING = { top: 40, right: 40, bottom: 56, left: 40 };

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
    latitudeDelta: Math.max((maxLat - minLat) * 1.7, 0.04),
    longitudeDelta: Math.max((maxLng - minLng) * 1.7, 0.04),
  };
};

export const CommuteReviewMapPreview = ({
  pickup,
  dropoff,
  routeCoordinates,
  distanceLabel,
  durationLabel,
  distanceCaption,
  loading = false,
}: CommuteReviewMapPreviewProps) => {
  const mapRef = useRef<MapView>(null);
  const fittedKeyRef = useRef('');

  const polylineCoordinates = useMemo(() => {
    if (routeCoordinates.length >= 2) {
      return routeCoordinates;
    }
    return [pickup, dropoff];
  }, [dropoff, pickup, routeCoordinates]);

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
      accessibilityLabel={`Best route ${distanceLabel}, ${durationLabel}`}
    >
      {isGoogleMapsBypassed() ? (
        <MapBypassSurface
          style={styles.map}
          title="Commute route"
          points={[
            { ...pickup, label: 'Pickup' },
            { ...dropoff, label: 'Drop-off' },
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
          <Marker coordinate={pickup} pinColor="#4B61C4" tracksViewChanges={false} />
          <Marker coordinate={dropoff} pinColor="#BA1A1A" tracksViewChanges={false} />
          <Polyline
            coordinates={polylineCoordinates}
            strokeColor="#4B61C4"
            strokeWidth={4}
            lineJoin="round"
            lineCap="round"
          />
        </MapView>
      )}

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
