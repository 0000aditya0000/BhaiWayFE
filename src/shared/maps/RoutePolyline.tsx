import React, { useMemo } from 'react';
import { Polyline } from 'react-native-maps';

import type { MapLatLng } from './map.types';
import { isValidMapCoordinate } from './map.utils';

export interface RoutePolylineProps {
  coordinates: readonly MapLatLng[];
  strokeColor?: string;
  strokeWidth?: number;
  zIndex?: number;
  tappable?: boolean;
  onPress?: () => void;
}

export const RoutePolyline = React.memo(
  ({
    coordinates,
    strokeColor = '#374BB1',
    strokeWidth = 4,
    zIndex,
    tappable = false,
    onPress,
  }: RoutePolylineProps) => {
    const valid = useMemo(
      () => coordinates.filter(isValidMapCoordinate),
      [coordinates],
    );

    if (valid.length < 2) {
      return null;
    }

    return (
      <Polyline
        coordinates={[...valid]}
        strokeColor={strokeColor}
        strokeWidth={strokeWidth}
        zIndex={zIndex}
        tappable={tappable}
        onPress={onPress}
      />
    );
  },
);

RoutePolyline.displayName = 'RoutePolyline';
