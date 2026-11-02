import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';

import { AppText as Text } from '@/shared/components';
import { isGoogleMapsBypassed, isValidMapCoordinate, MapBypassSurface } from '@/shared/maps';
import { colors, spacing } from '@/shared/theme';
import { RIDE_DETAILS_SCREEN } from '../../constants';
import type { MapCoordinate, RideDetailsLocation } from '../../types';
import { styles } from './RideDetailsRouteCard.styles';

export interface RideDetailsRouteCardProps {
  pickup: RideDetailsLocation;
  dropoff: RideDetailsLocation;
  routeCoordinates: MapCoordinate[];
}

const EDGE_PADDING = {
  top: spacing.xxl,
  right: spacing.xxl,
  bottom: spacing.xxl,
  left: spacing.xxl,
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
    latitudeDelta: Math.max((maxLat - minLat) * 1.7, 0.05),
    longitudeDelta: Math.max((maxLng - minLng) * 1.7, 0.05),
  };
};

export const RideDetailsRouteCard = React.memo(
  ({ pickup, dropoff, routeCoordinates }: RideDetailsRouteCardProps) => {
    const mapRef = useRef<MapView>(null);
    const fittedKeyRef = useRef('');

    const polyline = useMemo(() => {
      if (routeCoordinates.length >= 2) {
        return routeCoordinates;
      }
      return [
        { latitude: pickup.latitude, longitude: pickup.longitude },
        { latitude: dropoff.latitude, longitude: dropoff.longitude },
      ];
    }, [dropoff, pickup, routeCoordinates]);

    const initialRegion = useMemo(() => buildRegion(polyline), [polyline]);
    const fitKey = `${polyline.length}:${pickup.latitude}:${dropoff.longitude}`;

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

    return (
      <View style={styles.card}>
        <View style={styles.mapWrap}>
          {isGoogleMapsBypassed() ? (
            <MapBypassSurface
              style={styles.map}
              title="Route"
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
                  key="ride-details-pickup"
                  coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
                  pinColor={colors.primary}
                  tracksViewChanges={false}
                />
              ) : null}
              {isValidMapCoordinate(dropoff) ? (
                <Marker
                  key="ride-details-dropoff"
                  coordinate={{ latitude: dropoff.latitude, longitude: dropoff.longitude }}
                  pinColor="#404659"
                  tracksViewChanges={false}
                />
              ) : null}
              {polyline.length >= 2 ? (
                <Polyline
                  key="ride-details-polyline"
                  coordinates={polyline}
                  strokeColor={colors.primary}
                  strokeWidth={4}
                />
              ) : null}
            </MapView>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.85)']}
            style={styles.mapFade}
            pointerEvents="none"
          />
        </View>

        <View style={styles.routeBody}>
          <View style={styles.routeRow}>
            <View style={styles.indicator}>
              <View style={styles.pickupDot} />
              <View style={styles.routeLine} />
              <View style={styles.dropDot} />
            </View>
            <View style={styles.locations}>
              <View style={styles.locationBlock}>
                <Text style={styles.locationLabel}>{RIDE_DETAILS_SCREEN.pickupLabel}</Text>
                <Text style={styles.locationTitle}>{pickup.title}</Text>
                <Text style={styles.locationAddress}>{pickup.address}</Text>
              </View>
              <View style={styles.locationBlock}>
                <Text style={styles.locationLabel}>{RIDE_DETAILS_SCREEN.dropoffLabel}</Text>
                <Text style={styles.locationTitle}>{dropoff.title}</Text>
                <Text style={styles.locationAddress}>{dropoff.address}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  },
);

RideDetailsRouteCard.displayName = 'RideDetailsRouteCard';
