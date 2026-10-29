import type { Region } from 'react-native-maps';

import type { MapLatLng, MapMarkerKind } from './map.types';

/** Camera-only fallback when GPS is unavailable. Never use as ride pickup/dropoff. */
export const MAP_CAMERA_FALLBACK: MapLatLng = {
  latitude: 20.5937,
  longitude: 78.9629,
};

export const DEFAULT_MAP_DELTA = {
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
} as const;

export const isValidMapCoordinate = (
  value?: Partial<MapLatLng> | null,
): value is MapLatLng => {
  if (!value) {
    return false;
  }
  const { latitude, longitude } = value;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return false;
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }
  if (latitude === 0 && longitude === 0) {
    return false;
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return false;
  }
  return true;
};

export const parseMapCoordinate = (
  latitude?: number | string | null,
  longitude?: number | string | null,
): MapLatLng | null => {
  const lat = typeof latitude === 'string' ? Number(latitude) : latitude;
  const lng = typeof longitude === 'string' ? Number(longitude) : longitude;
  if (!isValidMapCoordinate({ latitude: lat ?? NaN, longitude: lng ?? NaN })) {
    return null;
  }
  return { latitude: lat as number, longitude: lng as number };
};

export const buildRegionFromCoordinates = (
  coordinates: readonly MapLatLng[],
  minDelta = 0.04,
  paddingFactor = 1.6,
): Region => {
  const valid = coordinates.filter(isValidMapCoordinate);
  if (valid.length === 0) {
    return {
      ...MAP_CAMERA_FALLBACK,
      ...DEFAULT_MAP_DELTA,
    };
  }
  if (valid.length === 1) {
    return {
      latitude: valid[0].latitude,
      longitude: valid[0].longitude,
      ...DEFAULT_MAP_DELTA,
    };
  }

  const lats = valid.map((c) => c.latitude);
  const lngs = valid.map((c) => c.longitude);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: Math.max((maxLat - minLat) * paddingFactor, minDelta),
    longitudeDelta: Math.max((maxLng - minLng) * paddingFactor, minDelta),
  };
};

export const haversineDistanceKm = (a: MapLatLng, b: MapLatLng): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** Initial bearing in degrees (0 = north) from point A to B — for map marker rotation. */
export const bearingDegrees = (from: MapLatLng, to: MapLatLng): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLng = toRad(to.longitude - from.longitude);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
};

export const formatDistanceKmLabel = (km: number): string => {
  if (!Number.isFinite(km) || km < 0) {
    return '';
  }
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(km < 10 ? 1 : 0)} km`;
};

export const estimateDurationMinutes = (distanceKm: number, avgSpeedKmh = 22): number => {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) {
    return 0;
  }
  return Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60));
};

/** Formats ETA for trip UI — e.g. `12 min` or `7 hr 18 min`. */
export const formatEtaLabel = (minutes: number | null | undefined): string => {
  if (minutes == null || !Number.isFinite(minutes) || minutes < 0) {
    return '—';
  }
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) {
    return `${Math.max(1, total)} min`;
  }
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins > 0 ? `${hours} hr ${mins} min` : `${hours} hr`;
};

export const pinColorForKind = (kind?: MapMarkerKind | string): string => {
  switch (kind) {
    case 'source':
    case 'pickup':
      return '#374BB1';
    case 'destination':
    case 'drop':
      return '#585E72';
    case 'driver':
      return '#0F9D58';
    case 'passenger':
      return '#F4B400';
    case 'user':
      return '#4285F4';
    default:
      return '#374BB1';
  }
};
