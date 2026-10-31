import * as Location from 'expo-location';

import { env } from '@/config';
import type { MapCoordinate, PlacesAutocompletePrediction, SelectedDestination } from '../types';
import { nominatimBoundingBoxToBoundary, viewportToBoundary } from '../utils';
import {
  isPlacesCancelled,
  PlacesError,
} from './places.errors';
import {
  cacheGooglePlace,
  fetchGoogleNearbyPlaces,
  getCachedGooglePlace,
  resolveGooglePlaceDetails,
  searchGooglePlaces,
} from './places.google';
import type { SearchPlacesOptions, PlacesConfigStatus } from './places.options';

interface PlacesAutocompleteResponse {
  status: string;
  error_message?: string;
  predictions?: Array<{
    place_id: string;
    description: string;
    structured_formatting?: {
      main_text?: string;
      secondary_text?: string;
    };
  }>;
}

interface PlacesDetailsResponse {
  status: string;
  error_message?: string;
  result?: {
    name?: string;
    formatted_address?: string;
    geometry?: {
      location?: {
        lat: number;
        lng: number;
      };
      viewport?: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
  };
}

interface GeocodeResponse {
  status: string;
  error_message?: string;
  results?: Array<{
    formatted_address?: string;
    types?: string[];
    geometry?: {
      location_type?: string;
      location?: {
        lat: number;
        lng: number;
      };
      viewport?: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
      bounds?: {
        northeast: { lat: number; lng: number };
        southwest: { lat: number; lng: number };
      };
    };
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
}

interface NearbySearchResponse {
  status: string;
  error_message?: string;
  results?: Array<{
    place_id: string;
    name?: string;
    vicinity?: string;
  }>;
}

interface PhotonResponse {
  features?: Array<{
    geometry?: {
      coordinates?: [number, number];
    };
    properties?: {
      osm_id?: number;
      osm_type?: string;
      name?: string;
      housenumber?: string;
      street?: string;
      locality?: string;
      district?: string;
      city?: string;
      county?: string;
      state?: string;
      country?: string;
      postcode?: string;
      type?: string;
      extent?: [number, number, number, number];
    };
  }>;
}

interface NominatimSearchResult {
  place_id?: number;
  lat: string;
  lon: string;
  display_name?: string;
  name?: string;
  class?: string;
  type?: string;
  importance?: number;
  boundingbox?: [string, string, string, string];
  address?: {
    name?: string;
    amenity?: string;
    building?: string;
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    quarter?: string;
    residential?: string;
    suburb?: string;
    city_district?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state_district?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  geojson?: {
    type: string;
    coordinates?: unknown;
  };
}

interface NominatimReverseResult {
  display_name?: string;
  name?: string;
  address?: NominatimSearchResult['address'];
  boundingbox?: [string, string, string, string];
}

const MOCK_PLACES: readonly SelectedDestination[] = [
  {
    placeName: 'Connaught Place',
    address: 'Connaught Place, New Delhi, Delhi 110001, India',
    latitude: 28.6315,
    longitude: 77.2167,
  },
  {
    placeName: 'Electronic City',
    address: 'Electronic City, Bengaluru, Karnataka, India',
    latitude: 12.8399,
    longitude: 77.677,
  },
  {
    placeName: 'Mysuru',
    address: 'Mysuru, Karnataka, India',
    latitude: 12.2958,
    longitude: 76.6394,
  },
  {
    placeName: 'Indiranagar',
    address: 'Indiranagar, Bengaluru, Karnataka, India',
    latitude: 12.9784,
    longitude: 77.6408,
  },
  {
    placeName: 'Hinjewadi',
    address: 'Hinjewadi, Pune, Maharashtra, India',
    latitude: 18.5912,
    longitude: 73.7389,
  },
  {
    placeName: 'Bandra West',
    address: 'Bandra West, Mumbai, Maharashtra, India',
    latitude: 19.0596,
    longitude: 72.8295,
  },
];

const OSM_USER_AGENT = 'BhaiWay/1.0 (carpool-app; contact@bhaiway.app)';
const SEARCH_RESULT_LIMIT = 20;

/** Codes / shop names like "E20RWCM" — prefer device/Google text search over OSM. */
const isUniquePlaceToken = (query: string): boolean => {
  const trimmed = query.trim();
  if (trimmed.length < 4) {
    return false;
  }
  if (!/\s/.test(trimmed) && /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(trimmed)) {
    return true;
  }
  return /(?:^|\s)[A-Za-z]*\d[A-Za-z0-9]{3,}(?:\s|$)/.test(trimmed);
};

const isIndiaAddress = (address: string, country?: string | null): boolean => {
  const haystack = `${country ?? ''} ${address}`.toLowerCase();
  return (
    haystack.includes('india') ||
    haystack.includes(', in') ||
    haystack.endsWith(' in') ||
    /\b(delhi|noida|gurgaon|gurugram|mumbai|bengaluru|bangalore|hyderabad|chennai|pune|kolkata|uttar pradesh|maharashtra|karnataka)\b/.test(
      haystack,
    )
  );
};

export type { SearchPlacesOptions, PlacesConfigStatus } from './places.options';

export const getPlacesConfigStatus = (): PlacesConfigStatus => {
  const bypassed = env.bypassGoogleMaps;
  const placesKeyConfigured = !bypassed && env.googlePlacesApiKey.trim().length > 0;
  const mapsKeyConfigured = !bypassed && env.googleMapsApiKey.trim().length > 0;
  return {
    hasApiKey: placesKeyConfigured,
    placesKeyConfigured,
    mapsKeyConfigured,
    keySourceHint: bypassed
      ? 'Google Maps/Places bypassed (OSM search + map placeholder). Set EXPO_PUBLIC_BYPASS_GOOGLE_MAPS=false to use Google.'
      : placesKeyConfigured
        ? 'API key loaded from env / app config'
        : 'No key found. Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to .env and restart with `npx expo start -c`.',
    requiredApis: [
      'Places API (New)',
      'Places API',
      'Geocoding API',
      'Maps SDK for Android',
      'Maps SDK for iOS',
    ],
  };
};

const hasPlacesKey = (): boolean =>
  !env.bypassGoogleMaps && env.googlePlacesApiKey.trim().length > 0;

const levelsFromLabeledAddress = (
  placeName: string,
  address: string,
): SelectedDestination['addressLevels'] => {
  const parts = address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  return {
    precise: placeName,
    area: placeName,
    city: parts.find((part) => part !== placeName) ?? parts[1],
    district: parts.length >= 3 ? parts[parts.length - 3] : parts[2],
  };
};

const uniqueParts = (parts: Array<string | undefined | null>): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    const trimmed = part?.trim();
    if (!trimmed) {
      continue;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(trimmed);
  }
  return result;
};

const encodeOsmPlaceId = (
  latitude: number,
  longitude: number,
  extent?: [number, number, number, number],
): string =>
  extent
    ? `osm:${latitude}:${longitude}:${extent.join(',')}`
    : `osm:${latitude}:${longitude}`;

const nearestMockPlace = (coordinate: MapCoordinate): SelectedDestination => {
  let best = MOCK_PLACES[0];
  let bestDistance = Number.POSITIVE_INFINITY;

  MOCK_PLACES.forEach((place) => {
    const distance =
      Math.abs(place.latitude - coordinate.latitude) +
      Math.abs(place.longitude - coordinate.longitude);
    if (distance < bestDistance) {
      best = place;
      bestDistance = distance;
    }
  });

  return {
    placeName: best.placeName,
    address: best.address,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    addressLevels: levelsFromLabeledAddress(best.placeName, best.address),
  };
};

const filterMockPredictions = (query: string): PlacesAutocompletePrediction[] => {
  const normalized = query.trim().toLowerCase();
  return MOCK_PLACES.filter(
    (place) =>
      place.placeName.toLowerCase().includes(normalized) ||
      place.address.toLowerCase().includes(normalized),
  ).map((place) => ({
    placeId: `mock:${place.placeName}`,
    placeName: place.placeName,
    address: place.address,
  }));
};

const buildAddressFromExpo = (
  place: Location.LocationGeocodedAddress,
  coordinate: MapCoordinate,
): SelectedDestination => {
  const precise = [place.name, place.street].filter(Boolean).join(', ') || undefined;
  const area = place.district || place.subregion || undefined;
  const city = place.city || undefined;
  const district = place.subregion || place.region || undefined;

  const placeName = precise || area || city || district || 'Selected location';

  const address = [place.name, place.street, place.city, place.region, place.postalCode, place.country]
    .filter(Boolean)
    .join(', ');

  return {
    placeName,
    address: address || `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    addressLevels: {
      precise,
      area,
      city,
      district,
    },
  };
};

const photonPlaceName = (props: NonNullable<PhotonResponse['features']>[number]['properties']): string => {
  if (!props) {
    return '';
  }
  const streetLine = [props.housenumber, props.street].filter(Boolean).join(' ').trim();
  return (
    props.name ||
    streetLine ||
    props.locality ||
    props.district ||
    props.city ||
    props.county ||
    props.state ||
    ''
  );
};

const dedupePredictions = (
  predictions: PlacesAutocompletePrediction[],
  limit = SEARCH_RESULT_LIMIT,
): PlacesAutocompletePrediction[] => {
  const seen = new Set<string>();
  const result: PlacesAutocompletePrediction[] = [];

  for (const prediction of predictions) {
    const key = `${prediction.placeName.trim().toLowerCase()}|${prediction.address
      .trim()
      .toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(prediction);
    if (result.length >= limit) {
      break;
    }
  }

  return result;
};

/**
 * Photon (OpenStreetMap) autocomplete — fast, keyless.
 * Runs both a biased and unbiased query so distant Indian cities still surface
 * even when the map is centered on Delhi / the user's GPS.
 */
const searchPhotonPlaces = async (
  query: string,
  location?: MapCoordinate | null,
): Promise<PlacesAutocompletePrediction[]> => {
  const run = async (biased: boolean): Promise<PlacesAutocompletePrediction[]> => {
    const params = new URLSearchParams({
      q: query,
      limit: '20',
      lang: 'en',
    });

    if (biased && location) {
      params.set('lat', String(location.latitude));
      params.set('lon', String(location.longitude));
      params.set('location_bias_scale', '0.4');
    }

    const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, {
      headers: { Accept: 'application/json', 'User-Agent': OSM_USER_AGENT },
    });

    if (!response.ok) {
      throw new Error(`Photon search failed (${response.status})`);
    }

    const data = (await response.json()) as PhotonResponse;
    const predictions: PlacesAutocompletePrediction[] = [];

    for (const feature of data.features ?? []) {
      const coordinates = feature.geometry?.coordinates;
      const props = feature.properties ?? {};
      if (!coordinates) {
        continue;
      }

      const [longitude, latitude] = coordinates;
      const placeName = photonPlaceName(props);
      if (!placeName) {
        continue;
      }

      const address = uniqueParts([
        placeName,
        props.street && props.name ? props.street : undefined,
        props.locality,
        props.district,
        props.city,
        props.county,
        props.state,
        props.postcode,
        props.country,
      ]).join(', ');

      predictions.push({
        placeId: encodeOsmPlaceId(latitude, longitude, props.extent),
        placeName,
        address,
      });
    }

    // Photon has no country filter — drop non-India hits so US/EU noise never wins.
    return predictions.filter((prediction) => isIndiaAddress(prediction.address));
  };

  const biased = location ? await run(true).catch(() => []) : [];
  const unbiased = await run(false).catch(() => []);

  // Prefer nearby matches first, then fill with country-wide hits.
  return dedupePredictions([...biased, ...unbiased]);
};

/**
 * Nominatim search — broader coverage for Indian localities / sectors / landmarks.
 */
const searchNominatimPlaces = async (
  query: string,
  location?: MapCoordinate | null,
): Promise<PlacesAutocompletePrediction[]> => {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: String(SEARCH_RESULT_LIMIT),
    countrycodes: 'in',
  });

  if (location) {
    // Soft viewbox (~1.5° around current map center) without strictbounds so
    // far cities still appear when they match the query.
    const delta = 1.5;
    params.set(
      'viewbox',
      `${location.longitude - delta},${location.latitude + delta},${location.longitude + delta},${location.latitude - delta}`,
    );
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: 'application/json',
        'User-Agent': OSM_USER_AGENT,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Nominatim search failed (${response.status})`);
  }

  const data = (await response.json()) as NominatimSearchResult[];
  return (data ?? []).map((result) => {
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    const addressParts = result.address;
    const placeName =
      result.name ||
      addressParts?.amenity ||
      addressParts?.building ||
      addressParts?.road ||
      addressParts?.neighbourhood ||
      addressParts?.suburb ||
      addressParts?.city_district ||
      addressParts?.city ||
      addressParts?.town ||
      addressParts?.village ||
      result.display_name?.split(',')[0]?.trim() ||
      'Selected location';

    const address =
      result.display_name ||
      uniqueParts([
        placeName,
        addressParts?.road,
        addressParts?.suburb,
        addressParts?.city || addressParts?.town || addressParts?.village,
        addressParts?.state,
        addressParts?.postcode,
        addressParts?.country,
      ]).join(', ');

    return {
      placeId: encodeOsmPlaceId(latitude, longitude),
      placeName,
      address,
    };
  });
};

/**
 * Device geocoder fallback (Apple / Google via expo-location).
 * On Android this often uses Google's network geocoder — same data as Maps for many POIs.
 */
const searchExpoPlaces = async (query: string): Promise<PlacesAutocompletePrediction[]> => {
  try {
    const results = await Location.geocodeAsync(query);
    const predictions: PlacesAutocompletePrediction[] = [];
    const uniqueToken = isUniquePlaceToken(query);

    for (const result of results.slice(0, 6)) {
      if (!Number.isFinite(result.latitude) || !Number.isFinite(result.longitude)) {
        continue;
      }

      let placeName = query;
      let address = query;

      try {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: result.latitude,
          longitude: result.longitude,
        });
        if (reverse[0]) {
          const built = buildAddressFromExpo(reverse[0], {
            latitude: result.latitude,
            longitude: result.longitude,
          });
          // Keep the typed POI/code as the title when Maps resolves a business token.
          placeName = uniqueToken ? query : built.placeName;
          address = built.address.includes(query) ? built.address : `${query}, ${built.address}`;
        }
      } catch {
        // Keep the typed query as the label.
      }

      predictions.push({
        placeId: encodeOsmPlaceId(result.latitude, result.longitude),
        placeName,
        address,
      });
    }

    return predictions;
  } catch {
    return [];
  }
};

const searchOsmProviders = async (
  query: string,
  location?: MapCoordinate | null,
): Promise<PlacesAutocompletePrediction[]> => {
  // Android Google Geocoder often resolves Maps POIs (e.g. "E20RWCM Park Hut")
  // without a Places API key — try it first for unique tokens.
  if (isUniquePlaceToken(query)) {
    const deviceResults = await searchExpoPlaces(query);
    const indiaDevice = deviceResults.filter((item) => isIndiaAddress(item.address, 'India'));
    if (indiaDevice.length > 0) {
      return dedupePredictions(indiaDevice);
    }
    if (deviceResults.length > 0) {
      return dedupePredictions(deviceResults);
    }
  }

  const [photon, nominatim] = await Promise.all([
    searchPhotonPlaces(query, location).catch(() => [] as PlacesAutocompletePrediction[]),
    searchNominatimPlaces(query, location).catch(() => [] as PlacesAutocompletePrediction[]),
  ]);

  let merged = dedupePredictions([...photon, ...nominatim]);

  if (merged.length === 0) {
    merged = dedupePredictions(await searchExpoPlaces(query));
  }

  // Second Nominatim pass without viewbox if the first was too location-narrow.
  if (merged.length < 3 && location) {
    const broader = await searchNominatimPlaces(query, null).catch(
      () => [] as PlacesAutocompletePrediction[],
    );
    merged = dedupePredictions([...merged, ...broader]);
  }

  return merged;
};


export const searchPlaces = async (
  query: string,
  location?: MapCoordinate | null,
  options?: SearchPlacesOptions,
): Promise<PlacesAutocompletePrediction[]> => {
  const trimmed = query.trim();
  if (trimmed.length < 1) {
    return [];
  }

  if (hasPlacesKey()) {
    try {
      const googleResults = await searchGooglePlaces(trimmed, location, options);
      if (options?.signal?.aborted) {
        return [];
      }
      if (googleResults.length > 0) {
        return googleResults;
      }
      // Google returned zero — still try device/OSM for rare gaps.
    } catch (error) {
      if (options?.signal?.aborted || isPlacesCancelled(error)) {
        return [];
      }
      if (env.enableLogging) {
        console.warn('[places] Google search failed, falling back to OSM', error);
      }
      if (
        error instanceof PlacesError &&
        (error.code === 'INVALID_KEY' || error.code === 'NO_KEY' || error.code === 'DENIED')
      ) {
        throw error;
      }
    }
  }

  if (trimmed.length < 2) {
    return [];
  }

  const osmResults = await searchOsmProviders(trimmed, location);
  if (osmResults.length > 0) {
    return osmResults;
  }

  if (env.useMocks) {
    return filterMockPredictions(trimmed);
  }

  return [];
};

/** Nearby points of interest around a coordinate, for the empty-search suggestion list. */
export const fetchNearbyPlaces = async (
  coordinate: MapCoordinate,
  signal?: AbortSignal,
): Promise<PlacesAutocompletePrediction[]> => {
  if (hasPlacesKey()) {
    const googleNearby = await fetchGoogleNearbyPlaces(coordinate, signal);
    if (googleNearby.length > 0) {
      return googleNearby;
    }
  }

  try {
    const places = await Location.reverseGeocodeAsync(coordinate);
    const label =
      places[0]?.city ||
      places[0]?.district ||
      places[0]?.subregion ||
      places[0]?.name ||
      places[0]?.region;
    if (label) {
      const nearby = await searchNominatimPlaces(label, coordinate);
      if (nearby.length > 0) {
        return nearby;
      }
    }
  } catch {
    // Fall through.
  }

  // No real nearby data — keep the suggestion list honest instead of showing mock cities.
  return [];
};

const parseOsmExtent = (extentCsv: string | undefined): MapCoordinate[] | undefined => {
  if (!extentCsv) {
    return undefined;
  }
  const parts = extentCsv.split(',').map(Number);
  if (parts.length !== 4 || parts.some((value) => !Number.isFinite(value))) {
    return undefined;
  }
  const [minLon, maxLat, maxLon, minLat] = parts;
  return viewportToBoundary({
    northeast: { latitude: maxLat, longitude: maxLon },
    southwest: { latitude: minLat, longitude: minLon },
  });
};

export const resolvePlaceDetails = async (
  prediction: PlacesAutocompletePrediction,
): Promise<SelectedDestination> => {
  if (prediction.placeId.startsWith('recent:')) {
    const [, lat, lon] = prediction.placeId.split(':');
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      // Keep the exact recent pick — do not replace with a Nominatim area polygon.
      return {
        placeName: prediction.placeName,
        address: prediction.address,
        latitude,
        longitude,
        addressLevels: levelsFromLabeledAddress(prediction.placeName, prediction.address),
      };
    }
  }

  if (prediction.placeId.startsWith('osm:')) {
    const [, lat, lon, extentCsv] = prediction.placeId.split(':');
    const latitude = Number(lat);
    const longitude = Number(lon);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      // Prefer the extent baked into the prediction id; avoid name-based Nominatim
      // lookups that can frame the wrong neighbourhood and overwrite the pick.
      return {
        placeName: prediction.placeName,
        address: prediction.address,
        latitude,
        longitude,
        boundary: parseOsmExtent(extentCsv),
        addressLevels: levelsFromLabeledAddress(prediction.placeName, prediction.address),
      };
    }

    throw new Error('Unable to resolve the selected place.');
  }

  if (prediction.placeId.startsWith('mock:')) {
    const mock = MOCK_PLACES.find((place) => place.placeName === prediction.placeName);
    if (mock) {
      return { ...mock };
    }
    return {
      placeName: prediction.placeName,
      address: prediction.address,
      latitude: 0,
      longitude: 0,
    };
  }

  // Autocomplete query prediction → run Text Search and take the top hit.
  if (prediction.placeId.startsWith('gquery:')) {
    const queryText = decodeURIComponent(prediction.placeId.slice('gquery:'.length));
    const results = await searchGooglePlaces(queryText || prediction.placeName);
    const first = results.find((item) => !item.placeId.startsWith('gquery:'));
    if (!first) {
      throw new PlacesError('EMPTY', 'Unable to resolve the selected search.');
    }
    return resolvePlaceDetails(first);
  }

  const cached = getCachedGooglePlace(prediction.placeId);
  if (cached) {
    return cached;
  }

  if (!hasPlacesKey()) {
    const osmFallback = await searchOsmProviders(prediction.placeName || prediction.address);
    const first = osmFallback[0];
    if (first?.placeId.startsWith('osm:')) {
      return resolvePlaceDetails(first);
    }
    if (env.bypassGoogleMaps) {
      throw new PlacesError(
        'EMPTY',
        'Unable to resolve that place without Google Maps. Try a nearby city or landmark name.',
      );
    }
    throw new PlacesError(
      'NO_KEY',
      'Google Places API key is not configured. Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to .env.',
    );
  }

  const googleDetails = await resolveGooglePlaceDetails(prediction.placeId, {
    placeName: prediction.placeName,
    address: prediction.address,
  });
  if (googleDetails) {
    // Keep Google's coordinates/name; Nominatim area polygons were overwriting picks.
    return googleDetails;
  }

  const params = new URLSearchParams({
    place_id: prediction.placeId,
    fields: 'name,formatted_address,geometry',
    key: env.googlePlacesApiKey,
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`,
  );
  const data = (await response.json()) as PlacesDetailsResponse;

  if (data.status !== 'OK' || !data.result?.geometry?.location) {
    throw new PlacesError(
      'EMPTY',
      data.error_message ?? `Place details failed (${data.status})`,
    );
  }

  const placeName = data.result.name ?? prediction.placeName;
  const address = data.result.formatted_address ?? prediction.address;
  const viewport = data.result.geometry.viewport;
  const boundary = viewport
    ? viewportToBoundary({
        northeast: { latitude: viewport.northeast.lat, longitude: viewport.northeast.lng },
        southwest: { latitude: viewport.southwest.lat, longitude: viewport.southwest.lng },
      })
    : undefined;

  const destination: SelectedDestination = {
    placeName,
    address,
    latitude: data.result.geometry.location.lat,
    longitude: data.result.geometry.location.lng,
    boundary,
    addressLevels: levelsFromLabeledAddress(placeName, address),
  };
  cacheGooglePlace(prediction.placeId, destination);
  return destination;
};

const reverseGeocodeWithNominatim = async (
  coordinate: MapCoordinate,
): Promise<SelectedDestination | null> => {
  try {
    const params = new URLSearchParams({
      lat: String(coordinate.latitude),
      lon: String(coordinate.longitude),
      format: 'json',
      addressdetails: '1',
      zoom: '18',
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      { headers: { Accept: 'application/json', 'User-Agent': OSM_USER_AGENT } },
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as NominatimReverseResult;
    if (!data.display_name && !data.name) {
      return null;
    }

    const addressParts = data.address;
    const precise =
      addressParts?.amenity ||
      addressParts?.building ||
      [addressParts?.house_number, addressParts?.road].filter(Boolean).join(' ') ||
      undefined;
    // Prefer the tightest local area (sector / neighbourhood) over a broader suburb.
    const sector =
      addressParts?.neighbourhood ||
      addressParts?.quarter ||
      addressParts?.residential ||
      undefined;
    const suburb =
      addressParts?.suburb ||
      addressParts?.city_district ||
      undefined;
    const area = sector || suburb || undefined;
    const city =
      addressParts?.city || addressParts?.town || addressParts?.village || undefined;
    const district = addressParts?.county || addressParts?.state_district || addressParts?.state || undefined;

    const placeName =
      sector && suburb && sector.toLowerCase() !== suburb.toLowerCase()
        ? `${sector}, ${suburb}`
        : data.name ||
          precise ||
          area ||
          city ||
          data.display_name?.split(',')[0]?.trim() ||
          'Selected location';

    return {
      placeName,
      address: data.display_name || placeName,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      boundary: data.boundingbox
        ? nominatimBoundingBoxToBoundary(data.boundingbox)
        : undefined,
      addressLevels: {
        precise: precise || sector || undefined,
        area: suburb || sector || undefined,
        city: city || undefined,
        district: district || undefined,
      },
    };
  } catch {
    return null;
  }
};

const GOOGLE_LOCATION_TYPE_RANK: Record<string, number> = {
  ROOFTOP: 0,
  RANGE_INTERPOLATED: 1,
  GEOMETRIC_CENTER: 2,
  APPROXIMATE: 3,
};

const GOOGLE_RESULT_TYPE_RANK = [
  'street_address',
  'premise',
  'subpremise',
  'route',
  'neighborhood',
  'sublocality_level_3',
  'sublocality_level_2',
  'sublocality_level_1',
  'sublocality',
  'locality',
] as const;

type GoogleGeocodeResult = NonNullable<GeocodeResponse['results']>[number];

const pickBestGoogleGeocodeResult = (
  results: NonNullable<GeocodeResponse['results']>,
): GoogleGeocodeResult => {
  const scored = results.map((result, index) => {
    const locationType = result.geometry?.location_type ?? 'APPROXIMATE';
    const types = result.types ?? [];
    const typeRankIndex = GOOGLE_RESULT_TYPE_RANK.findIndex((type) => types.includes(type));
    return {
      result,
      index,
      locationRank: GOOGLE_LOCATION_TYPE_RANK[locationType] ?? 9,
      typeRank: typeRankIndex === -1 ? 80 : typeRankIndex,
    };
  });

  scored.sort(
    (a, b) =>
      a.locationRank - b.locationRank || a.typeRank - b.typeRank || a.index - b.index,
  );

  return scored[0]?.result ?? results[0];
};

const buildDestinationFromGoogleGeocode = (
  result: GoogleGeocodeResult,
  coordinate: MapCoordinate,
): SelectedDestination => {
  const components = result.address_components ?? [];
  const findComponent = (...types: string[]) =>
    components.find((component) => types.some((type) => component.types.includes(type)))
      ?.long_name;

  // Do not match bare `political` — it appears on almost every component and
  // often pulls a neighbouring locality (e.g. Vasundhara instead of Indirapuram).
  const premise = findComponent('street_address', 'premise', 'subpremise');
  const route = findComponent('route');
  const sector = findComponent(
    'sublocality_level_3',
    'sublocality_level_2',
    'neighborhood',
  );
  const sublocality = findComponent('sublocality_level_1', 'sublocality');
  const locality = findComponent('locality');
  const district = findComponent(
    'administrative_area_level_3',
    'administrative_area_level_2',
  );

  const streetLine = [premise, route].filter(Boolean).join(', ') || undefined;
  const precise = streetLine || sector || undefined;
  // Keep sector in precise and sublocality in area so labels can show
  // "Shakti Khand 1, Indirapuram" instead of a neighbouring locality.
  const area = sublocality || sector || undefined;
  const city = locality || district || undefined;

  const placeName =
    sector && sublocality && sector.toLowerCase() !== sublocality.toLowerCase()
      ? `${sector}, ${sublocality}`
      : precise ||
        (sublocality && locality && sublocality.toLowerCase() !== locality.toLowerCase()
          ? `${sublocality}, ${locality}`
          : undefined) ||
        area ||
        city ||
        result.formatted_address?.split(',')[0]?.trim() ||
        'Selected location';

  const viewport = result.geometry?.viewport ?? result.geometry?.bounds;
  const boundary = viewport
    ? viewportToBoundary({
        northeast: { latitude: viewport.northeast.lat, longitude: viewport.northeast.lng },
        southwest: { latitude: viewport.southwest.lat, longitude: viewport.southwest.lng },
      })
    : undefined;

  return {
    placeName,
    address: result.formatted_address ?? placeName,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    boundary,
    addressLevels: {
      precise: precise || undefined,
      area: area || undefined,
      city: city || undefined,
      district: district || undefined,
    },
  };
};

export const reverseGeocodeCoordinate = async (
  coordinate: MapCoordinate,
): Promise<SelectedDestination> => {
  if (hasPlacesKey()) {
    try {
      const params = new URLSearchParams({
        latlng: `${coordinate.latitude},${coordinate.longitude}`,
        key: env.googlePlacesApiKey,
        language: 'en',
      });
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`,
      );
      const data = (await response.json()) as GeocodeResponse;

      if (data.status === 'OK' && data.results?.length) {
        const result = pickBestGoogleGeocodeResult(data.results);
        if (result) {
          return buildDestinationFromGoogleGeocode(result, coordinate);
        }
      }
    } catch {
      // Fall through.
    }
  }

  const nominatim = await reverseGeocodeWithNominatim(coordinate);
  if (nominatim) {
    return nominatim;
  }

  try {
    const places = await Location.reverseGeocodeAsync(coordinate);
    if (places[0]) {
      return buildAddressFromExpo(places[0], coordinate);
    }
  } catch {
    // Fall through.
  }

  if (env.useMocks) {
    return nearestMockPlace(coordinate);
  }

  return {
    placeName: 'Selected location',
    address: `${coordinate.latitude.toFixed(5)}, ${coordinate.longitude.toFixed(5)}`,
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
  };
};
