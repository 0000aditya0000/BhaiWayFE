import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import { AppText as Text } from '@/shared/components';
import { isGoogleMapsBypassed, MapBypassSurface } from '@/shared/maps';
import { colors, spacing } from '@/shared/theme';
import { COMMUTE_REVIEW_BOOKING_SCREEN } from '../../constants/commute-review-booking.constants';
import { getRouteMatchVisual } from '../../utils/routeMatchVisual';
import { styles } from './CommuteBookingMapHero.styles';
import type { CommuteBookingMapHeroProps } from './CommuteBookingMapHero.types';

const EDGE_PADDING = {
  top: spacing.xxl,
  right: spacing.xxl,
  bottom: spacing.xxl,
  left: spacing.xxl,
};

const buildInitialRegion = (
  coordinates: Array<{ latitude: number; longitude: number }>,
): Region => {
  const latitudes = coordinates.map((point) => point.latitude);
  const longitudes = coordinates.map((point) => point.longitude);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * 1.8, 0.05),
    longitudeDelta: Math.max((maxLng - minLng) * 1.8, 0.05),
  };
};

export const CommuteBookingMapHero = React.memo(
  ({
    pickup,
    dropoff,
    routeCoordinates,
    distanceLabel,
    durationLabel,
    matchPercent,
    matchCaption,
  }: CommuteBookingMapHeroProps) => {
    const mapRef = useRef<MapView>(null);
    const fittedKeyRef = useRef('');
    const showMatch = matchPercent != null && Number.isFinite(matchPercent);
    const matchVisual = showMatch ? getRouteMatchVisual(matchPercent!) : null;

    const polylineCoordinates = useMemo(() => {
      if (routeCoordinates.length >= 2) {
        return routeCoordinates;
      }
      return [
        { latitude: pickup.latitude, longitude: pickup.longitude },
        { latitude: dropoff.latitude, longitude: dropoff.longitude },
      ];
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
      <View style={styles.card}>
        <View style={styles.mapWrap}>
          {isGoogleMapsBypassed() ? (
            <MapBypassSurface
              style={styles.map}
              title="Commute map"
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
              <Marker
                coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
                pinColor={colors.primary}
                tracksViewChanges={false}
              />
              <Marker
                coordinate={{ latitude: dropoff.latitude, longitude: dropoff.longitude }}
                pinColor={colors.error}
                tracksViewChanges={false}
              />
              <Polyline
                coordinates={polylineCoordinates}
                strokeColor={colors.secondary}
                strokeWidth={4}
              />
            </MapView>
          )}
        </View>

        <View style={styles.statsCard} pointerEvents="none">
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>{COMMUTE_REVIEW_BOOKING_SCREEN.distanceLabel}</Text>
            <Text style={styles.statValue}>{distanceLabel}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={[styles.statCol, styles.statCenter]}>
            <Text style={styles.statLabel}>{COMMUTE_REVIEW_BOOKING_SCREEN.etaLabel}</Text>
            <Text style={styles.statValue}>{durationLabel}</Text>
          </View>
          {matchVisual ? (
            <>
              <View style={styles.statDivider} />
              <View style={[styles.statCol, styles.statEnd]}>
                <View
                  style={[
                    styles.matchBadge,
                    { backgroundColor: matchVisual.backgroundColor },
                  ]}
                >
                  <Ionicons name="navigate" size={14} color={matchVisual.iconColor} />
                  <Text style={[styles.matchBadgeText, { color: matchVisual.textColor }]}>
                    {COMMUTE_REVIEW_BOOKING_SCREEN.routeMatchLabel(matchPercent!)}
                  </Text>
                </View>
                <Text style={styles.matchCaption}>{matchCaption}</Text>
              </View>
            </>
          ) : null}
        </View>
      </View>
    );
  },
);

CommuteBookingMapHero.displayName = 'CommuteBookingMapHero';
