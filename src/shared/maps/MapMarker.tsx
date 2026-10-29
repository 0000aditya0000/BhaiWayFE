import React, { useMemo } from 'react';
import { Marker } from 'react-native-maps';

import type { BhaiWayMapMarker } from './map.types';
import { isValidMapCoordinate, pinColorForKind } from './map.utils';

export interface MapMarkerProps {
  marker: BhaiWayMapMarker;
  tracksViewChanges?: boolean;
}

export const MapMarker = React.memo(({ marker, tracksViewChanges = false }: MapMarkerProps) => {
  if (!isValidMapCoordinate(marker.coordinate)) {
    return null;
  }

  return (
    <Marker
      identifier={marker.id}
      coordinate={marker.coordinate}
      title={marker.title}
      description={marker.description}
      pinColor={marker.pinColor ?? pinColorForKind(marker.kind)}
      tracksViewChanges={tracksViewChanges}
    />
  );
});

MapMarker.displayName = 'MapMarker';

export interface MapMarkersProps {
  markers: readonly BhaiWayMapMarker[];
  tracksViewChanges?: boolean;
}

export const MapMarkers = React.memo(({ markers, tracksViewChanges }: MapMarkersProps) => {
  const valid = useMemo(
    () => markers.filter((marker) => isValidMapCoordinate(marker.coordinate)),
    [markers],
  );

  return (
    <>
      {valid.map((marker) => (
        <MapMarker key={marker.id} marker={marker} tracksViewChanges={tracksViewChanges} />
      ))}
    </>
  );
});

MapMarkers.displayName = 'MapMarkers';
