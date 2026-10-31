import { env } from '@/config';
import type { MapCoordinate, PlacesAutocompletePrediction, SelectedDestination } from '../types';
import { viewportToBoundary } from '../utils';
import {
  cancelledPlacesError,
  isPlacesCancelled,
  mapFetchFailureToPlacesError,
  mapHttpStatusToPlacesError,
  PlacesError,
} from './places.errors';
import { createPlacesSessionToken } from './places.session';
import type { SearchPlacesOptions } from './places.options';

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

const SEARCH_RESULT_LIMIT = 20;
const LOCATION_BIAS_RADIUS_METERS = 250_000;
const REQUEST_TIMEOUT_MS = 12_000;

/** Codes / shop names like "E20RWCM" — Maps finds these via Text Search, not local bias. */
const isUniquePlaceToken = (query: string): boolean => {
  const trimmed = query.trim();
  if (trimmed.length < 4) {
    return false;
  }
  // No spaces: alphanumeric place codes / short business ids
  if (!/\s/.test(trimmed) && /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(trimmed)) {
    return true;
  }
  // Has a dense alphanumeric token (e.g. "E20RWCM Park Hut")
  return /(?:^|\s)[A-Za-z]*\d[A-Za-z0-9]{3,}(?:\s|$)/.test(trimmed);
};

const googlePlaceCache = new Map<string, SelectedDestination>();

export const getCachedGooglePlace = (placeId: string): SelectedDestination | undefined => {
  const cached = googlePlaceCache.get(placeId);
  return cached ? { ...cached } : undefined;
};

export const cacheGooglePlace = (placeId: string, destination: SelectedDestination): void => {
  if (!placeId) {
    return;
  }
  googlePlaceCache.set(placeId, destination);
};

export const normalizeGooglePlaceId = (value: string | undefined): string => {
  if (!value) {
    return '';
  }
  return value.startsWith('places/') ? value.slice('places/'.length) : value;
};

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

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  signal?: AbortSignal,
): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      throw cancelledPlacesError();
    }
    signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof PlacesError) {
      throw error;
    }
    if (signal?.aborted) {
      throw cancelledPlacesError();
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new PlacesError('TIMEOUT', 'Search timed out. Please try again.');
    }
    throw mapFetchFailureToPlacesError(error);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onAbort);
  }
};

type GoogleTextPlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude?: number; longitude?: number };
  viewport?: {
    low?: { latitude?: number; longitude?: number };
    high?: { latitude?: number; longitude?: number };
  };
};

const mapTextSearchPlaces = (
  places: GoogleTextPlace[] | undefined,
  query: string,
): PlacesAutocompletePrediction[] =>
  (places ?? [])
    .map((place) => {
      const placeId = normalizeGooglePlaceId(place.id);
      const placeName = place.displayName?.text ?? query;
      const address = place.formattedAddress ?? place.shortFormattedAddress ?? placeName;
      const latitude = place.location?.latitude;
      const longitude = place.location?.longitude;

      if (placeId && Number.isFinite(latitude) && Number.isFinite(longitude)) {
        const viewport = place.viewport;
        const boundary =
          viewport?.high && viewport?.low
            ? viewportToBoundary({
                northeast: {
                  latitude: viewport.high.latitude ?? latitude!,
                  longitude: viewport.high.longitude ?? longitude!,
                },
                southwest: {
                  latitude: viewport.low.latitude ?? latitude!,
                  longitude: viewport.low.longitude ?? longitude!,
                },
              })
            : undefined;

        cacheGooglePlace(placeId, {
          placeName,
          address,
          latitude: latitude!,
          longitude: longitude!,
          boundary,
          addressLevels: levelsFromLabeledAddress(placeName, address),
        });
      }

      if (!placeId) {
        return null;
      }

      return { placeId, placeName, address } satisfies PlacesAutocompletePrediction;
    })
    .filter((item): item is PlacesAutocompletePrediction => item !== null);

/**
 * Google Maps–style Places search:
 * Autocomplete + Text Search (biased + India-wide) + legacy Find Place / Text Search.
 * Unique codes like "E20RWCM" skip local bias so national POIs still match.
 */
export const searchGooglePlaces = async (
  query: string,
  location?: MapCoordinate | null,
  options?: SearchPlacesOptions,
): Promise<PlacesAutocompletePrediction[]> => {
  const key = env.googlePlacesApiKey;
  if (!key) {
    throw new PlacesError(
      'NO_KEY',
      'Google Places API key is not configured. Add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to .env.',
    );
  }

  const sessionToken = options?.sessionToken ?? createPlacesSessionToken();
  const uniqueToken = isUniquePlaceToken(query);
  const hasLocation =
    !!location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude);
  const locationBias =
    hasLocation && !uniqueToken
      ? {
          circle: {
            center: {
              latitude: location!.latitude,
              longitude: location!.longitude,
            },
            radius: LOCATION_BIAS_RADIUS_METERS,
          },
        }
      : undefined;

  const headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': key,
  };

  const runTextSearch = async (bias?: typeof locationBias): Promise<PlacesAutocompletePrediction[]> => {
    const body: Record<string, unknown> = {
      textQuery: query,
      languageCode: 'en',
      regionCode: 'IN',
      maxResultCount: SEARCH_RESULT_LIMIT,
    };
    if (bias) {
      body.locationBias = bias;
    }

    const response = await fetchWithTimeout(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          ...headers,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.location,places.shortFormattedAddress,places.viewport,places.types',
        },
        body: JSON.stringify(body),
      },
      options?.signal,
    );

    if (!response.ok) {
      throw mapHttpStatusToPlacesError(response.status, await response.text().catch(() => ''));
    }

    const data = (await response.json()) as { places?: GoogleTextPlace[] };
    return mapTextSearchPlaces(data.places, query);
  };

  const autocompletePromise = (async (): Promise<PlacesAutocompletePrediction[]> => {
    const body: Record<string, unknown> = {
      input: query,
      languageCode: 'en',
      includeQueryPredictions: true,
      regionCode: 'IN',
      includedRegionCodes: ['IN'],
      sessionToken,
    };
    if (locationBias) {
      body.locationBias = locationBias;
    } else if (hasLocation) {
      // Soft bias only — never restrict. Helps ranking without hiding distant POIs.
      body.locationBias = {
        circle: {
          center: {
            latitude: location!.latitude,
            longitude: location!.longitude,
          },
          radius: LOCATION_BIAS_RADIUS_METERS,
        },
      };
    }

    const response = await fetchWithTimeout(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      },
      options?.signal,
    );

    if (!response.ok) {
      throw mapHttpStatusToPlacesError(response.status, await response.text().catch(() => ''));
    }

    const data = (await response.json()) as {
      suggestions?: Array<{
        placePrediction?: {
          placeId?: string;
          place?: string;
          text?: { text?: string };
          structuredFormat?: {
            mainText?: { text?: string };
            secondaryText?: { text?: string };
          };
        };
        queryPrediction?: {
          text?: { text?: string };
        };
      }>;
    };

    const predictions: PlacesAutocompletePrediction[] = [];

    for (const suggestion of data.suggestions ?? []) {
      const place = suggestion.placePrediction;
      if (place) {
        const placeId = normalizeGooglePlaceId(place.placeId ?? place.place);
        if (!placeId) {
          continue;
        }
        predictions.push({
          placeId,
          placeName: place.structuredFormat?.mainText?.text ?? place.text?.text ?? query,
          address:
            place.text?.text ??
            [place.structuredFormat?.mainText?.text, place.structuredFormat?.secondaryText?.text]
              .filter(Boolean)
              .join(', '),
        });
        continue;
      }

      const queryText = suggestion.queryPrediction?.text?.text?.trim();
      if (queryText && queryText.toLowerCase() !== query.toLowerCase()) {
        predictions.push({
          placeId: `gquery:${encodeURIComponent(queryText)}`,
          placeName: queryText,
          address: 'Search nearby places',
        });
      }
    }

    return predictions;
  })();

  const textSearchIndiaPromise = runTextSearch(undefined);
  const textSearchBiasedPromise =
    locationBias || (hasLocation && uniqueToken)
      ? runTextSearch(
          hasLocation
            ? {
                circle: {
                  center: {
                    latitude: location!.latitude,
                    longitude: location!.longitude,
                  },
                  radius: LOCATION_BIAS_RADIUS_METERS,
                },
              }
            : undefined,
        )
      : Promise.resolve([] as PlacesAutocompletePrediction[]);

  const runLegacyFindPlace = async (): Promise<PlacesAutocompletePrediction[]> => {
    const params = new URLSearchParams({
      input: query,
      inputtype: 'textquery',
      fields: 'place_id,name,formatted_address,geometry',
      key,
      language: 'en',
    });
    if (hasLocation) {
      params.set('locationbias', `circle:${LOCATION_BIAS_RADIUS_METERS}@${location!.latitude},${location!.longitude}`);
    }

    const response = await fetchWithTimeout(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?${params.toString()}`,
      undefined,
      options?.signal,
    );
    const data = (await response.json()) as {
      status: string;
      candidates?: Array<{
        place_id?: string;
        name?: string;
        formatted_address?: string;
        geometry?: { location?: { lat: number; lng: number } };
      }>;
    };

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return [];
    }

    return (data.candidates ?? [])
      .map((candidate) => {
        const placeId = candidate.place_id;
        if (!placeId) {
          return null;
        }
        const placeName = candidate.name ?? query;
        const address = candidate.formatted_address ?? placeName;
        const latitude = candidate.geometry?.location?.lat;
        const longitude = candidate.geometry?.location?.lng;
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          cacheGooglePlace(placeId, {
            placeName,
            address,
            latitude: latitude!,
            longitude: longitude!,
            addressLevels: levelsFromLabeledAddress(placeName, address),
          });
        }
        return { placeId, placeName, address } satisfies PlacesAutocompletePrediction;
      })
      .filter((item): item is PlacesAutocompletePrediction => item !== null);
  };

  const runLegacyTextSearch = async (): Promise<PlacesAutocompletePrediction[]> => {
    const params = new URLSearchParams({
      query,
      key,
      language: 'en',
      region: 'in',
    });
    if (hasLocation) {
      params.set('location', `${location!.latitude},${location!.longitude}`);
      params.set('radius', String(LOCATION_BIAS_RADIUS_METERS));
    }

    const response = await fetchWithTimeout(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`,
      undefined,
      options?.signal,
    );
    const data = (await response.json()) as {
      status: string;
      results?: Array<{
        place_id: string;
        name?: string;
        formatted_address?: string;
        geometry?: { location?: { lat: number; lng: number } };
      }>;
    };

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      return [];
    }

    return (data.results ?? []).map((result) => {
      const placeName = result.name ?? query;
      const address = result.formatted_address ?? placeName;
      const latitude = result.geometry?.location?.lat;
      const longitude = result.geometry?.location?.lng;
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        cacheGooglePlace(result.place_id, {
          placeName,
          address,
          latitude: latitude!,
          longitude: longitude!,
          addressLevels: levelsFromLabeledAddress(placeName, address),
        });
      }
      return {
        placeId: result.place_id,
        placeName,
        address,
      };
    });
  };

  const runLegacyAutocomplete = async (): Promise<PlacesAutocompletePrediction[]> => {
    const params = new URLSearchParams({
      input: query,
      key,
      language: 'en',
      components: 'country:in',
    });
    if (hasLocation && !uniqueToken) {
      params.set('location', `${location!.latitude},${location!.longitude}`);
      params.set('radius', String(LOCATION_BIAS_RADIUS_METERS));
    }

    const response = await fetchWithTimeout(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`,
      undefined,
      options?.signal,
    );
    const data = (await response.json()) as PlacesAutocompleteResponse;

    if (data.status === 'REQUEST_DENIED' || data.status === 'INVALID_REQUEST') {
      throw new PlacesError(
        'INVALID_KEY',
        data.error_message ??
          'Places Autocomplete denied. Enable Places API and check API key restrictions.',
      );
    }
    if (data.status === 'OVER_QUERY_LIMIT') {
      throw new PlacesError('RATE_LIMIT', 'Search limit reached. Please try again shortly.');
    }
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new PlacesError(
        'UNKNOWN',
        data.error_message ?? `Legacy Places autocomplete failed (${data.status})`,
      );
    }

    return (data.predictions ?? []).map((prediction) => ({
      placeId: prediction.place_id,
      placeName: prediction.structured_formatting?.main_text ?? prediction.description,
      address: prediction.description,
    }));
  };

  const [autocompleteResult, textIndiaResult, textBiasedResult] = await Promise.allSettled([
    autocompletePromise,
    textSearchIndiaPromise,
    textSearchBiasedPromise,
  ]);

  if (options?.signal?.aborted) {
    return [];
  }

  const settledList = (
    result: PromiseSettledResult<PlacesAutocompletePrediction[]>,
  ): PlacesAutocompletePrediction[] => (result.status === 'fulfilled' ? result.value : []);

  const autocomplete = settledList(autocompleteResult);
  const textIndia = settledList(textIndiaResult);
  const textBiased = settledList(textBiasedResult);

  // Text Search first for place-name / code queries (matches Google Maps search box).
  let merged = dedupePredictions(
    uniqueToken
      ? [...textIndia, ...textBiased, ...autocomplete]
      : [...autocomplete, ...textIndia, ...textBiased],
    SEARCH_RESULT_LIMIT,
  );

  if (merged.length === 0) {
    if (options?.signal?.aborted) {
      return [];
    }
    const [findPlace, legacyText, legacyAuto] = await Promise.allSettled([
      runLegacyFindPlace(),
      runLegacyTextSearch(),
      runLegacyAutocomplete(),
    ]);

    merged = dedupePredictions(
      [...settledList(findPlace), ...settledList(legacyText), ...settledList(legacyAuto)],
      SEARCH_RESULT_LIMIT,
    );

    if (merged.length === 0) {
      const primaryRejected =
        autocompleteResult.status === 'rejected' && textIndiaResult.status === 'rejected';
      if (primaryRejected) {
        const reason =
          autocompleteResult.status === 'rejected'
            ? autocompleteResult.reason
            : textIndiaResult.status === 'rejected'
              ? textIndiaResult.reason
              : new Error('Place search failed');
        if (isPlacesCancelled(reason) || options?.signal?.aborted) {
          return [];
        }
        throw mapFetchFailureToPlacesError(reason);
      }
    }
  }

  return merged;
};

export const resolveGooglePlaceDetails = async (
  placeId: string,
  fallback: { placeName: string; address: string },
  sessionToken?: string,
): Promise<SelectedDestination | null> => {
  const key = env.googlePlacesApiKey;
  if (!key) {
    return null;
  }

  const cached = getCachedGooglePlace(placeId);
  if (cached) {
    return cached;
  }

  const normalized = normalizeGooglePlaceId(placeId);
  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(normalized)}`);
  if (sessionToken) {
    url.searchParams.set('sessionToken', sessionToken);
  }

  try {
    const response = await fetchWithTimeout(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask':
          'id,displayName,formattedAddress,location,viewport,shortFormattedAddress',
      },
    });

    if (!response.ok) {
      return null;
    }

    const place = (await response.json()) as {
      displayName?: { text?: string };
      formattedAddress?: string;
      shortFormattedAddress?: string;
      location?: { latitude?: number; longitude?: number };
      viewport?: {
        low?: { latitude?: number; longitude?: number };
        high?: { latitude?: number; longitude?: number };
      };
    };

    const latitude = place.location?.latitude;
    const longitude = place.location?.longitude;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    const placeName = place.displayName?.text ?? fallback.placeName;
    const address =
      place.formattedAddress ?? place.shortFormattedAddress ?? fallback.address;
    const viewport = place.viewport;
    const boundary =
      viewport?.high && viewport?.low
        ? viewportToBoundary({
            northeast: {
              latitude: viewport.high.latitude ?? latitude!,
              longitude: viewport.high.longitude ?? longitude!,
            },
            southwest: {
              latitude: viewport.low.latitude ?? latitude!,
              longitude: viewport.low.longitude ?? longitude!,
            },
          })
        : undefined;

    const destination: SelectedDestination = {
      placeName,
      address,
      latitude: latitude!,
      longitude: longitude!,
      boundary,
      addressLevels: levelsFromLabeledAddress(placeName, address),
    };
    cacheGooglePlace(normalized, destination);
    return destination;
  } catch {
    return null;
  }
};

export const fetchGoogleNearbyPlaces = async (
  coordinate: MapCoordinate,
  signal?: AbortSignal,
): Promise<PlacesAutocompletePrediction[]> => {
  const key = env.googlePlacesApiKey;
  if (!key) {
    return [];
  }

  try {
    const response = await fetchWithTimeout(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask':
            'places.id,places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location',
        },
        body: JSON.stringify({
          maxResultCount: 10,
          locationRestriction: {
            circle: {
              center: {
                latitude: coordinate.latitude,
                longitude: coordinate.longitude,
              },
              radius: 3000,
            },
          },
        }),
      },
      signal,
    );

    if (!response.ok) {
      // Fallback to legacy Nearby Search.
      const params = new URLSearchParams({
        location: `${coordinate.latitude},${coordinate.longitude}`,
        rankby: 'distance',
        type: 'point_of_interest',
        key,
        language: 'en',
      });
      const legacy = await fetchWithTimeout(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${params.toString()}`,
        undefined,
        signal,
      );
      const data = (await legacy.json()) as {
        status: string;
        results?: Array<{ place_id: string; name?: string; vicinity?: string }>;
      };
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        return [];
      }
      return (data.results ?? []).slice(0, 8).map((result) => ({
        placeId: result.place_id,
        placeName: result.name ?? 'Nearby place',
        address: result.vicinity ?? '',
      }));
    }

    const data = (await response.json()) as {
      places?: Array<{
        id?: string;
        displayName?: { text?: string };
        formattedAddress?: string;
        shortFormattedAddress?: string;
        location?: { latitude?: number; longitude?: number };
      }>;
    };

    return (data.places ?? [])
      .map((place) => {
        const placeId = normalizeGooglePlaceId(place.id);
        if (!placeId) {
          return null;
        }
        const placeName = place.displayName?.text ?? 'Nearby place';
        const address = place.formattedAddress ?? place.shortFormattedAddress ?? '';
        if (
          Number.isFinite(place.location?.latitude) &&
          Number.isFinite(place.location?.longitude)
        ) {
          cacheGooglePlace(placeId, {
            placeName,
            address,
            latitude: place.location!.latitude!,
            longitude: place.location!.longitude!,
            addressLevels: levelsFromLabeledAddress(placeName, address),
          });
        }
        return { placeId, placeName, address };
      })
      .filter((item): item is PlacesAutocompletePrediction => item !== null);
  } catch {
    return [];
  }
};
