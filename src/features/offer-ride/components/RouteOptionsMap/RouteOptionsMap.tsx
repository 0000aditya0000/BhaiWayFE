import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import {
  BhaiWayMap,
  RoutePolyline,
  decodeGooglePolyline,
  isValidMapCoordinate,
  type BhaiWayMapMarker,
  type MapLatLng,
} from '@/shared/maps';
import { spacing } from '@/shared/theme';

import type { RouteOptionDto } from '../../api/routeOptions.types';
import { resolveRouteStroke } from '../../utils/routeSelection';

export interface RouteOptionsMapProps {
  source?: MapLatLng | null;
  destination?: MapLatLng | null;
  sourceLabel?: string;
  destinationLabel?: string;
  options: readonly RouteOptionDto[];
  selectedOptionId: string | null;
  loading?: boolean;
  errorMessage?: string | null;
  onSelectOption?: (option: RouteOptionDto) => void;
}

const decodeOption = (option: RouteOptionDto): MapLatLng[] => {
  try {
    return decodeGooglePolyline(option.polyline).filter(isValidMapCoordinate);
  } catch {
    return [];
  }
};

export const RouteOptionsMap = ({
  source,
  destination,
  sourceLabel = 'Pickup',
  destinationLabel = 'Drop-off',
  options,
  selectedOptionId,
  loading = false,
  errorMessage = null,
  onSelectOption,
}: RouteOptionsMapProps) => {
  const markers = useMemo((): BhaiWayMapMarker[] => {
    const next: BhaiWayMapMarker[] = [];
    if (isValidMapCoordinate(source)) {
      next.push({
        id: 'route-source',
        coordinate: source,
        kind: 'source',
        title: sourceLabel,
      });
    }
    if (isValidMapCoordinate(destination)) {
      next.push({
        id: 'route-destination',
        coordinate: destination,
        kind: 'destination',
        title: destinationLabel,
      });
    }
    return next;
  }, [destination, destinationLabel, source, sourceLabel]);

  const decoded = useMemo(
    () =>
      options.map((option) => ({
        option,
        coordinates: decodeOption(option),
      })),
    [options],
  );

  const fitCoordinates = useMemo(() => {
    const points: MapLatLng[] = [];
    decoded.forEach((item) => {
      points.push(...item.coordinates);
    });
    return points;
  }, [decoded]);

  const alternatives = decoded.filter((item) => item.option.optionId !== selectedOptionId);
  const selected = decoded.filter((item) => item.option.optionId === selectedOptionId);

  return (
    <BhaiWayMap
      style={styles.map}
      markers={markers}
      extraFitCoordinates={fitCoordinates}
      loading={loading}
      errorMessage={errorMessage}
      bypassTitle="Route preview"
      bypassSubtitle="Driving routes will appear on the map when Google Maps is available."
    >
      {alternatives.map((item) => {
        const stroke = resolveRouteStroke(item.option.optionId, selectedOptionId);
        return (
          <RoutePolyline
            key={item.option.optionId}
            coordinates={item.coordinates}
            strokeColor={stroke.strokeColor}
            strokeWidth={stroke.strokeWidth}
            zIndex={stroke.zIndex}
            tappable
            onPress={() => onSelectOption?.(item.option)}
          />
        );
      })}
      {selected.map((item) => {
        const stroke = resolveRouteStroke(item.option.optionId, selectedOptionId);
        return (
          <RoutePolyline
            key={item.option.optionId}
            coordinates={item.coordinates}
            strokeColor={stroke.strokeColor}
            strokeWidth={stroke.strokeWidth}
            zIndex={stroke.zIndex}
            tappable
            onPress={() => onSelectOption?.(item.option)}
          />
        );
      })}
    </BhaiWayMap>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
    minHeight: 220,
    marginHorizontal: spacing.screenHorizontal,
    borderRadius: 16,
    overflow: 'hidden',
  },
});
