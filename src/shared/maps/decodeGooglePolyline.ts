import type { MapLatLng } from './map.types';

/**
 * Decode a Google encoded polyline into WGS84 coordinates.
 * Does not invent missing geometry — callers must handle empty results.
 */
export const decodeGooglePolyline = (encoded: string): MapLatLng[] => {
  const input = encoded.trim();
  if (!input) {
    return [];
  }

  const coordinates: MapLatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < input.length) {
    let shift = 0;
    let result = 0;
    let byte = 0;
    do {
      byte = input.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;
    do {
      byte = input.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return coordinates;
};
