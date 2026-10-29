import { env } from '@/config';
import { decodeGooglePolyline } from '@/shared/maps';

import type { MapCoordinate } from '../types';
import {
  formatDistanceLabel,
  formatDurationLabel,
  haversineDistanceKm,
} from '../utils';

export type RouteSource = 'google' | 'osrm' | 'straight';

export interface RouteGeometry {
  coordinates: MapCoordinate[];
  distanceKm: number;
  durationMinutes: number;
  distanceLabel: string;
  durationLabel: string;
  /** Which provider produced this estimate — prefer `google` for Maps-matching ETA. */
  source?: RouteSource;
}

interface OsrmRouteResponse {
  code?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: {
      coordinates?: Array<[number, number]>;
    };
  }>;
}

interface GoogleDirectionsResponse {
  status?: string;
  error_message?: string;
  routes?: Array<{
    overview_polyline?: { points?: string };
    legs?: Array<{
      distance?: { value?: number };
      duration?: { value?: number };
      duration_in_traffic?: { value?: number };
    }>;
  }>;
}

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';
/**
 * Urban India city average when Google Directions is unavailable.
 * 55 km/h was highway free-flow and made ETAs far too optimistic vs Google Maps.
 */
const FALLBACK_AVG_SPEED_KMH = 22;
/** OSRM is free-flow; bump duration toward typical Google Maps traffic ETA. */
const OSRM_TRAFFIC_FACTOR = 1.35;

const isValidCoordinate = (point: MapCoordinate): boolean =>
  Number.isFinite(point.latitude) &&
  Number.isFinite(point.longitude) &&
  !(point.latitude === 0 && point.longitude === 0);

const buildStraightRoute = (
  origin: MapCoordinate,
  destination: MapCoordinate,
): RouteGeometry => {
  const distanceKm = haversineDistanceKm(origin, destination);
  const durationMinutes = Math.max(1, (distanceKm / FALLBACK_AVG_SPEED_KMH) * 60);

  return {
    coordinates: [origin, destination],
    distanceKm,
    durationMinutes,
    distanceLabel: formatDistanceLabel(distanceKm),
    durationLabel: formatDurationLabel(durationMinutes),
    source: 'straight',
  };
};

const fetchGoogleDrivingRoute = async (
  origin: MapCoordinate,
  destination: MapCoordinate,
): Promise<RouteGeometry | null> => {
  const apiKey = env.googleMapsApiKey.trim() || env.googlePlacesApiKey.trim();
  if (!apiKey) {
    console.log('[Routing] Google Directions skipped — no Maps/Places API key');
    return null;
  }
  if (env.bypassGoogleMaps) {
    console.log('[Routing] Google Directions skipped — BYPASS_GOOGLE_MAPS=true');
    return null;
  }

  const params = new URLSearchParams({
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    mode: 'driving',
    units: 'metric',
    /**
     * Required for duration_in_traffic — matches Google Maps app ETA much closer.
     * `now` is accepted as the current unix time by Directions API.
     */
    departure_time: 'now',
    traffic_model: 'best_guess',
    key: apiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`,
  );
  if (!response.ok) {
    console.log('[Routing] Google Directions HTTP failed', { status: response.status });
    return null;
  }

  const data = (await response.json()) as GoogleDirectionsResponse;
  if (data.status !== 'OK' || !data.routes?.length) {
    console.log('[Routing] Google Directions not OK', {
      status: data.status ?? null,
      error: data.error_message ?? null,
      hint:
        data.status === 'REQUEST_DENIED'
          ? 'Enable Directions API for this key (Cloud Console). App-restricted Maps SDK keys often cannot call Directions REST.'
          : undefined,
    });
    return null;
  }

  const route = data.routes[0];
  const legs = route.legs ?? [];
  if (legs.length === 0) {
    return null;
  }

  let distanceMeters = 0;
  let durationSeconds = 0;
  for (const leg of legs) {
    distanceMeters += leg.distance?.value ?? 0;
    durationSeconds +=
      leg.duration_in_traffic?.value ?? leg.duration?.value ?? 0;
  }

  if (distanceMeters <= 0 || durationSeconds <= 0) {
    return null;
  }

  const encoded = route.overview_polyline?.points?.trim() ?? '';
  const coordinates = encoded ? decodeGooglePolyline(encoded) : [origin, destination];
  const distanceKm = distanceMeters / 1000;
  const durationMinutes = durationSeconds / 60;

  console.log('[Routing] Google Directions OK', {
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMinutes: Math.round(durationMinutes),
    usedTraffic: legs.some((leg) => leg.duration_in_traffic?.value != null),
  });

  return {
    coordinates: coordinates.length >= 2 ? coordinates : [origin, destination],
    distanceKm,
    durationMinutes,
    distanceLabel: formatDistanceLabel(distanceKm),
    durationLabel: formatDurationLabel(durationMinutes),
    source: 'google',
  };
};

const fetchOsrmDrivingRoute = async (
  origin: MapCoordinate,
  destination: MapCoordinate,
): Promise<RouteGeometry | null> => {
  const pathCoords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;
  const url = `${OSRM_BASE_URL}/${pathCoords}?overview=full&geometries=geojson&alternatives=false&steps=false`;

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as OsrmRouteResponse;
  const routes = data.routes ?? [];
  if (routes.length === 0) {
    return null;
  }

  const route = routes[0];
  const rawCoordinates = route?.geometry?.coordinates;
  if (!route || !rawCoordinates?.length) {
    return null;
  }

  const coordinates: MapCoordinate[] = rawCoordinates.map(([longitude, latitude]) => ({
    latitude,
    longitude,
  }));

  const distanceKm = route.distance / 1000;
  /** Free-flow OSRM duration is optimistic vs Google Maps with traffic. */
  const durationMinutes = (route.duration / 60) * OSRM_TRAFFIC_FACTOR;

  console.log('[Routing] OSRM fallback', {
    distanceKm: Number(distanceKm.toFixed(2)),
    durationMinutes: Math.round(durationMinutes),
  });

  return {
    coordinates,
    distanceKm,
    durationMinutes,
    distanceLabel: formatDistanceLabel(distanceKm),
    durationLabel: formatDurationLabel(durationMinutes),
    source: 'osrm',
  };
};

/**
 * Prefers Google Directions with live traffic (matches Google Maps ETA),
 * then OSRM (road geometry + traffic-adjusted duration), then urban straight-line estimate.
 */
export const fetchDrivingRoute = async (
  origin: MapCoordinate,
  destination: MapCoordinate,
): Promise<RouteGeometry> => {
  if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
    return buildStraightRoute(origin, destination);
  }

  try {
    const googleRoute = await fetchGoogleDrivingRoute(origin, destination);
    if (googleRoute) {
      return googleRoute;
    }
  } catch (error) {
    console.log('[Routing] Google Directions threw', error);
  }

  try {
    const osrmRoute = await fetchOsrmDrivingRoute(origin, destination);
    if (osrmRoute) {
      return osrmRoute;
    }
  } catch (error) {
    console.log('[Routing] OSRM threw', error);
  }

  return buildStraightRoute(origin, destination);
};
