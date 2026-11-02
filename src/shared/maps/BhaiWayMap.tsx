import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

import { AppText as Text } from '@/shared/components';
import { colors, spacing } from '@/shared/theme';

import { isGoogleMapsBypassed } from './isGoogleMapsBypassed';
import { MapBypassSurface } from './MapBypassSurface';
import type { BhaiWayMapMarker, BhaiWayMapProps, MapLatLng } from './map.types';
import {
  buildRegionFromCoordinates,
  DEFAULT_MAP_DELTA,
  isValidMapCoordinate,
  MAP_CAMERA_FALLBACK,
  pinColorForKind,
} from './map.utils';

const DEFAULT_EDGE_PADDING = {
  top: spacing.xl,
  right: spacing.xl,
  bottom: spacing.xl,
  left: spacing.xl,
};

/**
 * Android always uses Google Maps. iOS uses Apple Maps unless AirGoogleMaps
 * is linked in the native project (`react-native-maps` iOS Google plugin + rebuild).
 */
const NATIVE_MAP_PROVIDER = Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined;

/**
 * Shared map surface for BhaiWay screens.
 * Falls back to MapBypassSurface when Maps are bypassed / unconfigured.
 */
export const BhaiWayMap = React.memo(
  ({
    style,
    initialRegion,
    markers = [],
    routeCoordinates = [],
    extraFitCoordinates = [],
    autoFit = true,
    edgePadding = DEFAULT_EDGE_PADDING,
    scrollEnabled = true,
    zoomEnabled = true,
    rotateEnabled = false,
    pitchEnabled = false,
    showsUserLocation = false,
    showsMyLocationButton = false,
    liteMode = false,
    loading = false,
    errorMessage = null,
    bypassTitle = 'Map preview',
    bypassSubtitle =
      'Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY and set EXPO_PUBLIC_BYPASS_GOOGLE_MAPS=false',
    onMapReady,
    onRegionChangeComplete,
    children,
  }: BhaiWayMapProps) => {
    const mapRef = useRef<MapView>(null);
    const fittedKeyRef = useRef('');
    const bypass = isGoogleMapsBypassed();

    const fitCoordinates = useMemo(() => {
      const fromMarkers = markers
        .map((marker) => marker.coordinate)
        .filter(isValidMapCoordinate);
      const fromRoute = routeCoordinates.filter(isValidMapCoordinate);
      const fromExtra = extraFitCoordinates.filter(isValidMapCoordinate);
      return [...fromMarkers, ...fromRoute, ...fromExtra];
    }, [extraFitCoordinates, markers, routeCoordinates]);

    const validMarkers = useMemo(
      () =>
        markers.filter(
          (marker): marker is BhaiWayMapMarker =>
            marker != null &&
            typeof marker.id === 'string' &&
            isValidMapCoordinate(marker.coordinate),
        ),
      [markers],
    );

    const validRouteCoordinates = useMemo(() => {
      if (!Array.isArray(routeCoordinates) || routeCoordinates.length < 2) {
        return [];
      }
      const filtered = routeCoordinates.filter(isValidMapCoordinate);
      return filtered.length >= 2 ? filtered : [];
    }, [routeCoordinates]);

    const resolvedInitialRegion: Region = useMemo(() => {
      if (initialRegion) {
        return initialRegion;
      }
      if (fitCoordinates.length > 0) {
        return buildRegionFromCoordinates(fitCoordinates);
      }
      return {
        ...MAP_CAMERA_FALLBACK,
        ...DEFAULT_MAP_DELTA,
      };
    }, [fitCoordinates, initialRegion]);

    const fitKey = useMemo(
      () =>
        fitCoordinates
          .map((point) => `${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`)
          .join('|'),
      [fitCoordinates],
    );

    const fitToData = useCallback(() => {
      if (bypass || !autoFit || fitCoordinates.length === 0) {
        return;
      }
      if (fittedKeyRef.current === fitKey) {
        return;
      }
      fittedKeyRef.current = fitKey;
      mapRef.current?.fitToCoordinates(fitCoordinates as MapLatLng[], {
        edgePadding,
        animated: false,
      });
    }, [autoFit, bypass, edgePadding, fitCoordinates, fitKey]);

    useEffect(() => {
      fitToData();
    }, [fitToData]);

    const handleMapReady = useCallback(() => {
      fitToData();
      onMapReady?.();
    }, [fitToData, onMapReady]);

    const bypassPoints = useMemo(
      () =>
        markers
          .filter((marker) => isValidMapCoordinate(marker.coordinate))
          .map((marker) => ({
            latitude: marker.coordinate.latitude,
            longitude: marker.coordinate.longitude,
            label: marker.title,
          })),
      [markers],
    );

    if (bypass) {
      return (
        <View style={[styles.root, style]}>
          <MapBypassSurface
            style={StyleSheet.absoluteFill}
            title={bypassTitle}
            subtitle={bypassSubtitle}
            points={bypassPoints}
          />
          {loading ? (
            <View style={styles.overlay} pointerEvents="none">
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}
          {errorMessage ? (
            <View style={styles.errorBanner} pointerEvents="none">
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}
          {children}
        </View>
      );
    }

    return (
      <View style={[styles.root, style]}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          provider={NATIVE_MAP_PROVIDER}
          initialRegion={resolvedInitialRegion}
          onMapReady={handleMapReady}
          onRegionChangeComplete={onRegionChangeComplete}
          scrollEnabled={scrollEnabled}
          zoomEnabled={zoomEnabled}
          rotateEnabled={rotateEnabled}
          pitchEnabled={pitchEnabled}
          showsUserLocation={showsUserLocation}
          showsMyLocationButton={showsMyLocationButton}
          toolbarEnabled={false}
          showsCompass={false}
          liteMode={liteMode && Platform.OS === 'android'}
        >
          {validMarkers.map((marker) => (
            <Marker
              key={marker.id}
              identifier={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              pinColor={marker.pinColor ?? pinColorForKind(marker.kind)}
              tracksViewChanges={false}
            />
          ))}
          {validRouteCoordinates.length >= 2 ? (
            <Polyline
              key="bhaiway-map-primary-polyline"
              coordinates={validRouteCoordinates}
              strokeColor="#374BB1"
              strokeWidth={4}
            />
          ) : null}
          {React.Children.toArray(children).filter(Boolean)}
        </MapView>

        {loading ? (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        {errorMessage ? (
          <View style={styles.errorBanner} pointerEvents="none">
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </View>
    );
  },
);

BhaiWayMap.displayName = 'BhaiWayMap';

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  errorBanner: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(55, 75, 177, 0.92)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
